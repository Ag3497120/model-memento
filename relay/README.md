# Relay (Cloudflare Worker)

Lets the web version answer questions its fixed templates miss: the Worker reads the published facts of the selected
model (`data/facts/<xx>.json` on the site, never facts sent by the browser), asks a model to phrase an answer using
only those facts, and returns it only if a check without AI passes (every number and date must appear in the facts it
cites; right language; no links). Otherwise the browser keeps its own records-only answer.

Limits: `DAILY_LIMIT` answers a day in total and `PER_IP_LIMIT` per visitor (kept as a per-day hash of the IP, not
the IP itself). Only the origins in `ALLOWED_ORIGINS` can call it.

## Deploy (you, once)

1. A Cloudflare account (the free plan is enough for Workers AI's daily free allocation; check the current limits on
   Cloudflare's pricing page).
2. In this folder: `npx wrangler@4 login`, then `npx wrangler@4 deploy`. Edit `SITE_URL` and `ALLOWED_ORIGINS` in
   `wrangler.toml` first if the site lives elsewhere.
3. Put the Worker's URL (e.g. `https://model-memento-relay.<you>.workers.dev`) in `web/data/relay.json` as
   `{"url": "..."}` — or build the site with `MODEL_MEMENTO_RELAY_URL=... npm run build:web`.

## Switch to Gemini (Google AI Ultra credits)

`npx wrangler@4 secret put GEMINI_API_KEY`, then set `PROVIDER = "gemini"` and deploy again. Before that, put a budget
alert under the credit amount and a low daily request quota on the API key in Google Cloud: credits do not stop
spending by themselves.

## Check

`curl https://<worker>/health` → `{"ok":true,"provider":"workers-ai"}`. Tests: `node --test test/relay/*.test.js`.
