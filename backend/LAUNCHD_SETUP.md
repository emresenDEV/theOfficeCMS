# TheOfficeCMS - LaunchD Service Setup Guide

This guide explains how to set up LaunchD services on macOS so Flask, Tailscale, and PostgreSQL run automatically on boot and stay running without terminal windows.

---

## Overview

LaunchD is macOS's native service management system. Unlike terminal windows, LaunchD services:
- Start automatically on Mac mini boot
- Restart automatically if they crash
- Run in the background without terminal windows
- Log output to files for debugging
- Can be managed with `launchctl` commands

---

## What We're Setting Up

| Service | Purpose | Auto-start | Restart on Crash |
|---------|---------|-----------|-----------------|
| Flask Backend | API server on port 5002 | Yes | Yes |
| Tailscale Daemon | Zero-trust networking | Yes (manual first run) | Yes |
| Tailscale Funnel | Public tunnel to Flask | Manual | N/A |
| PostgreSQL | Database | Yes (via Homebrew) | Yes |

---

## Prerequisites

Before setting up LaunchD, ensure:

```bash
# 1. Flask venv exists and works
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend
source venv/bin/activate
python app.py  # Test it runs, then Ctrl+C to stop

# 2. PostgreSQL is running (via Homebrew)
brew services list | grep postgresql
# Should show: postgresql@15 ... started ... /opt/homebrew/opt/postgresql@15/...

# 3. Tailscale is installed
which tailscaled
# Should show: /opt/homebrew/bin/tailscaled
```

---

## Part 1: Flask Backend Service

### Step 1: Create the plist file

Copy `com.theofficecms.flask.plist` to the LaunchD directory:

```bash
# First, create logs directory if it doesn't exist
mkdir -p /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs

# Copy the plist file
sudo cp /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/com.theofficecms.flask.plist \
  /Library/LaunchDaemons/
```

Note: Using `/Library/LaunchDaemons/` (requires sudo) means Flask runs as root and starts automatically on boot. If you prefer user-level only, use `~/Library/LaunchAgents/` instead (no sudo needed, but only runs when user is logged in).

### Step 2: Set correct permissions

```bash
sudo chmod 644 /Library/LaunchDaemons/com.theofficecms.flask.plist
```

### Step 3: Load the service

```bash
sudo launchctl load /Library/LaunchDaemons/com.theofficecms.flask.plist
```

### Step 4: Verify it's running

```bash
# Check if service is loaded
launchctl list | grep theofficecms

# Test Flask is responding
curl -v http://127.0.0.1:5002/

# Check logs
tail -50 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/flask.log
tail -50 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/flask-error.log
```

---

## Part 2: Tailscale Daemon Service

Tailscale's Homebrew installation already includes LaunchD setup. To enable it:

```bash
# Check if Tailscale daemon is loaded
launchctl list | grep tailscale

# If not loaded, load it manually (first time only)
sudo launchctl load /Library/LaunchDaemons/com.tailscale.ipn.plist
```

### Verify Tailscale is running:

```bash
sudo tailscale status
# Should show: Logged in as...
```

---

## Part 3: Tailscale Funnel

Unlike Flask and Tailscale daemon, the funnel needs to be created manually because it's tied to your Tailscale account configuration.

### One-time setup:

```bash
# First time: authenticate and enable
sudo tailscale up

# Create the funnel
sudo tailscale funnel 5002
```

### To make funnel auto-start after Mac mini boots

Create a LaunchD plist for the funnel:

```bash
sudo cat > /Library/LaunchDaemons/com.tailscale.funnel.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tailscale.funnel</string>
    <key>Program</key>
    <string>/opt/homebrew/bin/tailscale</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/tailscale</string>
        <string>funnel</string>
        <string>5002</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/tailscale-funnel.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/tailscale-funnel-error.log</string>
</dict>
</plist>
EOF

sudo chmod 644 /Library/LaunchDaemons/com.tailscale.funnel.plist
sudo launchctl load /Library/LaunchDaemons/com.tailscale.funnel.plist
```

### Verify funnel is active:

```bash
sudo tailscale funnel status
# Should show: Serving on https://macmini.tailced3de.ts.net
```

---

## Part 4: PostgreSQL Service

PostgreSQL installed via Homebrew should already have LaunchD service. Verify:

```bash
# Check if PostgreSQL is loaded
brew services list | grep postgresql

# Should show: postgresql@15 ... started

# If not, start it:
brew services start postgresql@15

# Verify it's running
lsof -i :5432 -n | grep LISTEN
# Should show: postgres ... IPv6 [::1]:5432 ... and IPv4 127.0.0.1:5432
```

---

## Management Commands

Once services are set up, use these commands to manage them:

### Check service status

```bash
# List all loaded services
launchctl list

# Check specific service
launchctl list | grep theofficecms
launchctl list | grep tailscale
```

### Stop a service (temporarily)

```bash
sudo launchctl unload /Library/LaunchDaemons/com.theofficecms.flask.plist
sudo launchctl unload /Library/LaunchDaemons/com.tailscale.funnel.plist
```

### Start a service

```bash
sudo launchctl load /Library/LaunchDaemons/com.theofficecms.flask.plist
sudo launchctl load /Library/LaunchDaemons/com.tailscale.funnel.plist
```

### Restart a service

```bash
sudo launchctl unload /Library/LaunchDaemons/com.theofficecms.flask.plist
sudo launchctl load /Library/LaunchDaemons/com.theofficecms.flask.plist
```

### View service logs

```bash
# Flask logs
tail -100 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/flask.log
tail -100 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/flask-error.log

# Tailscale funnel logs
tail -100 /var/log/tailscale-funnel.log
tail -100 /var/log/tailscale-funnel-error.log
```

---

## Troubleshooting

### Flask service won't start

Check the error log:
```bash
tail -100 /Users/monicanieckula/Documents/GitHub/theOfficeCMS/backend/logs/flask-error.log
```

Common issues:
- Port 5002 already in use: `lsof -i :5002`
- venv path is wrong: verify path in plist matches your system
- Permissions issue: check `ls -la /Library/LaunchDaemons/com.theofficecms.flask.plist`

### Service doesn't auto-start on boot

Verify it's loaded:
```bash
sudo launchctl list | grep theofficecms
```

If not loaded:
```bash
sudo launchctl load /Library/LaunchDaemons/com.theofficecms.flask.plist
```

### Want to stop auto-start behavior

```bash
sudo launchctl unload /Library/LaunchDaemons/com.theofficecms.flask.plist
```

### Check if plist is valid XML

```bash
plutil -lint /Library/LaunchDaemons/com.theofficecms.flask.plist
```

---

## Boot Sequence After Full Mac Mini Restart

With all services properly configured:

1. On boot: LaunchD automatically starts services (no manual action needed)
2. PostgreSQL starts (Homebrew service)
3. Tailscale daemon starts
4. Flask starts (and waits for PostgreSQL to be ready)
5. Tailscale funnel starts and exposes Flask to the internet

Full verification (run this after boot):

```bash
echo "=== PostgreSQL ===" && lsof -i :5432 -n | grep LISTEN && \
echo "=== Flask ===" && lsof -i :5002 -n | grep LISTEN && \
echo "=== Tailscale Status ===" && sudo tailscale status && \
echo "=== Tailscale Funnel ===" && sudo tailscale funnel status && \
echo "=== Test Backend ===" && curl -v https://macmini.tailced3de.ts.net/
```

---

## Production Readiness Checklist

- [ ] Flask plist copied to `/Library/LaunchDaemons/`
- [ ] Flask plist has correct permissions (644)
- [ ] Flask plist is loaded: `launchctl list | grep theofficecms`
- [ ] Tailscale funnel plist created and loaded
- [ ] PostgreSQL is running: `brew services list | grep postgresql`
- [ ] All services survive a Mac mini reboot
- [ ] Frontend can connect to backend after reboot
- [ ] Firewall is still enabled: `sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`

---

## References

- Apple LaunchD Documentation: https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchDaemons.html
- launchctl Manual: https://ss64.com/osx/launchctl.html
- Tailscale on macOS: https://tailscale.com/kb/1017/macos-variants/
