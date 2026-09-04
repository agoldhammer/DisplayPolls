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
2. **A changed existing row is usually benign — accept it without asking.**
   `{{TBA}}` or a blank filled in with a number, a lumped Others split out, or a
   published number corrected against the pollster's own tables, is an editor
   emendation, not a parser break. Confirm it with rule 1 and by finding the
   revision that touched the row, then take it and *report* it: the owner wants
   these made autonomously and notified afterwards, with the reasoning.
   (2026-08-16, superseding the stop-and-ask rule of 2026-08-09)
2a. **Still stop for a structural break.** Many rows shifting at once, values
   landing in the wrong columns, rows disappearing, sums moving *away* from 100,
   or no revision that accounts for the change. (2026-08-09)
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

**2026-08-16 — Editor emendations are now accepted without asking**
(`UKPolls f4081b0`, `scripts 24dafe4`)
The 08-16 run stopped again, on two rows: JL Partners/Bloomberg (fieldwork
1–3 Aug 2026) went Con 21→20, SNP blank→2, PC blank→1, Others 7→3, and
Trajectory Partnership (fieldwork 5–14 May 2026) went Lab 24→26, Con 17→18,
Ref 25→27, LD 10→11. Row sums moved 102→100 and 93→99, and the wikitext diff
across revisions 1369538818–1369543935 shows a single editor (Jamie Eilat,
15 Aug) re-reading the pollsters' own tables — updating each row's access-date
and source URL alongside the numbers, and splitting JL Partners' lumped Others
into SNP and PC. Accepted, with the two new polls behind them (Opinium/Observer
10–12 Aug; Trajectory 5–12 Aug).

That is the third time in a week the pipeline halted on what turned out to be a
Wikipedia editor correcting a published poll against its source. The owner
directed that this class be handled autonomously and reported afterwards, so the
three Wikipedia-sourced prompts (`ukpolls`, `italpolls`, `frelec`) now **triage**
an altered row instead of stopping: row-sum check plus the revision that touched
the row. Editor emendation → accept, and name the correction in the commit
message and in the emailed summary along with the assessment of why the editor
made it. Structural break → still stop, unchanged: many rows shifting at once,
values landing in the wrong columns, rows disappearing, sums moving *away* from
100, or no revision accounting for the change. The distinction matters because
the old blanket rule ("every existing row byte-for-byte unchanged") was written
to catch a parser break, and a benign correction trips it identically.
`gerelec` was deliberately left on the strict rule — it reads the DAWUM API,
not Wikipedia, so there are no editor emendations to accept.

**2026-08-20 — The French parser reads each sub-table's own header**
(`frelec`, `scripts`)
`parse_polls.py`'s `CANDIDATES` was one fixed, positional column list, but
Wikipedia splits a year into dated sub-tables with **different** columns
whenever a candidate enters or leaves the race: "Premier semestre 2026" has a
Villepin column, "Second semestre 2026" does not. One list cannot be right for
both, so a fresh parse of the second table shifted every value from Villepin
rightward by one column. The committed rows for 7–10 July were hand-corrected
back, which is why the CSV looked right while the parser stayed wrong — and why
the 08-20 run flagged that the next batch of new polls in that section would
need the same manual remap. The parser now reconstructs each table's header
grid (honouring `rowspan`/`colspan`, since the header is portraits over
names-and-parties with `Autre` spanning both) and derives that table's columns
from it, so no remap is needed. `CANDIDATES` survives as the canonical CSV
column order plus the registry of known candidates; a column set that differs
from it is reported on stderr, and the frelec prompt's step 3 now tells the
run what each of those lines means.

Two behaviours fall out of that. `FIRST_ROUND_ALIASES` folds `LePen_RN` onto
`RN` so the party's slot stays one series across the 2026-07-07
placeholder→named switch (the second-round tables keep `LePen_RN` and
`Bardella_RN` distinct on purpose — there the match-up identity is the point).
And `route_other` sends an `Autre` value whose note names a candidate who
*used* to have a column back into that column: Villepin is still polled, just
folded into `Autre` with a `<br><small>` note, and leaving him there would
break his series on the date the column was dropped. A note naming somebody
who never had a column (Ruffin) stays in `Autre`, and a note in a candidate's
*own* column is a substitution (`Glucksmann_PP=9.0 (Hollande (PS))`) and also
stays put. Verified by re-parsing: the 77 rows of 2026 now come out identical
to the committed CSV, and the second round is unchanged.

**2026-08-20 — "Harris Interactive" folded back into "Harris"** (`frelec`)
Found while verifying the above. The five 7–8 July rows called the institute
"Harris Interactive" while the other eleven Harris rows called it "Harris",
which is what the wikitext says for all sixteen; the long form was introduced
by hand in `ca28433` alongside the column remap. It split one institute into
two in `france-first_round_pollsters.png`, and it would have made every future
daily run diff on those five rows forever and re-triage them as an unexplained
change. Taking the source's spelling makes a fresh parse reproduce the CSV
byte for byte, which is the property that keeps the daily diff meaningful.

**2026-08-27 — A new runoff match-up gets its own palette slot, unattended**
(`frelec 2f0a6cd`)
Wikipedia's second-round section grew a new "Hypothèse Hollande – Le Pen"
subsection carrying one row (Ifop, 24–25 août 2026, n=1598, Hollande 46 /
Le Pen 54), and the same Ifop poll added five more second-round rows and seven
first-round scenarios. The 08-27 run parsed all of it cleanly, then crashed
regenerating the charts: `CHALLENGERS` in `visualize_second_round.py` had no
entry for `Hollande_PS`, and the run reverted everything and reported NEEDS
ATTENTION on the grounds that inventing a candidate color was a design
decision it was not authorised to make unattended. Nothing was wrong with the
data — a first-time challenger simply has no color yet.

Hollande gets his own slot rather than a reused one: in the first-round table
he is only a substitution note inside Glucksmann's column
(`Glucksmann_PP=12.0 (Hollande (PS))`), so he has no `SERIES` entry to inherit,
and borrowing another candidate's hue would break the repo's one rule about
color — a candidate's color is the same in every chart. The hex was chosen by
sweeping OKLCH hue/lightness/chroma against the nine committed series colors
with the dataviz skill's `validate_palette.js`: light `#991b5e`, worst pair
ΔE 11.3 (vs. Ruffin); dark `#b43d83`, worst pair ΔE 8.3 (vs. Philippe, and 7.4
vs. Zemmour, who never appears in a runoff table). The rose-magenta family is
forced rather than chosen — every light candidate nearer the magenta end
collides with Glucksmann's indigo under deuteranopia (ΔE 4–6), and the
light-blue options that score best on paper sit under the normal-vision floor
against RN blue, which they would be stacked directly against in the snapshot
chart. **The validator still FAILs the full set on all-pairs**: those are the
pre-existing Ruffin/Attal (light) and RN/Glucksmann, Ruffin/Melenchon (dark)
pairs, none of them involving the new slot, and the charts direct-label every
series. Do not read that FAIL as a verdict on a newly added color — check
which pair it names.

**The owner directed that this class be handled without asking and reported
afterwards**, the same standing arrangement as editor emendations
(2026-08-16). The `frelec` prompt on con1 carries the matching change
(`scripts 647a5d4`): step 5 now tells the run to give a first-time candidate a
slot and carry on, warns that the validator's all-pairs FAIL names pre-existing
pairs rather than the new one, and requires the color and its scores in the
commit message and the emailed summary. The three other prompts were left
alone — GerElec, ItalPolls and UKPolls chart parties, not named candidates, so
a new series there is a different (and so far unseen) event.

**2026-08-27 — Bardella's match-ups dropped from the runoff snapshot**
(`frelec 9076b48`)
Le Pen declared on 2026-07-07 and Bardella is no longer a candidate, so his
duels describe a race nobody is in. The snapshot chart answers "how does each
challenger stand today", so per the owner it now shows Le Pen match-ups only —
twelve bars become seven. **This is standing, not a one-off.**

Three things about the shape of it. The filter is a
`SNAPSHOT_RN_CANDIDATES` tuple in `visualize_second_round.py`, not a hardcoded
Bardella test, so the chart follows whoever the RN candidate is if this
happens again. The rows stay in `polls_2027_second_round.csv` — this is a
presentation decision, and a fresh parse still has to reproduce the CSV byte
for byte or the daily diff stops meaning anything. And the **trend** chart
keeps them: there each point is read against whoever the RN candidate was at
the time, and dropping the Bardella era would truncate every challenger's
history at July 2026, which is the opposite of what a trend chart is for.

The snapshot's subtitle now names Le Pen and the date she declared, so a
reader who remembers the Bardella duels can see why they are gone rather than
wondering whether the chart broke.

**2026-08-28 — FN split out of the Italian Others, and 14 January rows fixed**
(`ItalPolls 0bde5e7`, `scripts 00e502f`)
Futuro Nazionale (Vannacci, founded February 2026) had its own column in
Wikipedia's 2026 table but none here, so it fell into the lumped `Others` along
with every other minor column we don't break out. It has polled 6.1–8.0 since
mid-July — above the 3% threshold line the chart draws — which made `Others` the
second-largest "party" on the chart and hid a real one inside it. It now has its
own CSV column and series. `Others` keeps its rule: Wikipedia's own residual
cell **plus** every minor column still not broken out (DSP, PLD, …), now minus
FN.

Two things worth knowing before touching this again.

**The parser trap is vertical, not horizontal.** The documented hazard here has
always been `colspan` (a joint Azione/Italia Viva cell). This was `rowspan`: a
party that didn't exist yet gets *one* "Did not exist" cell spanning every
earlier poll, so the 14 rows under the origin row carry one fewer `<td>` than
the header has columns, and a positional parser shifts everything right of it by
one — reading `Lead` into `Others`. It is silent: no exception, no missing row,
just a plausible-looking number. The row-sum rule caught it (2026-01-29
Termometro Politico summed to 108.4 with Others 12.1, and to 100.3 with 4.0),
which is the same rule that settled the Ipsos row on 2026-08-11. 2026 rows
outside a 96–104 sum went from 15 to 2. The `italpolls` prompt on con1 now
carries the warning.

**FN is the one series not wearing its party's color.** Futuro Nazionale brands
as near-black navy `#20293D`, which is OKLab ΔE 5.3 from FdI's navy under
*normal* vision — far under the 15 floor, i.e. unreadable next to it, before
colorblindness enters into it. `#324DFE` was swept in OKLCH against the ten
committed colors with the dataviz skill's `validate_palette.js`: worst-case CVD
ΔE 12.4 (vs AVS), normal-vision ΔE 18.2 (vs FI), contrast 5.64:1. The all-pairs
run still FAILs, but on exactly the pairs it failed before FN existed (FdI off
the lightness band and under the chroma floor, Others gray, M5S/NM ΔE 0.8
protan) — that set is identical with and without FN and none of it involves the
new slot. This follows the frelec precedent of 2026-08-27 for a first-time
series, though unlike frelec's candidates a *party* normally brings its own
color, so record the reason whenever one can't be used.

**Known and not fixed:** the same off-by-one shape is visible in the 2024–2025
rows — 62 rows sum above 104, and the `Others` line has two flat-topped
rectangular excursions (mid-2024, early 2025) that look like columns shifting
under a spanning cell, not like opinion. Those tables have a different column
set, so re-auditing them is its own job.

**2026-08-31 — The Ruffin–Le Pen runoff poll is dropped as spurious**
(`frelec` parser exclusion list)
The owner asked for it to go. The "Hypothèse Ruffin – Le Pen" table held exactly
one poll: Cluster 17, 2–5 avril 2024, 1713 respondents, 50–50, commissioned by
Ruffin's own Picardie Debout. It was two years older than anything else in the
runoff dataset and a party-commissioned test of its own candidate, and because
the snapshot chart shows the *latest* poll per match-up, that 2024 row was
rendering as a current 50–50 bar above six Ifop polls from last week — the one
place in the dataset where a stale row actively misleads.

Deleting the CSV row alone would not have held: every update replaces
`polls_2027_second_round.csv` with a fresh parse of the whole page, so it would
have returned the next morning and shown up as a "new" poll in the daily diff.
The exclusion therefore lives in `parse_polls.py` as
`EXCLUDED_SECOND_ROUND_ROWS`, checked in `parse_second_round_rows`.

It keys on the single row — `(matchup, pollster, date)` — not on the match-up or
on Ruffin. A later genuine Ruffin–Le Pen poll is meant to flow in normally under
the 2026-08-27 absorb-a-new-series rule, which is also why his validated palette
slot stays in `visualize_second_round.py` rather than being deleted with the
data. Compare the 2026-08-27 Bardella decision: that one filtered a *chart*
(snapshot only) and kept the rows, because those polls are real and merely no
longer current. This one removes the row, because the poll should not be in the
dataset at all.

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

**2026-08-24 — The daily run moved off the workstation onto con1, at 04:15 UTC**
(`scripts 71f92c0`)
Cron on the WSL box only fires while WSL is up, which is why the `@reboot`
catch-up existed at all and why a morning could simply be missed. con1 is up
around the clock (586 days at the time of the move), so the four repos are now
cloned there and the four cron entries live in con1's crontab; the workstation's
entries are commented out and its `~/Prog/scripts` is a historical copy. **Edit
the prompts and wrappers in `~/Prog/scripts` on con1 now, not here.** The
`@reboot` catch-up came along as a safety net rather than a daily necessity.
Nothing else about the pipeline changed: same wrapper, same 20h state-file
guard, same per-repo prompts, same email-after-every-run.

**Why the con1 cron lines look strange.** con1 runs `cron 3.0pl1-137ubuntu3`,
which does **not** honour `CRON_TZ` — crontab(5)'s LIMITATIONS section says
per-user timezones are ignored and every task runs in the system zone, which on
con1 is `America/New_York`. Setting the system zone to UTC would have silently
moved the two unrelated backup jobs sharing that crontab. So each job is
scheduled at **both** candidate local hours and gated on the UTC hour actually
being 04:

    15 23,0 * * * [ "$(date -u +\%H)" = 04 ] && poll-update-run.sh frelec ...

Under EDT the `00:15` slot is 04:15Z and runs while `23:15` is 03:15Z and is
skipped; under EST it is the other way round. The start time therefore stays
fixed in UTC across both DST switches without anything else in the crontab
moving. `\%` is an escaped literal percent — cron reads a bare `%` as a newline.
Verified on 2026-08-24 with a throwaway entry: cron delivered the escaped line
intact, the gate took the right branch, and the job inherited the declared PATH.
A crontab environment assignment applies only to the lines *after* it, which is
why the `PATH=` line sits below the two backup jobs and leaves them alone.

**2026-09-02 — Shared refresh token expired; all four runs failed at auth,
before doing any work.** All four 2026-09-02 logs (00:15/00:20/00:25/00:30
EDT) are four lines each: `Failed to authenticate: OAuth session expired and
could not be refreshed`, `exit code: 1`, then a successful `Sent.` — the
notification email itself went out fine (that's `gmail_send.py`'s own,
separate OAuth), it just reported nothing but the auth failure, four times.
No chart PNGs changed (`/var/www/pollsite/polls/` still dated 2026-09-01), so
this is the exact failure the 2026-08-24 entry above flagged as the first
thing to suspect: con1's headless `claude -p` sessions authenticate off a
*copy* of the workstation's `~/.claude/.credentials.json`, and that one
refresh token had gone stale for both machines at once. Fixed by an
interactive `/login` in a Claude Code session running **on con1** (confirmed
by `hostname`/`/var/www/pollsite` before doing anything else — see the
2026-08-24 entry on why that check matters now), which rewrote
`~/.claude/.credentials.json` with a fresh token; `~/.claude/backups/` shows
the file rewritten at 04:36 EDT the same morning.
**Gotcha:** `poll-update-run.sh` writes its 20h guard state file
unconditionally, on failure as well as success, so today's four runs each
armed their guard against a retry despite doing nothing — a plain rerun of
the wrapper right after fixing auth silently no-ops. Cron self-heals on its
own tomorrow (the next 04:xxZ slot is >20h past today's stamps regardless),
but catching up *today's* four runs means clearing the relevant
`~/.local/state/poll-updates/*.last_run` files first, not just fixing auth.

**2026-09-03 — No emails arrived; the Sep-02 catch-up's own timestamps blocked
the next morning's cron slot.** The Sep-02 catch-up ran at 04:41-04:47 EDT
(after the auth fix), which wrote fresh `*.last_run` guard stamps at that
time. The next scheduled slot — 00:15-00:30 EDT Sep 03 — landed only
19h33m-19h58m later, under the 20h guard, so `poll-update-run.sh` hit
`exit 0` for all four repos **before** creating a log file. That exit is
silent by design (no log, no email), which is indistinguishable from "cron
never fired" without checking `~/.local/state/poll-updates/*.last_run`
against the log directory — there is no log dated 2026-09-03 at all, only the
guard stamps from 2026-09-02. Confirmed on con1 directly (this session's
shell already had `hostname`/`/var/www/pollsite` matching con1, no ssh
needed). By the time this was noticed (~08:50 EDT) the guard had long since
expired on its own, so the fix was just running
`poll-update-catchup.sh --now` — no state-file surgery needed this time,
unlike the Sep-02 case.
**The general shape:** any manual catch-up run whose timestamp lands less
than 20h before the *next* scheduled slot will silently eat that slot too.
Sep-02's catch-up (04:41 EDT) was close enough to Sep-03's slot (00:15 EDT)
to do exactly that. Left as-is rather than shortening the guard or logging
the skip — a second occurrence within a week would be the signal to change
the mechanism instead of just re-diagnosing it.

**2026-09-04 — Guard shortened from 20h to 6h after a second occurrence,
one day later** (`scripts a284d08`)
Sep-03's manual catch-up (08:53-08:59 EDT) landed ~15.5h before Sep-04's
04:15Z slot — again under 20h — so all four repos silently no-op'd again
this morning, the exact repeat the 2026-09-03 entry above said to watch
for. Fixed by shortening `poll-update-run.sh`'s `INTERVAL_SECONDS` to 6h:
still well clear of the real double-invocation cases the guard exists for
(five-minute cron stagger, worst observed run ~4m40s, an occasional
same-morning `@reboot` immediately after a cron slot), while leaving a
wide margin before the next fixed slot no matter what hour a manual run
happens at — even a run as late as ~22:00 local leaves over 6h before the
next 00:15-00:30 EDT window. Today's four runs (frelec, gerelec,
italpolls, ukpolls) were then triggered manually via
`poll-update-catchup.sh --now`; all four completed clean (gerelec and
ukpolls `STATUS: UPDATED` with new polls and, for ukpolls, two
already-triaged editor emendations; frelec and italpolls `STATUS: NO
CHANGE`), all four emails sent. **Not addressed:** the guard is still
elapsed-time-based rather than calendar-day-based, so a manual run late
enough in the evening (within 6h of the next slot) could still eat it —
judged unlikely enough at 6h to leave alone rather than redesign further.

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

**2026-08-24 — The five repos are checked out on con1, so "deploy" is a local
copy there** (`DisplayPolls 20bc1d6`, `frelec 5fcb723`, `GerElec 58dc0c3`,
`UKPolls e3a497d`, `scripts 71f92c0`)
With the daily run moved to con1, every repo that used to `scp` to con1 is now
*running on* con1, where the `con1` ssh alias does not exist and the web roots
are ordinary local directories owned by `agold` (no sudo needed for either).
Rather than fork the tooling per machine, everything that deploys is now
host-aware, testing for `/var/www/pollsite` — its presence means this machine is
the web server:

- `.githooks/pre-push` picks `cp -p` or `scp` on that test. Both branches were
  exercised on 2026-08-24, pushing from the workstation and running the hook
  directly on con1.
- Step 8 of all four poll prompts says plainly that the machine *is* the web
  server and to use `cp -p`, never `scp`/`ssh con1`.
- `claude.md` in frelec, GerElec and UKPolls said "the remote server is con1",
  which was about to be wrong half the time; it now names the path and says
  which side of the ssh boundary you are on, with `hostname` as the tiebreak.

The clones use the **SSH** remote (`git@github.com:agoldhammer/...`) on con1
even where the workstation uses HTTPS, because con1's existing key already
authenticates to GitHub as `agoldhammer` and needs no credential helper. Verified
by pushing all four of the above commits from con1.

Two things had to be carried over by hand, since neither is in any GitHub repo:
`~/Prog/scripts` (rsynced, git history and all) and the two gitignored Gmail
secrets inside it. The headless `claude` sessions authenticate from a copy of the
workstation's `~/.claude/.credentials.json`, alongside a minimal `~/.claude.json`
holding just the account, `hasCompletedOnboarding`, and a pre-accepted trust
dialog for each repo path so an unattended run can never block on one. **Both
machines now share one refresh token** — if con1's sessions start failing to
authenticate, that is the first thing to suspect.

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
