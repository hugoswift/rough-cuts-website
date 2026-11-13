# Rough Cuts Website — notes for Claude

This file is read by Claude Code at the start of every session, on every collaborator's machine.
It is the shared rulebook: follow it, and when the team settles a decision, record it here.

## The team

- Two people build this site: Hugo (`hugoswift`, repo owner) and James (`jamescleaver1994`).
- **Neither reads code.** They direct the work in plain English and judge it by looking at the site.
  - Explain what you changed in terms of what visitors will see, not file or code details.
  - Show changes in the browser (desktop and phone widths) before calling something done.
  - Ask before making a design choice the user didn't specify, if it would be noticeable.

## Project facts

- Plain static site: HTML, CSS and a little JavaScript. No build step, no frameworks, no npm.
- Hosted on GitHub Pages from the `docs/` folder of the `main` branch.
- Live at https://roughcutsjam.com (`www.` redirects to it). Domain DNS is managed at IONOS.
- Repo: https://github.com/hugoswift/rough-cuts-website. It is **public**.

## Where things live

```
CLAUDE.md        this file (not published)
README.md        short human guide (not published)
docs/            THE WEBSITE: only this folder is published
  index.html     homepage
  CNAME          custom domain: do not edit or delete
```

- Every website file goes inside `docs/`. Anything outside `docs/` never appears on the site.
- Use relative links (`about.html`, `css/style.css`), never links starting with `/docs/`.
- As the site grows, keep to: `docs/css/` for styles, `docs/js/` for scripts, `docs/images/` for images.
- Shared parts (header, nav, footer, styles) affect every page. Mention it when you touch them,
  because the other person may be editing them too.

## Git workflow (always follow)

`main` is the live site and is protected: it only changes through merged pull requests.

1. **Start of any new task:** `git switch main` then `git pull`, then create a branch with a short
   descriptive name, e.g. `gallery-page`, `fix-mobile-menu`. One task per branch.
2. **While working:** commit at sensible points with clear messages; push the branch to GitHub
   so work is backed up. Pushing a branch does not change the live site.
3. **Before opening a pull request:** run `git merge main` (after `git fetch`) so the branch includes
   the other person's latest work, and check the result in the browser.
4. **Pull request:** write the description for a non-coder:
   - what changed, as a visitor would notice it ("added a Gallery page with a 3-column photo grid")
   - anything shared that changed (nav, footer, colours)
   - anything the reviewer should check in particular
5. **Merging** publishes to roughcutsjam.com within a couple of minutes. Only merge when the user
   says so. Afterwards, delete the branch and switch back to an updated `main`.

Never push to `main` directly, force-push, or rewrite history on a shared branch.

**Merge conflicts:** if both people changed the same thing, do not silently pick one. Describe both
versions in plain English (or show them) and ask the user which to keep.

**Reviewing the other person's pull request:** check out their branch, show the user the pages it
affects, summarise the change, and post the user's feedback as PR comments in their words.

## Safety

The repo is public: never commit passwords, API keys, private contact details, or anything the
team wouldn't want strangers to read. This includes this file.

## Design system

_Not decided yet. Once the team agrees on colours, fonts, spacing, logo and tone of voice, record
them here, and reuse them everywhere instead of inventing new values._

## Decisions log

Record agreed decisions here (date, what, who) so both Claudes follow them.

- 2026-11-13: Site published from `docs/`; `main` protected and changed by pull requests only. (Hugo)
