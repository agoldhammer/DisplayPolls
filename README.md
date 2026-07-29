# DisplayPolls

Static front ends for two of the sites on `ghmr.net`, both served by nginx on
con1. Neither has a build step -- the files here are the files that get
deployed.

| in this repo | deployed to | serves |
|---|---|---|
| `index.html`, `index.js`, `chart.html`, `chart.js`, `captions.js`, `style.css`, `hero-carte-electorale.jpg` | `/var/www/pollsite/` | `polls.ghmr.net` -- the poll-chart index and viewer |
| `www/index.html` | `/var/www/html/` | `www.ghmr.net` -- landing page linking the three sites |

## polls.ghmr.net

Two pages, both carrying the same "Aggregated European Polls" masthead from
`style.css`:

- `index.html` / `index.js` -- the listing, grouped by country.
- `chart.html` / `chart.js` -- the viewer for one chart, reached as
  `chart.html?img=<png>&v=<mtime>`. The listing links here in the same tab
  rather than straight at the PNG, because a bare image has no masthead and
  no way back; the viewer's masthead carries a back link to the index. The
  `img` parameter is accepted only if it is a plain `*.png` filename, so a
  crafted link cannot point the page at an arbitrary URL. Direct
  `/polls/<png>` URLs still work for anyone who bookmarked one.

The index hero, `hero-carte-electorale.jpg`, is a scan of a French *carte
électorale* stamped at twelve elections between 2012 and 2015 -- [the Commons
original][hero], public domain twice over (`PD-JORF`, the card being an
official text, plus a `PD-self` release by the uploader), so it carries no
attribution obligation; the credit under it is courtesy, not a licence term.
The file is the unmodified 960px Commons rendering: the banner crop is done in
CSS (`.hero img`, `object-position`), not baked into the image, so reframing it
is a one-line change and the file stays byte-identical to its source.

[hero]: https://commons.wikimedia.org/wiki/File:Stamped_voter_registration_card_in_France.jpg

`index.js` builds the chart list at load time by fetching `/polls/` and
parsing nginx's plain autoindex listing, so the vhost must keep
`autoindex on` and `Cache-Control: no-cache` on that location. The charts
themselves are not in this repo: they are PNGs written into
`/var/www/pollsite/polls/` by the daily poll-update cron from the frelec,
GerElec, ItalPolls, and UKPolls repos. Each chart link carries a `?v=<mtime>`
taken from the listing, which the viewer passes through to the image request,
so a redeployed chart is never served from cache.

Captions live in the `CAPTIONS` map in `captions.js`, loaded by both pages,
keyed by PNG filename and copied from each chart's real title. A chart whose
file is renamed upstream needs its key updated here or it falls back to the
bare filename.

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

`git push` deploys both rows of the table above automatically, via the
`pre-push` hook in `.githooks/`. A failed copy warns but does not block the
push, so watch its output -- a warning means GitHub has the change and con1
does not.

The hook is tracked, but git only runs hooks from a directory it has been
pointed at, and that setting is per-clone. **In a fresh clone, run this once:**

    git config core.hooksPath .githooks

Until you do, pushing deploys nothing and says nothing. To check a clone is
wired up, `git config --get core.hooksPath` should print `.githooks`.

To deploy without pushing, run the hook directly -- it takes no arguments:

    .githooks/pre-push
