# Beat the Bookie v0.4 — Player Props + Anytime TD

Prototype NFL betting-analysis app with BetMGM markets through The Odds API.

## New in v0.4
- `/api/prop-events` gets current NFL event IDs.
- `/api/props?eventId=...` requests BetMGM player props one game at a time.
- Markets: pass yards/TDs/INTs, rush yards/attempts, receiving yards/receptions, anytime TD.
- De-vigs paired Over/Under player markets when both sides are returned.
- UI shows anytime-TD and player-prop markets for upcoming games.
- Safety/quality guard: prop rows remain `market-only` until a validated player projection exists; the app does not fabricate a model edge.

## Configure
Copy `.env.example` to `.env` and set your existing Odds API key:
`ODDS_API_KEY=...`
`ODDS_BOOKMAKER=betmgm`

## Run
Requires Node 18+.
`npm start`
Open `http://localhost:3000`.

## Free-tier note
Player props use the event-odds endpoint and can consume credits quickly. This build fetches only the first four upcoming games on page load. For production, add server caching and fetch props on-demand when a user opens a matchup.
