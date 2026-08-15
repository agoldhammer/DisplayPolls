# Decisions

The running record of *why* things are the way they are across the poll
pipeline: the data corrections we accepted or rejected, the cron schedule as it
has moved, and the con1/nginx quirks that bite. Back-filled 2026-08-14 from the
git logs of DisplayPolls, frelec, GerElec, ItalPolls, UKPolls and
`~/Prog/scripts`, from the crontab and run logs, and from the session notes.

Scope is the whole pipeline, not just this repo — the poll site, the four
scraper repos, and the machinery that runs them are one system, and a decision
in any of them usually shows up in the others the same day.

Entries are oldest-first within each section, so a new one goes at the **bottom**
of its section. Give every entry a date, the reasoning (not just the change),
and the commit or file it lives in.

- [Data corrections and parser decisions](#data-corrections-and-parser-decisions)
- [Cron schedule and the update pipeline](#cron-schedule-and-the-update-pipeline)
- [Server, nginx, and deploy](#server-nginx-and-deploy)
- [Front-end decisions](#front-end-decisions)

## Standing rules

These came out of specific incidents below, but they apply to every run:

1. **Sum the row.** When a poll cell is disputed or has changed upstream, add up
   the row's party shares. The variant that lands near 100 is the real number.
   Do this *before* asking anyone to check a source PDF. (2026-08-11)
2. **A changed existing row is usually benign.** `{{TBA}}` or a blank filled in
   with a number is an editor completing a poll, not a parser break. A published
   *number* changing to a different number, or many rows shifting at once, is a
   real problem — stop. (2026-08-09)
3. **Prefer the current wikitext when it is the arithmetically consistent one**,
   even when it contradicts an earlier manual correction of ours. (2026-08-11)
4. **Lab21 and Lab2101 are different institutes.** Never merge them. (2026-07-23)
5. **No dark chart variants.** Never pass `--dark` to frelec's visualize
   scripts. (2026-07-29)

## Data corrections and parser decisions

**2026-06-29 — Whole-number vote shares stay integers** (`frelec 0b99f91`)
`parse_value_cell` coerced every value to float. The CSV convention is plain
integers for whole-number cells; keep it, so diffs against the committed CSV
stay readable.

**2026-07-08 — Le Pen's declared candidacy reshapes the French table**
(`frelec 5b658d4`)
She declared on 2026-07-07; the second-semestre-2026 wikitable dropped the
Villepin and "Autre" columns and renamed RN to Le Pen, so `CANDIDATES` had to
follow. The new table also surfaced two parser bugs: a trailing
event-annotation row merged with the closing `|}` marker wasn't recognized as
non-data, and the `{{Formatnum|...}}` pipe form (vs. the usual `formatnum:`
colon form) wasn't stripped from sample sizes.

**2026-07-09 — France chart PNGs renamed to the `france-` prefix**
(`frelec aa40aa8`, `DisplayPolls a579b2a`)
The listing groups charts by filename prefix (`france`/`german`/`italian`/
`uk_polls`), and the French charts were still `polls_2027_*`, which needed a
hand-made `France-latest.png` alias to appear at all. Renaming removed the
workaround. **A chart renamed upstream needs its key updated in
`captions.js` in the same breath** or it falls back to its bare filename.

**2026-07-13 — `<1` encoded as its midpoint, 0.5** (`frelec ca28433`)
Wikipedia writes upper-bound shares as `<1`. The literal blocked that morning's
automated run. Store 0.5 and keep the original reading in `notes`. The same
commit moved both CSVs from `data/` to the repo root, matching the sibling poll
repos.

**2026-07-15 — Withdrawn Focaldata poll dropped** (`UKPolls aa9221f`)
The Focaldata poll of Mar 6–10 2026 was removed from the Wikipedia source
(dataset withdrawn), so it falls out of the regenerated CSV. Rows can legitimately
*leave* the upstream table — a shrinking row count is not automatically a parser
break.

**2026-07-20 — `{{Hidden|total|breakdown}}` Others cells unwrapped**
(`UKPolls 6db853b`)
Wikipedia started wrapping many Others cells in collapsible templates, which
`parse_polls.py` read as empty. Take the template's visible header (the total).
This also restored Others values for ~25 rows already committed blank, and the
same run picked up Wikipedia's revision of the Jul 10–14 Survation row
(Others 2% → 4%).

**2026-07-23 — Lab21 and Lab2101 are two distinct institutes**
(`ItalPolls f10fc94`)
Per the repo owner: never merge, rename, or dedupe one into the other. Lab21
rows go into `italian_polls.csv` under their own name (first Lab21 poll added
2026-07-17, fieldwork Jul 1–17 2026). The rule is also written into
`poll-updates/prompts/italpolls.txt` so the unattended run can't undo it.
Related: Wikipedia's institute spellings drift (BidiMedia vs BiDiMedia,
Demos&Pi vs "Demos & Pi"), so a name mismatch when diffing the page against the
CSV can look like a new poll when it's a spelling variant of an existing row —
check dates and values before adding.

**2026-07-25 — Second-round `Hypothèse` headings matched at `===` *or* `====`**
(`frelec 001ae9e`)
Wikipedia regrouped the second-round subsections under new "Impliquant Marine
Le Pen" / "Impliquant Jordan Bardella" parents and demoted the `Hypothèse`
headings a level. The old pattern **did not fail loudly**: under `re.DOTALL`,
`=== Hypothèse (.+?) ===` still matched inside `==== ` and then ran past the end
of the line hunting for the next `===`-terminated heading, swallowing whole
subsections — 4 rows parsed where the committed CSV has 45. Fixed by accepting
both depths and anchoring the heading to its own line; verified 45/45 against
the current wikitext. Silent under-parsing is the failure mode to watch for
here, not a crash.

**2026-07-25 — Upstream More in Common correction accepted** (`UKPolls e0842f4`)
Revision 1365828971 filled in PC=1% and Others=3% and left RB blank, where our
parsed copy had RB=2% with PC and Others blank. Verified against the current
wikitext before accepting; no parser change needed.

**2026-07-28 — More in Common PC blank → 1%** (`UKPolls 6aeb945`)
Upstream correction to the existing Jul 24 2026 row, confirmed against the live
wikitext and approved by the repo owner. All other fields on the row unchanged.

**2026-07-29 — Four Survation rows relabelled GB → UK** (`UKPolls 1240f1f`)
Wikipedia's national-polls table now labels the Survation polls with fieldwork
ending 2026-07-25, -07-22, -07-10 and -06-11 as UK rather than GB. Verified as a
genuine upstream edit, not a parser bug or a table-structure change, so the
parser output is taken as-is.

**2026-07-29 — Dark chart variants abolished**
(`frelec ed556bf`, `scripts b6b750e`, `DisplayPolls c628e2a`)
The user asked for "the four dark versions" to go; frelec actually emitted
**five** — `visualize_polls.py` (first_round, first_round_recent,
first_round_pollsters) and `visualize_second_round.py` (trend, snapshot), each
via a `--dark` flag appending a `_dark` suffix — and they confirmed all five.
**Why:** the poll site renders every chart inside its own themed viewer page
now, so a separately generated dark PNG is no longer how a chart gets a dark
presentation; the files were dead weight in the daily run and the deploy.
Removed from the frelec repo, from `/var/www/pollsite/polls/` on con1, from the
frelec cron prompt (replaced by an explicit prohibition), and their five
`(sombre)` keys from `captions.js`. **Both scripts still accept `--dark`, so an
unattended run could put the files back — do not invoke it and do not recreate
the PNGs.**

**2026-07-30 — Institute/pollster charts ordered by poll date, not party share**
(`frelec f62f34c`, `GerElec 7eb2088`, `ItalPolls 98c518d`)
"Sondages par institut" / "Aktuelle Umfragen nach Institut" / "Sondaggi recenti
per istituto" sorted their rows by the RN, AfD and FdI share respectively, which
reads as a ranking of the parties rather than of recency. Sort by the date of
each institute's latest poll, newest at the top. Subtitles and READMEs updated
to match.

**2026-08-04 — Empty wikitable cells preserved** (`UKPolls a2be18c`)
`cells_from_block` dropped cells whose content was empty, silently shifting
every later value one column left. BMG Research/The i Paper (fieldwork
2026-07-30) has a bare empty RB cell, so its Others share (5%) was being read as
RB and its Lead (5) as Others. With empty cells preserved, all 514 pre-existing
rows parse byte-identically to the committed CSV — so the fix only affects rows
an editor leaves bare rather than writing `{{sdash}}`. Same commit: BMG's sample
size filled in upstream as 974, RB stays blank as the wikitext has it.

**2026-08-09 — `{{TBA}}` → number is a benign fill-in, not a revision**
(`UKPolls 7af4024`)
The UK tables use `{{TBA}}` when a pollster has published a poll but not yet a
party's crosstab; `parse_polls.py` renders it blank, which is correct. When an
editor later replaces it with the real number an **existing** CSV row changes,
which the ukpolls prompt (step 4) treats as a stop condition — so the run
reports NEEDS ATTENTION with nothing actually wrong. Happened with More in
Common (fieldwork 29 Jul–2 Aug 2026): `{{TBA}}` in the Plaid Cymru cell at our
2026-08-06 scrape, filled in as 1% by revision 1368415888.
**Triage:** fetch the revision current at the last scrape
(`api.php?action=query&prop=revisions&rvstart=<scrape time>&rvdir=older`, then
`index.php?oldid=<id>&action=raw`) and compare the cell. Blank or `{{TBA}}` →
plain number is benign; merge it and continue. A published number changing to a
*different* number, or many rows shifting at once, means a table-structure
change — stop.

**2026-08-09 — Pollster chart no longer backfills a pollster's blank parties**
(`UKPolls 9143156`)
`plot_pollsters` built each pollster's row with `groupby("pollster").last()`,
which takes the last non-NaN value per column *independently* rather than the
last row. A pollster whose newest poll left a party blank therefore inherited
that party's share from its own earlier poll, and the chart presented the
mixture as one dated poll: "Ipsos (04 Aug)" — a poll reporting only
Lab/Con/Ref/LD/Grn — was showing SNP 3, PC 2, RB 3 and Others 0 carried over
from Ipsos's 30 June poll. JL Partners was affected too. Use
`groupby("pollster").tail(1)`. Only `uk_polls_pollsters.png` was affected; the
other three charts drop NaNs per party already.

**2026-08-10 — Ipsos and More in Common upstream revisions accepted**
(`UKPolls ec1f482`)
Editors revised two existing 2026 rows after our last pull, so the daily update
stopped rather than overwrite them. Both verified against the sources and taken
as-is: Ipsos (published 4 Aug, fieldwork to 30 Jul) had SNP 3, PC 1, RB 4,
Others 8 filled in where the cells were empty, and its client cell is blank
upstream so it is no longer "N/A"; More in Common (published 2 Aug) had its
fieldwork start corrected from 2026-07-29 to 2026-07-31. No new polls; 521 rows.

**2026-08-11 — Ipsos Others corrected to 1%, and the row-sum rule**
(`UKPolls a2cddc3`)
The run stopped on the same Ipsos row a second time — Others had gone 8% → 1%,
reversing part of the manual "verified against the source" fix in `ec1f482`.
The other shares (Lab 28 / Con 18 / Ref 25 / LD 9 / Grn 12 / SNP 3 / PC 1 /
RB 4) already sum to 100, so Others 8 put the row at 108 while Others 1 gives
101, consistent with rounding. The owner directed taking 1%; the arithmetic
agreed. **This is the general rule:** when a cell is disputed, sum the row's
party shares and take the variant that lands near 100 — it usually settles the
question without the source PDF, and it can override an earlier manual
correction of ours.

## Cron schedule and the update pipeline

The daily update of the four poll repos (frelec, GerElec, ItalPolls, UKPolls,
all under `~/Prog/`) is a **local crontab on this WSL machine**, not a cloud
routine. Each entry runs
`~/.local/bin/poll-update-run.sh <name> <repo-path> <prompt-file>`, which
launches a headless `claude -p` session (sonnet, $3 budget, 20h rerun guard)
against a per-repo prompt. Logs go to `~/.local/share/poll-updates/logs/`
(90-day retention); every session ends with `STATUS: UPDATED`,
`STATUS: NO CHANGE`, or `STATUS: NEEDS ATTENTION`. Cron only fires while WSL is
up — there is no anacron.

**2026-07-08/09 — Pipeline established.** Four staggered entries at
10:00 / 10:15 / 10:30 / 10:45. Staggering exists only to avoid concurrent
`claude` sessions; the 20h guard in the wrapper is what prevents double runs.

**2026-07-13 — Email after *every* run, not just on change.** The user asked for
no-change notifications as well as new-poll ones, so that **silence means the
run itself failed**. The subject encodes repo + status; the body is the log,
whose summary paragraph names new polls and updated charts (prompt step 9).
Sending goes through the standalone `~/Prog/scripts/gmail/gmail_send.py`
(`uv run`, `token.json` alongside it, `gmail.send` scope) — the claude.ai Gmail
MCP connector can only create drafts, not send, so use the script when a session
needs to actually send mail.

**2026-07-16 — `@reboot` catch-up added.** Because cron only runs while WSL is
up, morning slots are simply missed when the machine is off.
`poll-update-catchup.sh` runs the four wrappers **sequentially** (again, to
avoid concurrent sessions) after a 120s wait for networking/DNS; `--now` skips
the wait. The 20h guard makes it a silent no-op on days the run already
happened.

**2026-07-25 — Wrappers, prompts and the Gmail helper put under version
control** (`scripts b3e6d53`)
They had been running unversioned. They now live in the git repo at
`~/Prog/scripts` (branch `main`, **local only, no remote**), and the fixed paths
cron references are symlinks into it — `~/.local/bin/poll-update-*.sh` and
`~/.local/share/poll-updates/prompts`. **Edit the repo copy, not the symlink
path.** `gmail/credentials.json` (OAuth client secret) and `gmail/token.json`
(live refresh token, mode 0600) stay gitignored; the repo README records how to
regenerate them. Runtime state stays outside git: logs in
`~/.local/share/poll-updates/logs/`, run stamps and failed-send markers in
`~/.local/state/poll-updates/`.

**2026-07-25 — `gmail_send.py` retries transient `invalid_grant`.**
On 2026-07-17 and again on 2026-07-25 all four runs succeeded but every send
died with `invalid_grant: Token has been expired or revoked`, so no email
arrived and it looked like the polls hadn't updated. **This is transient, not a
revocation:** on 07-25 the very same unchanged refresh token completed a forced
grant ~40 minutes later and sent fine. Do **not** conclude the OAuth consent
screen is in Testing status — the app (project `double-insight-112220`, client
`189138337028-0q1etf96d4dtnfsbjlv5dgf67cd980ep`) is already **In production**,
so the 7-day Testing token expiry does not apply; that theory was checked and
disproved on 2026-07-25, and re-running `gmail_auth.py` is not the fix.
Now: 3 attempts with ~30s then ~60s backoff plus jitter (`--attempts` /
`--backoff` to override), and a send that still fails leaves
`~/.local/state/poll-updates/<repo>.send_failed` plus a line in
`send-failures.log`, with the next successful email carrying an
"N earlier notification(s) never sent" preamble. **A quiet morning is at least
as likely to be a send failure as a run failure — check the logs and those
markers before concluding anything.**

**2026-07-27 — Stagger tightened from 15 minutes to 5.** Now
10:00 / 10:05 / 10:10 / 10:15. Typical runs finish in 1–3 minutes, but the
observed worst case is ~4m40s, so on a heavy day two sessions can briefly
overlap. Widen the spacing again if that starts to bite.

**2026-08-03 — Whole run moved from 10:00 to 8:30** (`scripts d3a4fd6`)
At the user's request. The four entries are now 8:30 / 8:35 / 8:40 / 8:45,
first run at the new times on 2026-08-04; the commit keeps the catch-up
runner's comment in step with the crontab.

## Server, nginx, and deploy

con1 (Ubuntu 22.04, nginx, public IP 154.38.179.84) serves four vhosts:

| host | root | config in `/etc/nginx/sites-available/` |
|---|---|---|
| `www.ghmr.net` | `/var/www/html` | `noozeconf` (first server block) |
| `polls.ghmr.net` | `/var/www/pollsite` | `pollsite.conf` |
| `nooz.ghmr.net` + `news.ghmr.net` | `/var/www/nooz` | `noozeconf` (second block; one cert covers both names) |
| `art.ghmr.net` | `/var/www/artsite` | `artsite.conf` |

All four use Let's Encrypt with the **nginx authenticator**, not webroot — which
is why moving content between roots has never broken renewal. Keep it that way.

**Standing quirk — `/polls/` must keep `autoindex on` and
`Cache-Control: no-cache`.** `index.js` builds the chart list at load time by
fetching `/polls/` and parsing nginx's plain autoindex listing. Without
`autoindex` the page renders empty; without `no-cache` it lists stale charts.
The charts themselves are not in this repo — they are PNGs written into
`/var/www/pollsite/polls/` by the daily cron from the four scraper repos.

**Standing quirk — sudo on con1 needs a password.** Plain `ssh con1 sudo ...`
fails with "a terminal is required". Use the ssh-manager MCP tool
`ssh_execute_sudo` (server `con1`), which has the password configured. sudo only
elevates the *first* command of an `&&` chain, so wrap multi-command chains in
`bash -c '...'`. Heredocs conflict with the password prompt — write files
locally and `scp` them instead.

**2026-07-06 — `/polls/` referenced by absolute path** (`910d3b2`)
Relative paths broke as soon as the listing was reachable from more than one URL.

**2026-07-08 — Last-updated date computed from the autoindex, not hardcoded**
(`fef02c9`, `28af07b`)
Parses the `DD-Mon-YYYY HH:MM` timestamps nginx prints next to each file in the
`/polls/` listing and shows the most recent one next to the page header, so it
stays accurate as the cron pushes new charts. Another dependency on the
autoindex staying on.

**2026-07-13 — `?v=<mtime>` cache-buster on every chart link** (`8cfdff9`)
The site serves `Cache-Control: no-cache` now, but the query keyed to each PNG's
autoindex mtime also defeats any stale copy cached *before* that header existed.
The listing fetch revalidates for the same reason.

**2026-07-28 — The poll site moved to its own vhost**
(`DisplayPolls d5cf4e1`, `scripts 3cdb7d4`, `frelec 696186c`, `GerElec 48abe72`,
`UKPolls 2f35abc`)
It had been living at `/var/www/html` on `www.ghmr.net`. Content moved to
`/var/www/pollsite` under the new `polls.ghmr.net` vhost, and `/var/www/html`
became a hand-written landing page linking the three public sites.
`www.ghmr.net/polls/*` **still 301-redirects** to `polls.ghmr.net` so old chart
links resolve — keep it. The `/actu/api/v1/` proxy to `127.0.0.1:33433`
(supervisor `actur-cloud.conf`) stayed on `www.ghmr.net`: it is a more specific
prefix than `location /`, so it survives whatever `location /` does. Both live
in `sites-available/noozeconf` on con1, not in this repo. The same day, all four
poll repos had their deployment-recency check repointed from
`/var/www/html/polls` to `/var/www/pollsite/polls`, and the cron deploy targets
and 200-check URLs were updated.

**2026-07-28 — The deploy hook is tracked in `.githooks/`**
(`3dba629`, `60aa8ed`)
The `pre-push` deploy lived in `.git/hooks`, so it was invisible to review and
absent from any clone — which is how it kept copying the poll site into
`/var/www/html` for hours after that stopped being the poll site's home.
Tracking it means the deploy targets change in the same commit as the thing that
makes them change. **`core.hooksPath` is per-clone:** run
`git config core.hooksPath .githooks` once in a fresh clone, or pushing deploys
nothing and says nothing. Deploy failures **warn but do not block the push**,
since GitHub and con1 are independent concerns — a warning means GitHub has the
change and con1 does not, so watch the output. To deploy without pushing, run
`.githooks/pre-push` directly; it takes no arguments.

## Front-end decisions

**2026-07-08 — Charts grouped by country, captioned with real chart titles**
(`751fde7`, `01a3130`)
Filenames aren't meaningful to readers, so each caption is the chart's actual
title as set in the generating script. Captions live in the `CAPTIONS` map in
`captions.js`, keyed by PNG filename; a chart renamed upstream needs its key
updated here or it falls back to the bare filename.

**2026-07-09 — Thumbnails replaced by text links** (`b61ba33`)
A dozen chart thumbnails made the page heavy and slow to scan; captioned links
load instantly and still identify each chart.

**2026-07-29 — Charts open in a viewer page, in the same tab** (`176b32e`)
This reverses `e93224b` (2026-07-25), which opened the PNGs in a new tab so the
listing stayed put. A bare image has no masthead and no way back to the listing,
so charts now open in `chart.html?img=<png>&v=<mtime>`, whose masthead carries a
back link. The `?v=` cache-buster is passed through to the image request so
redeployed charts still can't be served from cache, and direct `/polls/<png>`
URLs keep working for anyone who bookmarked one. **`img` is accepted only if it
is a plain `*.png` filename**, so a crafted link cannot aim the page at an
arbitrary URL. `CAPTIONS` moved to `captions.js` so both pages share one copy.

**2026-07-29 — The index hero is the unmodified Commons file** (`396ce9a`)
`hero-carte-electorale.jpg` is a scan of a French *carte électorale* stamped at
twelve elections between 2012 and 2015. It is public domain twice over —
`PD-JORF`, the card being an official text, plus a `PD-self` release by the
uploader — so the credit under it is **courtesy, not a licence term**. The
shipped file is the unmodified 960px Commons rendering; the band crop that keeps
the stamped dates and the "CARTE ÉLECTORALE" title in frame is done in CSS
(`.hero img`, `object-position`), so reframing it later doesn't mean re-cutting
the image and the file stays byte-identical to its source.
