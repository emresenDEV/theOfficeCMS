#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_CTL="$ROOT_DIR/backend/scripts/backend_ctl.sh"
LOG_DIR="$ROOT_DIR/backend/logs"
LOG_FILE="$LOG_DIR/auto-update.log"
LOCK_DIR="$LOG_DIR/auto-update.lock"
BRANCH="${OFFICECMS_BRANCH:-main}"

mkdir -p "$LOG_DIR"
exec >>"$LOG_FILE" 2>&1

ts() {
  date '+%Y-%m-%d %H:%M:%S'
}

ok() {
  echo "$(ts) ✅ $*"
}

warn() {
  echo "$(ts) ⚠️  $*"
}

err() {
  echo "$(ts) ❌ $*"
}

info() {
  echo "$(ts) ℹ️  $*"
}

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  warn "Auto-update already running; skipping this run"
  exit 0
fi

if [[ ! -x "$BACKEND_CTL" ]]; then
  err "backend control script missing or not executable: $BACKEND_CTL"
  exit 1
fi

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Not a git repo: $ROOT_DIR"
  exit 1
fi

info "Starting auto-update and backend restart (branch: $BRANCH)"

if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
  warn "Working tree has local changes; skipping git pull"
else
  git -C "$ROOT_DIR" fetch origin "$BRANCH" --quiet

  local_ref="$(git -C "$ROOT_DIR" rev-parse HEAD)"
  remote_ref="$(git -C "$ROOT_DIR" rev-parse "origin/$BRANCH")"

  if [[ "$local_ref" != "$remote_ref" ]]; then
    info "New commits detected on origin/$BRANCH; pulling with --ff-only"
    git -C "$ROOT_DIR" pull --ff-only origin "$BRANCH"
    ok "Repository updated"
  else
    ok "Repository already up to date"
  fi
fi

if "$BACKEND_CTL" backend; then
  ok "Backend restart complete"
else
  err "Backend restart failed"
  exit 1
fi

ok "Auto-update run complete"
