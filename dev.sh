#!/usr/bin/env bash
# One command for everything that is not editing a file.
#
# Three separate stumbles in one round — a dead server, a missing curl, a
# hard-coded playwright path — cost more time than the edits they interrupted.
# They all live here now.
#
#   ./dev.sh serve          start the static server (port 20302), idempotent
#   ./dev.sh stop           stop it
#   ./dev.sh check          the fast checks: scores only, no audio (seconds)
#   ./dev.sh check --full   everything, audio included (minutes)
#   ./dev.sh publish "msg"  commit and push to GitHub Pages
#
# Port 20303 is inside the block this account owns (20300-20319); 20302 belongs
# to another project of ours and answering on a port is not the same as being
# the right server, so readiness is decided by what comes back, not by whether
# anything came back at all. That mistake cost a whole debugging round once.

set -euo pipefail
cd "$(dirname "$0")"

PORT=20303
RUN=.dev
mkdir -p "$RUN"

alive() { [ -f "$RUN/server.pid" ] && kill -0 "$(cat "$RUN/server.pid")" 2>/dev/null; }

ours() {
  node -e "
    fetch('http://127.0.0.1:$PORT/')
      .then((r) => r.text())
      .then((t) => process.exit(t.includes('<title>Leitmotif') ? 0 : 2))
      .catch(() => process.exit(1))" 2>/dev/null
}

up() {
  local st=0
  ours || st=$?
  [ "$st" -eq 0 ] && return
  if [ "$st" -eq 2 ]; then
    echo "port $PORT answers, but it is not Leitmotif — a stray server is on it" >&2
    exit 1
  fi
  rm -f "$RUN/server.pid"
  python3 -m http.server "$PORT" --bind 127.0.0.1 >"$RUN/server.log" 2>&1 &
  echo $! >"$RUN/server.pid"
  for _ in $(seq 1 40); do
    if ours; then echo "serving http://127.0.0.1:$PORT/"; return; fi
    sleep 0.25
  done
  echo "server did not come up; see $RUN/server.log" >&2
  exit 1
}

down() {
  if alive; then kill "$(cat "$RUN/server.pid")"; fi
  rm -f "$RUN/server.pid"
  echo "stopped"
}

case "${1:-check}" in
  serve) up ;;
  stop)  down ;;
  check) up; shift || true; node test.js "$@" ;;
  publish)
    up >/dev/null; node test.js --full
    git add -A
    git commit -m "${2:?a commit message is required}"
    git push
    ;;
  *) sed -n '2,20p' "$0"; exit 1 ;;
esac
