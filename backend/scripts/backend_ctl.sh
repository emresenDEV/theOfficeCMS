#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLASK_SESSION="${FLASK_SESSION:-officecms_flask}"
TAILSCALE_SESSION="${TAILSCALE_SESSION:-officecms_tailscale}"
PORT="${FLASK_PORT:-5002}"
TAILSCALED_BIN="/opt/homebrew/bin/tailscaled"
TAILSCALE_BIN="${TAILSCALE_BIN:-$(command -v tailscale || true)}"
TMUX_BIN="${TMUX_BIN:-$(command -v tmux || true)}"
VENV_PY="$BACKEND_DIR/venv/bin/python"

ok() {
  echo "✅ $*"
}

warn() {
  echo "⚠️  $*"
}

err() {
  echo "❌ $*"
}

info() {
  echo "ℹ️  $*"
}

if [[ -z "$TAILSCALE_BIN" && -x "/opt/homebrew/bin/tailscale" ]]; then
  TAILSCALE_BIN="/opt/homebrew/bin/tailscale"
fi

require_tmux() {
  if [[ -z "$TMUX_BIN" ]]; then
    err "[setup] tmux is not installed or not on PATH"
    exit 1
  fi
}

require_backend_runtime() {
  if [[ ! -d "$BACKEND_DIR" ]]; then
    err "[backend] directory not found: $BACKEND_DIR"
    exit 1
  fi

  if [[ ! -f "$BACKEND_DIR/app.py" ]]; then
    err "[backend] app.py not found in: $BACKEND_DIR"
    exit 1
  fi

  if [[ ! -x "$VENV_PY" ]]; then
    err "[backend] virtualenv python not found: $VENV_PY"
    info "Run these on Mac Mini:"
    echo "  cd $BACKEND_DIR"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
  fi
}

has_session() {
  [[ -n "$TMUX_BIN" ]] && "$TMUX_BIN" has-session -t "$1" 2>/dev/null
}

tailscale_is_running() {
  [[ -n "$TAILSCALE_BIN" ]] && "$TAILSCALE_BIN" status >/dev/null 2>&1
}

dir_fingerprint() {
  local dir="$1"
  stat -f "%d:%i" "$dir" 2>/dev/null || true
}

check_port_conflict() {
  local pids
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -z "$pids" ]]; then
    return 0
  fi

  local pid cmd cwd repo_fp cwd_fp
  repo_fp="$(dir_fingerprint "$BACKEND_DIR")"

  for pid in $pids; do
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk 'BEGIN{FS=""} /^n/ {print substr($0,2)}')"
    cwd_fp="$(dir_fingerprint "$cwd")"

    if [[ -n "$repo_fp" && -n "$cwd_fp" && "$cwd_fp" == "$repo_fp" && "$cmd" == *"app.py"* ]]; then
      warn "[flask] found stale TheOfficeCMS process on port $PORT (PID $pid), stopping it"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if lsof -p "$pid" >/dev/null 2>&1; then
        warn "[flask] process $pid still running, forcing stop"
        kill -9 "$pid" 2>/dev/null || true
      fi
      continue
    fi

    if lsof -p "$pid" >/dev/null 2>&1; then
      err "[flask] port $PORT is already in use by another app"
      info "[flask] PID: $pid"
      info "[flask] CMD: ${cmd:-unknown}"
      info "[flask] CWD: ${cwd:-unknown}"
      info "[flask] Resolve this before starting TheOfficeCMS backend."
      return 1
    fi
  done
}

start_tailscale_if_needed() {
  if [[ -z "$TAILSCALE_BIN" ]]; then
    err "[tailscale] tailscale CLI not found (expected /opt/homebrew/bin/tailscale)"
    exit 1
  fi

  if tailscale_is_running; then
    ok "[tailscale] already running"
    return
  fi

  if command -v brew >/dev/null 2>&1; then
    info "[tailscale] attempting Homebrew service startup"
    if sudo brew services start tailscale >/dev/null 2>&1; then
      sleep 2
      if tailscale_is_running; then
        ok "[tailscale] started via Homebrew service"
        return
      fi
    fi
  fi

  require_tmux
  info "[tailscale] starting daemon in tmux session '$TAILSCALE_SESSION'"
  if has_session "$TAILSCALE_SESSION"; then
    "$TMUX_BIN" kill-session -t "$TAILSCALE_SESSION"
  fi

  if [[ ! -x "$TAILSCALED_BIN" ]]; then
    err "[tailscale] tailscaled binary not found at $TAILSCALED_BIN"
    info "[tailscale] Update TAILSCALED_BIN in backend/scripts/backend_ctl.sh"
    exit 1
  fi

  "$TMUX_BIN" new-session -d -s "$TAILSCALE_SESSION" "sudo $TAILSCALED_BIN"
  sleep 2

  if tailscale_is_running; then
    ok "[tailscale] daemon started"
  else
    warn "[tailscale] daemon started, but node may need login/auth"
    info "[tailscale] run: sudo /opt/homebrew/bin/tailscale up"
  fi
}

start_flask() {
  require_tmux
  require_backend_runtime
  check_port_conflict
  info "[flask] starting backend in tmux session '$FLASK_SESSION'"

  if has_session "$FLASK_SESSION"; then
    "$TMUX_BIN" kill-session -t "$FLASK_SESSION"
  fi

  "$TMUX_BIN" new-session -d -s "$FLASK_SESSION" \
    "cd '$BACKEND_DIR' && '$VENV_PY' app.py"

  sleep 2

  if lsof -iTCP:"$PORT" -sTCP:LISTEN -nP >/dev/null 2>&1; then
    ok "[flask] running on port $PORT"
  else
    warn "[flask] did not detect listener on port $PORT yet"
    if has_session "$FLASK_SESSION"; then
      info "[flask] check logs with: tmux attach -t $FLASK_SESSION"
    else
      err "[flask] tmux session '$FLASK_SESSION' exited immediately"
      info "[flask] likely causes: invalid .env, missing deps, database unavailable"
      info "[flask] test directly: cd $BACKEND_DIR && $VENV_PY app.py"
    fi
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

  echo
  echo "=== summary ==="
  if has_session "$FLASK_SESSION"; then
    ok "tmux session '$FLASK_SESSION' exists"
  else
    warn "tmux session '$FLASK_SESSION' not running"
  fi

  if tailscale_is_running; then
    ok "tailscale daemon is running"
  else
    warn "tailscale daemon is not running"
  fi

  if has_session "$TAILSCALE_SESSION"; then
    ok "tmux session '$TAILSCALE_SESSION' exists"
  else
    info "tmux session '$TAILSCALE_SESSION' not running (ok if using brew service)"
  fi

  if lsof -iTCP:"$PORT" -sTCP:LISTEN -nP >/dev/null 2>&1; then
    ok "port $PORT is listening"
  else
    warn "port $PORT is not listening"
  fi
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
