# TheOfficeCMS

TheOfficeCMS is a CRM and operations platform for small-to-mid sized teams. It combines account management, sales workflow, invoicing, task tracking, reminders, and reporting in a single system.

Live app: https://theofficecms.com

## Operations Docs

- Mac Mini backend runbook: `docs/MAC_MINI_BACKEND_RUNBOOK.md`
- Quick reference: `QUICK_REFERENCE.md`

## Feature Updates (Current)

- Account and contact management with linked records
- Pipeline tracking with followers and activity visibility
- Invoice lifecycle: create, edit, paid, unpaid, past-due flows
- Payment and commission tracking
- Task management with reminders and overdue notifications
- Calendar/events with attendee support
- Department, branch, region, user-role administration
- Analytics and audit logging endpoints
- Quarterly mock-data generation automation
- Background reminder job via launchd on Mac Mini

## Primary Use Cases

- Track accounts from prospect to customer through pipeline stages
- Manage invoices/payments and monitor unpaid or overdue balances
- Coordinate tasks across teams with reminders and notification history
- Review sales/commission performance for employees and branches
- Maintain audit history for operational and admin changes
- Run lightweight production hosting from a Mac Mini with secure tunnel access

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Flask + Python + PostgreSQL
- Deployment: Vercel (frontend), Mac Mini + Tailscale Funnel (backend)

## Mac Mini Operations (Simplified)

Run these from the project root on the Mac Mini:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
make help
```

Available commands:

- `make backend`: restart TheOfficeCMS backend only (Flask)
- `make dev`: alias of `make backend`
- `make restart`: ensure Tailscale is up, then restart backend
- `make start`: alias of `make restart`
- `make update`: pull latest backend code, then restart backend
- `make status`: show tmux sessions, Tailscale status, and Flask listener
- `make attach`: attach to backend tmux logs
- `make autoboot-install`: auto-run update/restart on login/restart + every 30 min
- `make autoboot-status`: check launchd job + recent auto-update logs
- `make autoboot-run`: run auto-update/restart now
- `make autoboot-uninstall`: remove auto-run job

### Frontend API Base URL (Current Funnel Path Split)

Set this in your frontend host environment variables (Vercel/Netlify):

- `VITE_API_BASE_URL=https://macmini.tailced3de.ts.net/officecms`

### Automatic Update + Restart (Mac Mini)

Install once on Mac Mini:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
make autoboot-install
```

What this does:

- Runs `backend/scripts/auto_update_restart.sh` at login/restart (`RunAtLoad`)
- Re-runs every 30 minutes (`StartInterval=1800`)
- Pulls latest GitHub updates (fast-forward only when working tree is clean)
- Restarts TheOfficeCMS backend using `backend/scripts/backend_ctl.sh backend`

Logs:

- `backend/logs/auto-update.log`
- `backend/logs/autoboot-launchd.log`
- `backend/logs/autoboot-launchd-error.log`

### No-Conflict Notes (with resendezFIRE)

- TheOfficeCMS backend port is `5002`.
- The startup script uses dedicated tmux session names:
  - `officecms_flask`
  - `officecms_tailscale`
- The script checks port `5002` and refuses to start if another app owns it.
- No broad kill commands (`pkill python`, etc.) are used by these Make targets.

## Local Development

Backend:

```bash
cd backend
source venv/bin/activate
python app.py
```

Frontend:

```bash
cd frontend
npm run dev
```

## Security Notes

- PostgreSQL is localhost-only on the Mac Mini
- Backend is exposed through Tailscale Funnel (HTTPS)
- CORS restricted to approved origins (localhost, Vercel domain, Funnel domain)
- Secrets are stored in `.env` and should not be committed

## Scheduled Jobs (Mac Mini)

Task reminders (every 15 min):

```bash
cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/com.theofficecms.taskreminders.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.theofficecms.taskreminders.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.theofficecms.taskreminders.plist
launchctl list | grep theofficecms.taskreminders
```

Quarterly mock data:

```bash
cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/scripts/com.theofficecms.mockdata.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.theofficecms.mockdata.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.theofficecms.mockdata.plist
launchctl list | grep com.theofficecms.mockdata
```

Manual mock-data run:

```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
source venv/bin/activate
python -m scripts.generate_mock_data --month 3 --year 2026
```
