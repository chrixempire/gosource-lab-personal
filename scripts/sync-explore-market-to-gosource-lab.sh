#!/usr/bin/env bash
# Sync explore / market slide-modal work from gosource-personal-lab → gosource-lab.
# Usage: ./scripts/sync-explore-market-to-gosource-lab.sh

set -euo pipefail

SRC="${GOSOURCE_PERSONAL_LAB:-$(cd "$(dirname "$0")/.." && pwd)}"
DST="${GOSOURCE_LAB:-/Users/mac/Documents/chris/gosource-lab}"
BRANCH="${BRANCH:-feat/customer-market-explore-slide-modal}"

if [[ ! -d "$SRC/.git" ]]; then
  echo "Source repo not found: $SRC" >&2
  exit 1
fi

if [[ ! -d "$DST/.git" ]]; then
  echo "Destination repo not found: $DST" >&2
  exit 1
fi

echo "Source: $SRC"
echo "Destination: $DST"
echo "Branch: $BRANCH"

cd "$DST"
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

cd "$SRC"

copied=0
deleted=0

while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  [[ "$file" == apps/customer-web/* ]] || continue

  if [[ ! -f "$SRC/$file" ]]; then
    if [[ -e "$DST/$file" ]]; then
      rm -f "$DST/$file"
      echo "deleted $file"
      deleted=$((deleted + 1))
    fi
    continue
  fi

  mkdir -p "$DST/$(dirname "$file")"
  cp -f "$SRC/$file" "$DST/$file"
  echo "copied $file"
  copied=$((copied + 1))
done < <(
  {
    git diff --name-only HEAD -- apps/customer-web/
    git diff --name-only --diff-filter=D HEAD -- apps/customer-web/
    git ls-files --others --exclude-standard -- apps/customer-web/
  } | sort -u
)

cd "$DST"
echo ""
echo "Synced $copied file(s), removed $deleted file(s)."
echo "Review with: cd $DST && git status apps/customer-web"
