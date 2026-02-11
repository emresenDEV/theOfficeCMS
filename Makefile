SHELL := /bin/bash
BACKEND_CTL := backend/scripts/backend_ctl.sh

.PHONY: help dev backend restart status update attach start

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
