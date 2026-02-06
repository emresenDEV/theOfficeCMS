   # TheOfficeCMS

   A comprehensive CRM and business management application built for small to medium enterprises. Manage accounts, invoices, commissions, employees, and more with a
   modern, intuitive interface.

   **Live Demo:** https://theofficecms.com

   ---

   ## Documentation

   - **DEPLOYMENT_GUIDE.md:** Detailed setup, terminal commands, troubleshooting
     - Complete with expected outputs for each command
     - Step-by-step instructions for all services
     - Verification procedures
     - Architecture decision log

   - **frontend/:** React SPA
   - **backend/:** Flask API + PostgreSQL

   ---

   ## Quick Start

   ### Local Development

   **Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

   ### Production

   See: **backend/DEPLOYMENT_GUIDE.md**

   ---

   ## Tech Stack

   - **Frontend:** React + Vite + Tailwind
   - **Backend:** Flask + Python 3.13 + PostgreSQL
   - **Deployment:** Vercel (frontend) + Mac Mini + Tailscale Funnel (backend)
   - **Database:** PostgreSQL 15 (localhost only)

   ---

   ## Key Decision: Why Tailscale Funnel?

   **Evaluated Options:**
   - AWS EC2 - Works great but costs $5-15/mo
   - Caddy + Port Forwarding - FAILED on macOS ARM (IPv6-only issue)
   - ngrok - Works but costs $15/mo
   - Cloudflare Tunnel - Legacy, works but complex
   - **Tailscale Funnel** - CHOSEN: Free, secure, simple, reusable

   **Why Caddy Failed on macOS:**
   macOS ARM defaults to IPv6-only binding. Even with explicit `0.0.0.0:443` config, it binds to IPv6. Router port forwarding (IPv4) couldn't reach it. Workaround with
    socat bridge was too complex.

   **Why Tailscale Wins:**
   - Free tier (100 nodes, we use 1)
   - End-to-end encryption + zero-trust
   - One command: `tailscale funnel --bg 5002`
   - No router configuration needed
   - Reusable for all portfolio projects

   ---

   ## Security

   - PostgreSQL: localhost-only (not exposed)
   - pgAdmin: localhost-only (not exposed)
   - Backend: encrypted Tailscale tunnel only
   - CORS: restricted to Vercel + Tailscale URLs
   - Secrets: .env with 600 permissions
   - Firewall: macOS firewall enabled
   - HTTPS: Let's Encrypt via Tailscale

   ---

   ## Support

   For terminal commands, expected outputs, step-by-step setup, troubleshooting, and complete verification procedures, see:

   **backend/DEPLOYMENT_GUIDE.md**

   ---

## Task Reminders (LaunchAgent on Mac Mini)

   The task reminder/overdue job runs every 15 minutes via launchd.

   ```bash
   cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/com.theofficecms.taskreminders.plist ~/Library/LaunchAgents/
   launchctl unload ~/Library/LaunchAgents/com.theofficecms.taskreminders.plist 2>/dev/null
   launchctl load ~/Library/LaunchAgents/com.theofficecms.taskreminders.plist
   launchctl list | grep theofficecms.taskreminders
   ```

Notes:
- Runs automatically every 15 minutes and on login.
- Does not require restarting the Flask app.

---

## Mock Data Generator (Quarterly on Mac Mini)

The quarterly mock data job runs on the 1st of Jan/Apr/Jul/Oct at 2:15 AM via launchd.

```bash
cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/scripts/com.theofficecms.mockdata.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.theofficecms.mockdata.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.theofficecms.mockdata.plist
launchctl list | grep com.theofficecms.mockdata
```

Manual run (prompted):
```bash
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
source venv/bin/activate
python -m scripts.generate_mock_data
```

Manual run with explicit date:
```bash
python -m scripts.generate_mock_data --month 2 --year 2026
```

Notes:
- Auto mode is set in the LaunchAgent and runs with `--auto` (no prompts).
- Logs: `/Users/monicanieckula/Library/Logs/theOfficeCMS-mockdata.log`

**Version:** 1.0.0 | **Updated:** November 25, 2025
   ENDOFFILE
EOF
