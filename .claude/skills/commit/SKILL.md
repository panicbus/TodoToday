---
name: commit
description: Stages all changed files, decides whether a version bump is warranted, commits with a detailed message, and pushes to this repo's main branch.
---

# /commit

Wraps up the current batch of work in this repo (TodoToday): version bump if warranted, stage everything, commit with a real message, push to `main`.

## Steps

1. **Survey the change.** Run in parallel:
   - `git status --short`
   - `git diff` and `git diff --staged`
   - `git log -5 --oneline` — match this repo's existing message style/tone

   If nothing is changed and nothing is staged, stop and say so — don't create an empty commit.

2. **Decide whether to bump the version.**
   This repo has **no** `bump:*` script. Bump with:
   ```bash
   npm version --no-git-tag-version patch   # or minor / major
   ```
   `--no-git-tag-version` is required. Bare `npm version` creates its own commit *and* a git tag, which collides with step 4 and leaves a tag nobody asked for.

   - **Patch** — the default for most work: bug fixes, refactors, small UI tweaks, CSS corrections, performance/robustness fixes.
   - **Minor** — a new user-facing feature (a new pane, a new setting, a new interaction), or a meaningful bundle of related changes.
   - **Major** — only if the user explicitly asks. Never infer a major bump.
   - **Skip the bump** — the diff is trivial (typo, comment-only, formatting), the user said not to bump, or it's docs-only with no code impact.
   - When torn between patch and skipping, bump patch.

   The version reaches users through `electron-builder`: it names the artifact (`TodoToday-<version>-arm64.dmg`) and sets `CFBundleShortVersionString` in the installed app. A bump only shows up in the app after a rebuild + reinstall.

3. **Stage everything.** `git add -A` — this skill is meant to sweep up the whole batch, including new files.

   Before committing, skim the staged list (`git status --short`) for things that shouldn't be in a commit:
   - **Secrets** — `.env`, credentials, API keys, tokens.
   - **Build output or user data.** `node_modules/`, `dist/`, `data/`, `release/`, and `*.log` are gitignored, but confirm no build artifact or personal todo data slipped in under a new path. `data/` holds the user's actual todo content — it must never be committed.
   - `assets/icons/` **is** tracked on purpose (`build.mac.icon` and `setDockIcon()` in `main.js` both depend on it). Don't remove it.

   If `git status` shows untracked files that don't look like this session's work, pause and ask before sweeping them in.

4. **Commit.**
   - Write a real message: a 1–2 sentence summary of *why*, then bullets if the diff covers more than one distinct piece of work.
   - End with a blank line and the `Co-Authored-By` trailer for the model you're running as, e.g.:
     ```
     Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
     ```
   - Pass the message via a HEREDOC so formatting and quoting survive:
     ```bash
     git commit -m "$(cat <<'EOF'
     Summary line here.

     - Detail one
     - Detail two

     Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
     EOF
     )"
     ```

5. **Push.** `git push` to `main` on the existing `origin` remote (`github.com/panicbus/TodoToday`). No new branches, no force-push.

6. **Report back**: the new version (if bumped), a one-line commit summary, and confirmation the push succeeded.

   Then, if the diff touched anything the running app actually loads — `src/**` (renderer), `main.js`, or `preload.js` — remind the user that **committing does not update the installed app.** `/Applications/TodoToday.app` runs a copy of `dist/` baked into its own bundle, so the change is only live after:
   ```bash
   npm run dist:dir && ditto "$HOME/Library/Caches/todotoday-build/mac-arm64/TodoToday.app" /Applications/TodoToday.app
   ```
   (Quit the running app first — it shares the `data/` directory, so two instances will fight over those JSON files. Use `ditto`, not `cp -R`, to keep the code signature intact.)

## Boundaries

- This skill is pre-authorized to commit and push on `main` when invoked — that's the point of `/commit`. It is **not** authorized to force-push, rewrite history, create or switch branches, delete tags, or touch any repo other than this one.
- Never commit `data/` contents. That's the user's real todo data, and it's gitignored for a reason.
- Don't run the rebuild/reinstall from step 6 as part of `/commit` — surface the command and let the user decide. Replacing an installed app is their call.
