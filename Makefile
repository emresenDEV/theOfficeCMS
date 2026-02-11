SHELL := /bin/bash
BACKEND_CTL := backend/scripts/backend_ctl.sh
AUTO_UPDATE_SCRIPT := backend/scripts/auto_update_restart.sh
AUTOBOOT_PLIST_SRC := backend/scripts/com.theofficecms.autoboot.plist
AUTOBOOT_PLIST_DST := $(HOME)/Library/LaunchAgents/com.theofficecms.autoboot.plist

.PHONY: help dev backend restart status update attach start autoboot-install autoboot-uninstall autoboot-status autoboot-run tailscale-enable tailscale-disable tailscale-status

help: ## Show available commands
	@echo "TheOfficeCMS commands"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*## /\t- /'

dev: ## Restart backend only (recommended for normal code changes)
	@$(BACKEND_CTL) backend

backend: ## Restart backend only (Flask on port 5002)
	@$(BACKEND_CTL) backend

restart: ## Full restart (ensure Tailscale + restart backend)
	@$(BACKEND_CTL) restart

start: ## Alias for full restart
	@$(BACKEND_CTL) start

status: ## Show tmux, tailscale, and backend status
	@$(BACKEND_CTL) status

update: ## Pull latest backend code and restart backend
	@$(BACKEND_CTL) update

attach: ## Attach to backend tmux session logs
	@$(BACKEND_CTL) attach

autoboot-install: ## Install launchd job (run on login/restart + every 30m)
	@mkdir -p backend/logs
	@cp $(AUTOBOOT_PLIST_SRC) $(AUTOBOOT_PLIST_DST)
	@launchctl unload $(AUTOBOOT_PLIST_DST) 2>/dev/null || true
	@launchctl load $(AUTOBOOT_PLIST_DST)
	@echo "Installed: $(AUTOBOOT_PLIST_DST)"
	@launchctl list | grep com.theofficecms.autoboot || true

autoboot-uninstall: ## Remove launchd auto-update/restart job
	@launchctl unload $(AUTOBOOT_PLIST_DST) 2>/dev/null || true
	@rm -f $(AUTOBOOT_PLIST_DST)
	@echo "Removed: $(AUTOBOOT_PLIST_DST)"

autoboot-status: ## Show launchd autoboot job status and recent logs
	@echo "=== launchd ==="
	@launchctl list | grep com.theofficecms.autoboot || true
	@echo
	@echo "=== recent auto-update log ==="
	@tail -n 40 backend/logs/auto-update.log 2>/dev/null || echo "No auto-update log yet"

autoboot-run: ## Run auto-update/restart script immediately
	@$(AUTO_UPDATE_SCRIPT)

tailscale-enable: ## Enable Tailscale at boot (Homebrew service) and bring node up
	@sudo brew services start tailscale
	@sudo /opt/homebrew/bin/tailscale up
	@echo "Tailscale boot startup enabled"

tailscale-disable: ## Disable Tailscale Homebrew boot service
	@sudo brew services stop tailscale
	@echo "Tailscale boot startup disabled"

tailscale-status: ## Show Tailscale daemon/service/funnel status
	@echo "=== brew services ==="
	@brew services list | grep tailscale || true
	@echo
	@echo "=== tailscale ==="
	@/opt/homebrew/bin/tailscale status || true
	@echo
	@echo "=== funnel ==="
	@/opt/homebrew/bin/tailscale funnel status || true
