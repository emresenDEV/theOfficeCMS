# Mac Mini Backend Runbook (TheOfficeCMS)

This is the operational guide for bringing TheOfficeCMS backend up on the Mac Mini, updating code, and troubleshooting common issues.

## Canonical Paths

- Repo root: `/Users/monicanieckula/Documents/GitHub/theOfficeCMS`
- Backend root: `/Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend`
- Backend env file: `/Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/.env`

## Standard Daily Workflow

SSH to Mac Mini:

```bash
ssh monicanieckula@192.168.1.34
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
```

Start or restart services:

```bash
make restart      # Ensure Tailscale & restart backend
make status       # Verify tmux + tailscale + port 5002
```

Backend-only restart (no tailscale changes):

```bash
make backend
```

Update backend code and restart:

```bash
make update
```

View backend console logs:

```bash
make attach
# detach with: Ctrl+B then D
```

## Frontend API Base URL (TheOfficeCMS)

Because Funnel is path-split, TheOfficeCMS frontend must call the `/officecms` base path.

Set in frontend deployment env:

- `VITE_API_BASE_URL=https://macmini.tailced3de.ts.net/officecms`

## Make Commands Reference

From repo root (`theOfficeCMS`):

- `make help` - list commands
- `make dev` - alias of `make backend`
- `make backend` - restart TheOfficeCMS backend only
- `make restart` - restart full stack (tailscale + backend)
- `make start` - alias of `make restart`
- `make status` - diagnostics
- `make update` - `git pull --ff-only` + backend restart
- `make attach` - attach to backend tmux session
- `make autoboot-install` - install launchd auto update/restart job
- `make autoboot-status` - inspect launchd autoboot status + logs
- `make autoboot-run` - run auto update/restart now
- `make autoboot-uninstall` - remove launchd autoboot job

## Auto Update + Restart on Reboot/Login

Install once on Mac Mini:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
make autoboot-install
```

What runs automatically:

- Script: `backend/scripts/auto_update_restart.sh`
- Trigger 1: at login/restart (`RunAtLoad`)
- Trigger 2: every 30 minutes (`StartInterval=1800`)
- Pull strategy: `git pull --ff-only origin main` (only if working tree is clean)
- Backend restart: `backend/scripts/backend_ctl.sh backend`

Check status and logs:

```bash
make autoboot-status
tail -n 80 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/auto-update.log
tail -n 80 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/autoboot-launchd-error.log
```

Run once manually:

```bash
make autoboot-run
```

Remove automation:

```bash
make autoboot-uninstall
```

## Tailscale Auto-Start on System Reboot

Enable once on Mac Mini:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
make tailscale-enable
make tailscale-status
```

What this does:

- Uses Homebrew service to start `tailscaled` at system boot
- Runs `tailscale up` for node connectivity

Disable if needed:

```bash
make tailscale-disable
```

After reboot, verify:

```bash
make tailscale-status
make status
```

## Why This Avoids Conflicts With `resendezFIRE`

- TheOfficeCMS backend port is `5002`.
- Script uses dedicated tmux session names:
  - `officecms_flask`
  - `officecms_tailscale`
- Startup checks port `5002` and stops if another app owns it.
- No global `pkill python` style commands.

## GitHub SSH Setup (Recommended)

### 1. Generate key on Mac Mini (if needed)

```bash
ls -la ~/.ssh
ssh-keygen -t ed25519 -C "monicanieckula@macmini"
```

### 2. Load key

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 3. Copy public key and add to GitHub

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

GitHub path: `Settings -> SSH and GPG keys -> New SSH key`

Important: paste the **full public key line** (starts with `ssh-ed25519`), not the fingerprint.

### 4. Test SSH auth

```bash
ssh -T git@github.com
```

### 5. Ensure repo remote uses SSH

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
git remote -v
git remote set-url origin git@github.com:emresendev/theOfficeCMS.git
git remote -v
```

## If You See: "fatal: not a git repository"

You are not in a cloned repo directory (no `.git` folder).

Check current directory:

```bash
pwd
ls -la
```

Find real repo under `~/Documents/GitHub`:

```bash
cd /Users/monicanieckula/Documents/GitHub
find . -maxdepth 4 -type d -name .git
```

If no clone exists, reclone:

```bash
cd /Users/monicanieckula/Documents/GitHub
mv theOfficeCMS theOfficeCMS_backup_$(date +%Y%m%d_%H%M%S)
git clone git@github.com:emresendev/theOfficeCMS.git
cd theOfficeCMS
```

## `.env` Safety and Recovery

Renaming the folder with `mv theOfficeCMS theOfficeCMS_backup_<timestamp>` does **not** delete `.env`. It moves it into the backup folder.

If you recloned, copy `.env` back:

```bash
cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS_backup_<timestamp>/backend/.env \
   /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/.env
chmod 600 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/.env
```

Verify:

```bash
ls -la /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/.env
```

## Troubleshooting Matrix

### 1) Backend not reachable

```bash
make status
nc -zv 127.0.0.1 5002
nc -zv 192.168.1.34 5002
```

If no listener on 5002, run:

```bash
make backend
make attach
```

### 1b) Login fails with "Network Error" (likely CORS)

Set allowed frontend origins in backend `.env` on Mac Mini:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
printf '\nCORS_ORIGINS=https://theofficecms.com,https://www.theofficecms.com,https://macmini.tailced3de.ts.net\n' >> .env
```

Then restart backend:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
make backend
```

Validate preflight from Mac Mini:

```bash
curl -i -X OPTIONS 'http://127.0.0.1:5002/auth/login' \
  -H 'Origin: https://theofficecms.com' \
  -H 'Access-Control-Request-Method: POST'
```

Expected headers include:
- `Access-Control-Allow-Origin: https://theofficecms.com`
- `Access-Control-Allow-Credentials: true`

### 2) Tailscale shows offline / unavailable

```bash
/opt/homebrew/bin/tailscale status
sudo /opt/homebrew/bin/tailscale up
make restart
```

### 3) Port 5002 conflict error

```bash
lsof -nP -iTCP:5002 -sTCP:LISTEN
ps -p <PID> -o command=
```

Resolve the other process or change port intentionally.

### 4) tmux missing

```bash
brew install tmux
```

### 5) Wrong repo path/casing

macOS path here is case-sensitive in your workflow docs:

- `GitHub` not `github`
- `theOfficeCMS` not `theofficecms`

Use exact path:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
```

## CLI Quick Reference (Common Repetitive Tasks)

### Navigation and paths

```bash
pwd
ls -la
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
cd -
realpath backend/.env
```

### Find files/folders quickly

```bash
find . -maxdepth 3 -type f -name "*.md"
find /Users/monicanieckula/Documents/GitHub -maxdepth 4 -type d -iname "*officecms*"
rg --files | head
rg -n "app.run|port=5002|tailscale|tmux" backend
```

### Git essentials

```bash
git status
git remote -v
git branch
git pull --ff-only
git log --oneline -5
```

### Port and process checks

```bash
lsof -nP -iTCP:5002 -sTCP:LISTEN
lsof -nP -iTCP:5432 -sTCP:LISTEN
ps aux | rg "python|app.py|tailscale|tmux"
```

### Tmux essentials

```bash
tmux ls
tmux attach -t officecms_flask
# detach: Ctrl+B then D
tmux kill-session -t officecms_flask
```

### Service checks

```bash
make status
curl -sS http://127.0.0.1:5002/
```

## Scheduled Jobs (LaunchAgents)

Task reminders:

```bash
cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/com.theofficecms.taskreminders.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.theofficecms.taskreminders.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.theofficecms.taskreminders.plist
launchctl list | rg theofficecms.taskreminders
```

Quarterly mock data:

```bash
cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/scripts/com.theofficecms.mockdata.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.theofficecms.mockdata.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.theofficecms.mockdata.plist
launchctl list | rg com.theofficecms.mockdata
```

Manual mock data generation:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
source venv/bin/activate
python -m scripts.generate_mock_data --month 3 --year 2026
```
