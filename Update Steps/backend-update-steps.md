# Quick Reference: Update Backend Code from MacBook Pro

## Update Backend Code & Restart Flask

```bash
# Step 1: SSH into Mac Mini
ssh monicanieckula@192.168.1.34

# Step 2: Navigate to backend directory
cd ~/Documents/github/theofficecms/backend

# Step 3: Pull latest code from GitHub
git pull

# Step 4: Attach to Flask tmux session
tmux attach -t flask

# Step 5: Stop Flask
# Press Ctrl+C

# Step 6: Restart Flask
source venv/bin/activate
python app.py

# Step 7: Detach from tmux (Flask keeps running)
# Press Ctrl+B, then D

# Step 8: Exit SSH
exit
```

---

## If Mac Mini Restarts (Flask & Tailscale Need Restarting)

```bash
# Step 1: SSH into Mac Mini
ssh monicanieckula@192.168.1.34

# Step 2: Start Tailscale in tmux
tmux new -s tailscale
sudo /opt/homebrew/bin/tailscaled
# Press Ctrl+B, then D to detach

# Step 3: Start Flask in tmux
tmux new -s flask
cd ~/Documents/github/theofficecms/backend
source venv/bin/activate
python app.py
# Press Ctrl+B, then D to detach

# Step 4: Done!
exit
```

---

## Notes
- Flask will continue running in the background after you detach from tmux
- You can close your MacBook Pro terminal - Flask stays running on Mac Mini
- If you need to view Flask logs anytime: `ssh monicanieckula@192.168.1.34` then `tmux attach -t flask`
- Both Flask and Tailscale will keep running until Mac Mini restarts
