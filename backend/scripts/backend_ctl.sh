#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLASK_SESSION="${FLASK_SESSION:-officecms_flask}"
TAILSCALE_SESSION="${TAILSCALE_SESSION:-officecms_tailscale}"
PORT="${FLASK_PORT:-5002}"
TAILSCALED_BIN="/opt/homebrew/bin/tailscaled"
TAILSCALE_BIN="${TAILSCALE_BIN:-$(command -v tailscale || true)}"
TMUX_BIN="${TMUX_BIN:-$(command -v tmux || true)}"

if [[ -z "$TAILSCALE_BIN" && -x "/opt/homebrew/bin/tailscale" ]]; then
  TAILSCALE_BIN="/opt/homebrew/bin/tailscale"
fi

require_tmux() {
  if [[ -z "$TMUX_BIN" ]]; then
    echo "[setup] ERROR: tmux is not installed or not on PATH"
    exit 1
  fi
}

has_session() {
  [[ -n "$TMUX_BIN" ]] && "$TMUX_BIN" has-session -t "$1" 2>/dev/null
}

check_port_conflict() {
  local pids
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -z "$pids" ]]; then
    return 0
  fi

  local pid cmd
  for pid in $pids; do
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if [[ "$cmd" != *"$BACKEND_DIR"* ]]; then
      echo "[flask] ERROR: port $PORT is already in use by another app"
      echo "[flask] PID: $pid"
      echo "[flask] CMD: ${cmd:-unknown}"
      echo "[flask] Resolve this before starting TheOfficeCMS backend."
      return 1
    fi
  done
}

start_tailscale_if_needed() {
  require_tmux

  if [[ -z "$TAILSCALE_BIN" ]]; then
    echo "[tailscale] ERROR: tailscale CLI not found (expected /opt/homebrew/bin/tailscale)"
    exit 1
  fi

  if "$TAILSCALE_BIN" status >/dev/null 2>&1; then
    echo "[tailscale] already running"
    return
  fi

  echo "[tailscale] starting daemon in tmux session '$TAILSCALE_SESSION'"
  if has_session "$TAILSCALE_SESSION"; then
    "$TMUX_BIN" kill-session -t "$TAILSCALE_SESSION"
  fi

  if [[ ! -x "$TAILSCALED_BIN" ]]; then
    echo "[tailscale] ERROR: tailscaled binary not found at $TAILSCALED_BIN"
    echo "[tailscale] Update TAILSCALED_BIN in backend/scripts/backend_ctl.sh"
    exit 1
  fi

  "$TMUX_BIN" new-session -d -s "$TAILSCALE_SESSION" "sudo $TAILSCALED_BIN"
  sleep 2

  if "$TAILSCALE_BIN" status >/dev/null 2>&1; then
    echo "[tailscale] daemon started"
  else
    echo "[tailscale] daemon started, but node may need login/auth"
    echo "[tailscale] run: sudo /opt/homebrew/bin/tailscale up"
  fi
}

start_flask() {
  require_tmux
  check_port_conflict
  echo "[flask] starting backend in tmux session '$FLASK_SESSION'"

  if has_session "$FLASK_SESSION"; then
    "$TMUX_BIN" kill-session -t "$FLASK_SESSION"
  fi

  "$TMUX_BIN" new-session -d -s "$FLASK_SESSION" \
    "cd '$BACKEND_DIR' && . venv/bin/activate && python app.py"

  sleep 2

  if lsof -iTCP:"$PORT" -sTCP:LISTEN -nP >/dev/null 2>&1; then
    echo "[flask] running on port $PORT"
  else
    echo "[flask] WARNING: did not detect listener on port $PORT yet"
    echo "[flask] check logs with: tmux attach -t $FLASK_SESSION"
  fi
}

status() {
  echo "=== tmux sessions ==="
  if [[ -n "$TMUX_BIN" ]]; then
    "$TMUX_BIN" ls || true
  else
    echo "tmux not found"
  fi

  echo
  echo "=== tailscale ==="
  if [[ -n "$TAILSCALE_BIN" ]]; then
    "$TAILSCALE_BIN" status || true
  else
    echo "tailscale not found"
  fi

  echo
  echo "=== flask port $PORT ==="
  lsof -iTCP:"$PORT" -sTCP:LISTEN -nP || true
}

update_backend() {
  echo "[git] pulling latest backend code"
  (
    cd "$BACKEND_DIR"
    git pull --ff-only
  )
  start_flask
}

usage() {
  cat <<USAGE
Usage: $(basename "$0") <command>

Commands:
  backend  Restart Flask only (no Tailscale changes)
  start    Ensure Tailscale is up and (re)start Flask in tmux
  restart  Alias of start
  status   Show tmux, tailscale, and Flask listener status
  update   git pull --ff-only in backend, then restart Flask
  attach   Attach to Flask tmux session
USAGE
}

main() {
  local cmd="${1:-}"

  case "$cmd" in
    backend)
      start_flask
      status
      ;;
    start|restart)
      start_tailscale_if_needed
      start_flask
      status
      ;;
    status)
      status
      ;;
    update)
      update_backend
      status
      ;;
    attach)
      require_tmux
      "$TMUX_BIN" attach -t "$FLASK_SESSION"
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
