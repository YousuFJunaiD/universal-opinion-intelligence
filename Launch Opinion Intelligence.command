#!/bin/zsh
# Cached-only macOS presentation entry point. No npm/install/build/source reads.
ROOT="${0:A:h}"
ID=$(printf '%s' "$ROOT" | /usr/bin/shasum -a 256 | /usr/bin/cut -c 1-12)
CACHE="$HOME/Library/Caches/universal-opinion-intelligence/$ID"
if [[ -f "$ROOT/last-ready.json" && -f "$ROOT/node-path.txt" ]]; then
  CACHE="$ROOT"
fi
print "Universal Opinion Intelligence — offline presentation"
print "This launcher uses the last HTTP-verified prepared build."
if [[ ! -f "$CACHE/start-demo.cjs" || ! -f "$CACHE/node-path.txt" ]]; then
  print -u2 "No prepared build found. Preparation must be completed before presenting."
  print -u2 "In Terminal: cd ${(q)ROOT} && npm run demo:prepare"
  print -u2 "Offline fallback: show an already saved Markdown or browser-print report."
  [[ -t 0 ]] && read -r "reply?Press Return to close. "
  exit 1
fi
NODE_BIN=$(<"$CACHE/node-path.txt")
if [[ ! -x "$NODE_BIN" ]]; then
  print -u2 "The prepared Node runtime is missing. Restore Node, then run npm run demo:prepare."
  [[ -t 0 ]] && read -r "reply?Press Return to close. "
  exit 1
fi
"$NODE_BIN" "$CACHE/start-demo.cjs" --open
RESULT=$?
if (( RESULT != 0 )); then
  print -u2 "Launch failed. No installation or rebuild was attempted."
  print -u2 "Prepare before presenting: cd ${(q)ROOT} && npm run demo:prepare"
  [[ -t 0 ]] && read -r "reply?Press Return to close. "
fi
exit $RESULT
