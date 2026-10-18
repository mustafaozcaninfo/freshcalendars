#!/usr/bin/env bash
# Each case writes one broken article and expects `astro build` to fail with the given message.
# Usage: bash apps/news/test/schema-negative.sh
set -uo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$APP/src/content/articles/_neg"
BASE="$APP/src/content/articles/2026/10/why-thanksgiving-2026-is-november-26.md"
fail=0
trap 'rm -rf "$DIR"' EXIT

run_case() {
  local name="$1" expect="$2" file="$3" content="$4"
  rm -rf "$DIR"; mkdir -p "$DIR"
  printf '%s' "$content" > "$DIR/$file"
  local out
  out="$(cd "$APP" && NEWS_INCLUDE_DRAFTS=1 npx astro build 2>&1)"
  if [[ $? -ne 0 && "$out" == *"$expect"* ]]; then
    echo "ok   $name"
  else
    echo "FAIL $name (expected build error containing: $expect)"; fail=1
  fi
}

base="$(sed 's#\.\./\.\./\.\./\.\./assets#../../../assets#' "$BASE")"
mut() { printf "%s" "$base" | sed -E "$@"; }

run_case "short description" "description" "x-short-desc.md" "$(mut 's/^description: .*/description: "Too short."/')"
run_case "date without offset" "use ISO-8601 with offset" "x-no-tz.md" "$(mut 's/^publishedAt: .*/publishedAt: "2026-10-18T06:30:00"/')"
run_case "unknown category" "unknown categories reference" "x-bad-cat.md" "$(mut 's/^category: .*/category: weather/')"
run_case "updatedAt before publishedAt" "updatedAt is before publishedAt" "x-upd.md" "$(mut 's/^publishedAt: (.*)/publishedAt: \1\nupdatedAt: "2026-10-01T00:00:00-04:00"/')"
run_case "news without sources" "need at least one source" "x-nosrc.md" "$(mut -e 's/^type: .*/type: news/' -e '/^sources:/,/^internalLinks:/{/^internalLinks:/!d;}')"
run_case "one internal link" "link at least two calendar pages" "x-links.md" "$(mut -e '/^  - href: "\/when-is\/black-friday\/"/,+1d' -e '/^  - href: "\/november-calendars.html"/,+1d')"
run_case "uppercase slug" "lowercase kebab-case" "Bad_Slug.md" "$base"

exit $fail
