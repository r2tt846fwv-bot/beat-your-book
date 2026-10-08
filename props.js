const {impliedAmerican}=require('./engine');
const PROP_MARKETS=['player_pass_yds','player_pass_tds','player_pass_interceptions','player_rush_yds','player_rush_attempts','player_reception_yds','player_receptions','player_anytime_td'];
function marketLabel(k){return ({player_pass_yds:'Pass yards',player_pass_tds:'Pass TDs',player_pass_interceptions:'Interceptions',player_rush_yds:'Rush yards',player_rush_attempts:'Rush attempts',player_reception_yds:'Receiving yards',player_receptions:'Receptions',player_anytime_td:'Anytime TD'})[k]||k}
function normalizeEventProps(event,bookmaker='betmgm'){
 const b=(event.bookmakers||[]).find(x=>x.key===bookmaker)||event.bookmakers?.[0]; if(!b)return [];
 const rows=[]; for(const m of b.markets||[])for(const o of m.outcomes||[]){
  const player=o.description||o.name; const side=o.description?(o.name||'Yes'):(o.name||'');
  rows.push({eventId:event.id,home:event.home_team,away:event.away_team,date:event.commence_time,book:b.title,bookKey:b.key,market:m.key,marketLabel:marketLabel(m.key),lastUpdate:m.last_update||b.last_update,player,side,point:o.point??null,odds:o.price,impliedProbability:impliedAmerican(o.price),modelProbability:null,edge:null,confidence:null,modelStatus:'market-only'});
 }
 return rows;
}
function groupPairs(rows){const map=new Map();for(const r of rows){const key=[r.eventId,r.market,r.player,r.point].join('|');if(!map.has(key))map.set(key,[]);map.get(key).push(r)}return [...map.values()]}
function deVigProps(rows){for(const pair of groupPairs(rows)){if(pair.length!==2)continue;const ps=pair.map(x=>x.impliedProbability);const s=ps.reduce((a,b)=>a+(b||0),0);if(s>0)pair.forEach((x,i)=>x.noVigProbability=ps[i]/s)}return rows}
function rankMarket(rows){return [...rows].sort((a,b)=>(a.market==='player_anytime_td'?-1:0)-(b.market==='player_anytime_td'?-1:0)||(a.impliedProbability??1)-(b.impliedProbability??1))}
module.exports={PROP_MARKETS,normalizeEventProps,deVigProps,rankMarket};
