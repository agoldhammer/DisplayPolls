# DisplayPolls

Static front ends for two of the sites on `ghmr.net`, both served by nginx on
con1. Neither has a build step -- the files here are the files that get
deployed.

| in this repo | deployed to | serves |
|---|---|---|
| `index.html`, `index.js` | `/var/www/pollsite/` | `polls.ghmr.net` -- the poll-chart index |
| `www/index.html` | `/var/www/html/` | `www.ghmr.net` -- landing page linking the three sites |

## polls.ghmr.net

`index.js` builds the chart list at load time by fetching `/polls/` and
parsing nginx's plain autoindex listing, so the vhost must keep
`autoindex on` and `Cache-Control: no-cache` on that location. The charts
themselves are not in this repo: they are PNGs written into
`/var/www/pollsite/polls/` by the daily poll-update cron from the frelec,
GerElec, ItalPolls, and UKPolls repos. Each chart link carries a `?v=<mtime>`
taken from the listing, so a redeployed chart is never served from cache.

Captions live in the `CAPTIONS` map in `index.js`, keyed by PNG filename and
copied from each chart's real title. A chart whose file is renamed upstream
needs its key updated here or it falls back to the bare filename.

## www.ghmr.net

A single self-contained page -- no external fonts, scripts, or images, so it
has no dependencies to break. Each of the three destinations has its own hue,
and the rule under the masthead repeats those hues in the same order as the
entries. Light and dark themes both defined; the layout collapses to one
column under 30rem.

`www.ghmr.net` also keeps a 301 from `/polls/*` to `polls.ghmr.net` (the poll
site lived there until 2026-07-28) and proxies `/actu/api/v1/` to the actu
backend. Both are in `sites-available/noozeconf` on con1, not here.

## Deploying

Copy the changed file to its row in the table above, e.g.

    scp www/index.html con1:/var/www/html/index.html
    scp index.html index.js con1:/var/www/pollsite/
