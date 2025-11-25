# TheOfficeCMS - Quick Reference Card

## Startup Commands (Copy & Paste Ready)

### Mac Mini - Full Startup

```bash
# 1. Start Tailscale daemon
sudo /opt/homebrew/bin/tailscaled &
sleep 2

# 2. Authenticate with Tailscale (first time only)
sudo /opt/homebrew/bin/tailscale up

# 3. Start Flask backend
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
source venv/bin/activate
python app.py &
sleep 3

# 4. Enable Tailscale funnel
sudo tailscale funnel --bg 5002

# 5. Verify all services
echo "=== TAILSCALE ===" && sudo tailscale status
echo "=== FUNNEL ===" && sudo tailscale funnel status
echo "=== FLASK ===" && lsof -i :5002 -n | grep LISTEN
echo "=== POSTGRES ===" && lsof -i :5432 -n | grep LISTEN
```

---

## Verification Commands

```bash
# Check Tailscale connected
sudo tailscale status

# Check funnel active
sudo tailscale funnel status

# Check Flask running
lsof -i :5002 -n | grep LISTEN

# Check PostgreSQL running
lsof -i :5432 -n | grep LISTEN

# Test backend
curl https://macmini.tailced3de.ts.net/

# Check frontend
open https://theofficecms.com
```

---

## Common Issues & Quick Fixes

### Connection Refused?

```bash
# Check all three in order
sudo tailscale status                    # 1. Tailscale connected?
sudo tailscale funnel status             # 2. Funnel active?
lsof -i :5002 -n | grep LISTEN         # 3. Flask running?

# If any missing, restart that service
sudo /opt/homebrew/bin/tailscaled &     # Restart Tailscale
sudo /opt/homebrew/bin/tailscale up     # Re-auth
cd backend && source venv/bin/activate && python app.py &  # Restart Flask
sudo tailscale funnel --bg 5002         # Restart funnel
```

### CORS Error?

```bash
# Check app.py has correct origins
grep "origins=" /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/app.py

# Should include:
# "https://theofficecms.com"
# "https://macmini.tailced3de.ts.net"

# If missing, edit app.py and restart:
pkill -9 python
python app.py &
```

### Database Error?

```bash
# Start PostgreSQL
brew services start postgresql@15

# Check it's running
lsof -i :5432 -n | grep LISTEN

# Test connection
psql -U postgres -d dunderdata
# If connected, type: \q to quit
```

### Flask Won't Start?

```bash
# Kill any existing processes
pkill -9 python
sleep 2

# Make sure venv is activated
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
source venv/bin/activate

# Try again
python app.py
```

---

## Complete Restart (Nuclear Option)

```bash
# Kill everything
pkill -9 python
pkill -9 tailscale
pkill -9 tailscaled
sleep 3

# Start fresh (copy from "Startup Commands" section above)
```

---

## Monitoring Commands

```bash
# Watch for errors in Flask
# (While Flask is running in terminal, errors appear in real-time)

# Check logs if backgrounded
ps aux | grep python | grep app

# See all listening ports
lsof -i -P -n | grep -E "LISTEN|ESTABLISHED"

# See Tailscale detailed status
sudo tailscale status -v

# See funnel details
sudo tailscale funnel status

# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Check PostgreSQL is localhost-only
lsof -i :5432 -n
# Should show ONLY: 127.0.0.1:5432 and [::1]:5432
# NOT: 0.0.0.0:5432
```

---

## Development Workflow

### Make Backend Changes

```bash
# Edit code
vim /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/routes/account_routes.py

# Test locally (Flask auto-reloads)
# Changes appear immediately if Flask is running

# Commit when working
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
git add .
git commit -m "Add new feature"
git push origin main
```

### Make Frontend Changes

```bash
# Edit code
vim /Users/monica/Desktop/theOfficeCMS/frontend/src/pages/AccountsPage.jsx

# Test locally (npm auto-reloads)
# Visit http://localhost:5174 in browser

# Commit and push (auto-deploys to Vercel)
cd /Users/monica/Desktop/theOfficeCMS/frontend
git add .
git commit -m "Update UI"
git push origin main
```

---

## URLs Reference

| Service | Local Dev | Production |
|---------|-----------|-----------|
| Frontend | http://localhost:5174 | https://theofficecms.com |
| Backend | http://127.0.0.1:5002 | https://macmini.tailced3de.ts.net |
| pgAdmin | http://localhost:5050 | N/A (localhost only) |
| Database | localhost:5432 | localhost:5432 (local only) |

---

## Environment Variables

```bash
# Backend .env location
/Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/.env

# Frontend .env location
/Users/monica/Desktop/theOfficeCMS/frontend/.env
```

---

## Security Checklist (Before Demo)

```bash
# 1. PostgreSQL localhost only?
lsof -i :5432 -n | grep LISTEN
# Should show: 127.0.0.1:5432

# 2. Flask running via Tailscale only?
sudo tailscale funnel status
# Should show funnel active

# 3. Firewall enabled?
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
# Should say: Firewall is enabled.
```

---

## Demo Readiness (1 Minute Check)

```bash
# Run this before each demo
echo "=== 1. Tailscale Status ===" && sudo tailscale status && \
echo -e "\n=== 2. Funnel Status ===" && sudo tailscale funnel status && \
echo -e "\n=== 3. Flask Running ===" && lsof -i :5002 -n | grep LISTEN && \
echo -e "\n=== 4. PostgreSQL Running ===" && lsof -i :5432 -n | grep LISTEN && \
echo -e "\n=== 5. Backend Test ===" && curl -s https://macmini.tailced3de.ts.net/ | head -20 && \
echo -e "\n✅ All checks passed! Ready for demo."
```

---

## Useful Git Commands

```bash
# Check uncommitted changes
git status

# See recent commits
git log --oneline -5

# Push changes (triggers Vercel auto-deploy for frontend)
git push origin main

# Check remote
git remote -v
```

---

## PostgreSQL Useful Commands

```bash
# Connect to database
psql -U postgres -d dunderdata

# List tables
\dt

# Show table structure
\d table_name

# Quit psql
\q

# Run SQL directly
psql -U postgres -d dunderdata -c "SELECT * FROM accounts LIMIT 5;"
```

---

## Help & Documentation

- **Full Deployment Guide:** DEPLOYMENT_GUIDE.md (local only, not in git)
- **Terminal Commands with Outputs:** DEPLOYMENT_GUIDE.md
- **Troubleshooting:** DEPLOYMENT_GUIDE.md
- **Architecture Decisions:** DEPLOYMENT_GUIDE.md

---

**Bookmark these files!**
- **This file:** QUICK_REFERENCE.md (local only, not in git)
- **Full guide:** DEPLOYMENT_GUIDE.md (local only, not in git)
- **README:** README.md (in git, public)

---

**Last Updated:** November 25, 2025
