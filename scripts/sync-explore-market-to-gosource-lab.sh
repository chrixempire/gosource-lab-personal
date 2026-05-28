#!/usr/bin/env bash
# Sync app changes from gosource-personal-lab → gosource-lab.
# Usage:
#   ./scripts/sync-explore-market-to-gosource-lab.sh
#   BRANCH=fix/admin-auth-retry-and-explore-card-ui-polish ./scripts/sync-explore-market-to-gosource-lab.sh
#   SYNC_REF=ac773f4 ./scripts/sync-explore-market-to-gosource-lab.sh

set -euo pipefail

SRC="${GOSOURCE_PERSONAL_LAB:-$(cd "$(dirname "$0")/.." && pwd)}"
DST="${GOSOURCE_LAB:-/Users/mac/Documents/chris/gosource-lab}"
SYNC_REF="${SYNC_REF:-HEAD}"
SYNC_APPS=(apps/admin-web apps/customer-web apps/legacy-api)
BRANCH="${BRANCH:-$(git -C "$SRC" branch --show-current 2>/dev/null || echo feat/customer-market-explore-slide-modal)}"

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
echo "Sync ref: $SYNC_REF"
echo "Apps: ${SYNC_APPS[*]}"

cd "$DST"
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

cd "$SRC"

copied=0
deleted=0

should_sync_file() {
  local file="$1"
  for app in "${SYNC_APPS[@]}"; do
    if [[ "$file" == "$app"/* ]]; then
      return 0
    fi
  done
  return 1
}

list_sync_files() {
  if [[ "$SYNC_REF" == "HEAD" ]]; then
    for app in "${SYNC_APPS[@]}"; do
      git diff --name-only HEAD -- "$app/"
      git diff --name-only --diff-filter=D HEAD -- "$app/"
      git ls-files --others --exclude-standard -- "$app/"
    done
    return
  fi

  if git rev-parse --verify "${SYNC_REF}^{commit}" >/dev/null 2>&1; then
    git show --name-only --pretty=format: "$SYNC_REF"
    return
  fi

  echo "Invalid SYNC_REF: $SYNC_REF" >&2
  exit 1
}

while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  if ! should_sync_file "$file"; then
    continue
  fi

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
done < <(list_sync_files | sort -u)

cd "$DST"
echo ""
echo "Synced $copied file(s), removed $deleted file(s)."
echo "Review with: cd $DST && git status ${SYNC_APPS[*]}"
