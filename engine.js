function impliedAmerican(o){if(typeof o!=='number'||!Number.isFinite(o)||o===0)return null;return o<0?(-o)/((-o)+100):100/(o+100)}
function americanFromProb(p){if(!(p>0&&p<1))return null;return Math.round(p>=.5?-100*p/(1-p):100*(1-p)/p)}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function logistic(x){return 1/(1+Math.exp(-x))}
function normalCdf(x){const t=1/(1+.2316419*Math.abs(x)),d=.3989423*Math.exp(-x*x/2);let p=1-d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?p:1-p}
function noVig2(a,b){const pa=impliedAmerican(a),pb=impliedAmerican(b);if(pa==null||pb==null)return [null,null];const s=pa+pb;return [pa/s,pb/s]}
function outcome(market,name){return market?.outcomes?.find(o=>o.name===name)}
function market(book,key){return book?.markets?.find(m=>m.key===key)}
function parseBook(event){const b=event?.bookmakers?.[0];if(!b)return null;const h=market(b,'h2h'),s=market(b,'spreads'),t=market(b,'totals');return {title:b.title,lastUpdate:b.lastUpdate||b.last_update,homeML:outcome(h,event.home)?.price,awayML:outcome(h,event.away)?.price,homeSpread:outcome(s,event.home),awaySpread:outcome(s,event.away),over:outcome(t,'Over'),under:outcome(t,'Under')}}
function teamRating(team,records={}){const r=records[team];if(!r||!r.games)return 0;const mov=(r.pointsFor-r.pointsAgainst)/r.games;const win=(r.wins-r.losses)/Math.max(1,r.games);return clamp(mov*.55+win*2,-12,12)}
function modelGame(game,records={},injuryAdj={},weather={}){
 const book=parseBook(game);if(!book)return {game,reason:'No BetMGM market'};
 const hr=teamRating(game.home,records),ar=teamRating(game.away,records);let projectedMargin=2.0+hr-ar;
 projectedMargin+=(injuryAdj[game.away]||0)-(injuryAdj[game.home]||0);
 let projectedTotal=44.0;const h=records[game.home],a=records[game.away];if(h?.games&&a?.games){const hpf=h.pointsFor/h.games,hpa=h.pointsAgainst/h.games,apf=a.pointsFor/a.games,apa=a.pointsAgainst/a.games;projectedTotal=(hpf+apa+apf+hpa)/2}
 let weatherPenalty=0;if(weather.windMph>=18)weatherPenalty+=2.5;if(weather.precip)weatherPenalty+=1.0;projectedTotal-=weatherPenalty;
 const picks=[];const [mh,ma]=noVig2(book.homeML,book.awayML);const pHome=logistic(projectedMargin/6.7),pAway=1-pHome;
 function add(type,pick,odds,modelP,marketP,details={}){if(odds==null||modelP==null)return;const raw=impliedAmerican(odds);const edge=modelP-(marketP??raw);const ev=raw?modelP/raw-1:null;let confidence=clamp(50+edge*250-(details.uncertainty||0),35,90);picks.push({type,pick,odds,modelProbability:modelP,marketProbability:marketP??raw,edge,expectedValue:ev,confidence:+confidence.toFixed(0),...details})}
 add('Moneyline',`${game.home} ML`,book.homeML,pHome,mh,{projection:`${game.home} by ${projectedMargin.toFixed(1)}`});add('Moneyline',`${game.away} ML`,book.awayML,pAway,ma,{projection:`${game.home} by ${projectedMargin.toFixed(1)}`});
 if(book.homeSpread?.point!=null&&book.homeSpread?.price!=null){const line=book.homeSpread.point;const cover=normalCdf((projectedMargin+line)/13.5);const [ph,pa]=noVig2(book.homeSpread.price,book.awaySpread?.price);add('Spread',`${game.home} ${line>0?'+':''}${line}`,book.homeSpread.price,cover,ph,{projection:`Model margin ${projectedMargin.toFixed(1)}`});if(book.awaySpread)add('Spread',`${game.away} ${book.awaySpread.point>0?'+':''}${book.awaySpread.point}`,book.awaySpread.price,1-cover,pa,{projection:`Model margin ${projectedMargin.toFixed(1)}`})}
 if(book.over?.point!=null&&book.over?.price!=null){const line=book.over.point;const pOver=1-normalCdf((line-projectedTotal)/13.8);const [po,pu]=noVig2(book.over.price,book.under?.price);add('Total',`Over ${line}`,book.over.price,pOver,po,{projection:`Model total ${projectedTotal.toFixed(1)}`,weatherPenalty});if(book.under)add('Total',`Under ${book.under.point}`,book.under.price,1-pOver,pu,{projection:`Model total ${projectedTotal.toFixed(1)}`,weatherPenalty})}
 picks.sort((x,y)=>y.edge-x.edge);return {game,book,projectedMargin:+projectedMargin.toFixed(1),projectedTotal:+projectedTotal.toFixed(1),picks};
}
function rank(all,{minEdge=.025}={}){return all.flatMap(x=>(x.picks||[]).map(p=>({...p,home:x.game.home,away:x.game.away,date:x.game.date,book:x.book?.title,lastUpdate:x.book?.lastUpdate}))).filter(p=>p.edge>=minEdge).sort((a,b)=>(b.edge-a.edge)||(b.confidence-a.confidence))}
function buildParlay(ranked,legs=4){const out=[];const games=new Set();for(const p of ranked){const key=[p.away,p.home,p.date].join('|');if(games.has(key))continue;out.push(p);games.add(key);if(out.length>=legs)break}return out}
module.exports={impliedAmerican,americanFromProb,noVig2,parseBook,modelGame,rank,buildParlay};
