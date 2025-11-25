# TheOfficeCMS

A comprehensive CRM and business management application built for small to medium enterprises. Manage accounts, invoices, commissions, employees, and more with a modern, intuitive interface.

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
macOS ARM defaults to IPv6-only binding. Even with explicit `0.0.0.0:443` config, it binds to IPv6. Router port forwarding (IPv4) couldn't reach it. Workaround with socat bridge was too complex.

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

**Version:** 1.0.0 | **Updated:** November 25, 2025
