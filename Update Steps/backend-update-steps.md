# Backend Recovery Quick Reference (Mac Mini)

Backend currently runs on port `5002` (`backend/app.py`), not `5000`.

## One-time setup on Mac Mini

```bash
ssh monicanieckula@192.168.1.34
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
chmod +x backend/scripts/backend_ctl.sh
exit
```

## After Mac Mini restart

```bash
ssh monicanieckula@192.168.1.34
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
backend/scripts/backend_ctl.sh start
exit
```

## Pull latest code and restart backend

```bash
ssh monicanieckula@192.168.1.34
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
backend/scripts/backend_ctl.sh update
exit
```

## Diagnostics

```bash
# run on Mac Mini
cd /Users/monicanieckula/Documents/GitHub/theOfficeCMS
backend/scripts/backend_ctl.sh status

# manual port check (Mac Mini or MBP)
nc -zv 192.168.1.34 5002

# attach to Flask console logs
backend/scripts/backend_ctl.sh attach
# detach: Ctrl+B then D
```

## If Tailscale still is not connected

```bash
sudo /opt/homebrew/bin/tailscale up
backend/scripts/backend_ctl.sh start
```
