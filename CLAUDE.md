# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

**Read [`docs/decisions.md`](docs/decisions.md) first, before touching anything
here or in the poll pipeline** — it records why the data corrections, cron
schedule and con1/nginx arrangements are the way they are, and several of them
look wrong until you know the reason. **After making any non-obvious decision —
accepting or rejecting an upstream data change, changing the cron schedule,
changing anything about the nginx vhosts or the deploy — append an entry to the
bottom of the relevant section** with the date, the reasoning (not just the
change), and the commit it lives in.

## What this repo is

Static front ends for two sites on `ghmr.net`, both served by nginx on con1,
with no build step: the files here are the files that get deployed. See
`README.md` for the file-to-server mapping, the `polls.ghmr.net` page structure,
and the `pre-push` deploy hook (including the one-time
`git config core.hooksPath .githooks` a fresh clone needs).

The charts themselves are not in this repo — they are PNGs written into
`/var/www/pollsite/polls/` by the daily poll-update cron from the frelec,
GerElec, ItalPolls and UKPolls repos under `~/Prog/`.

Since 2026-08-24 that cron **runs on con1**, not on this workstation, and all
five repos are cloned there too. The wrappers and prompts that drive it live in
`~/Prog/scripts` **on con1** — that copy is the real one; the workstation's is
historical and its cron entries are commented out. Anything here that deploys is
host-aware: `/var/www/pollsite` existing locally means the machine is the web
server, so the copy is a plain `cp -p` rather than an `scp` to `con1`.
