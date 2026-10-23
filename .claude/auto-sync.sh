#!/bin/bash
# Auto-sync: after every Claude turn, keep deploy/ identical to the project, then
# commit and push everything to GitHub. Never touches main/master, never commits
# secrets or the unrelated private files. Always exits 0 so it can never block Claude.

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}" || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

say() { printf '{"systemMessage":"%s"}\n' "$1"; exit 0; }

branch=$(git branch --show-current)
[ -z "$branch" ] && exit 0
case "$branch" in
  main|master) say "Auto-sync skipped: refusing to push straight to $branch. Switch to a feature branch." ;;
esac

# 1) keep deploy/ an exact copy of the site files (the folder that gets uploaded to Netlify)
if [ -d deploy ]; then
  cp -f ./*.html robots.txt sitemap.xml netlify.toml deploy/ 2>/dev/null
  [ -d assets ] && cp -rf assets deploy/ 2>/dev/null
  mkdir -p deploy/netlify/functions && cp -f netlify/functions/*.js deploy/netlify/functions/ 2>/dev/null
fi

# 2) nothing to do?
if [ -z "$(git status --porcelain)" ]; then
  upstream=$(git rev-parse --abbrev-ref "@{u}" 2>/dev/null)
  if [ -n "$upstream" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse "@{u}")" ]; then exit 0; fi
fi

# 3) stage, then refuse anything that must never reach GitHub
git add -A
bad=$(git diff --cached --name-only | grep -iE '(^|/)(\.env[^/]*|.*invoice.*|.*honey.*|.*\.pem|.*\.key|settings\.local\.json)$')
if [ -n "$bad" ]; then
  git reset -q
  say "Auto-sync stopped: sensitive-looking file(s) staged: $(echo "$bad" | tr '\n' ' '). Nothing was committed."
fi
if git diff --cached -U0 | grep -E '^\+' | grep -qE 're_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}'; then
  git reset -q
  say "Auto-sync stopped: something that looks like a secret/API key is staged. Nothing was committed."
fi

# 4) commit (if there is anything) and push
if ! git diff --cached --quiet; then
  n=$(git diff --cached --name-only | wc -l | tr -d ' ')
  files=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
  git commit -q -m "Auto-sync: $n file(s) changed ($files)

Saved automatically after a Claude session turn.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" >/dev/null 2>&1 || say "Auto-sync: commit failed, changes are still saved locally."
fi

if git push -q -u origin "$branch" >/dev/null 2>&1; then
  say "Auto-synced to GitHub (branch $branch)."
else
  say "Auto-sync: saved locally but the push to GitHub failed (offline or login expired). It will retry after the next turn."
fi
