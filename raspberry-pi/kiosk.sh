#!/bin/bash
# SafeTrust dashboard kiosk launcher for Raspberry Pi.
# Path to the dashboard HTML file on the Pi:
DASHBOARD="/home/pi/dashboard/index.html"

# --- Keep the screen awake (no blanking / screensaver) ---
export DISPLAY=:0
xset s off          # disable screensaver
xset -dpms          # disable display power management
xset s noblank      # don't blank the video device

# Hide the mouse cursor when idle
unclutter -idle 0.5 -root &

# --- Launch Chromium in kiosk mode, and relaunch it if it ever dies ---
while true; do
  # Clean up any "didn't shut down cleanly" restore bubble
  CFG="$HOME/.config/chromium/Default/Preferences"
  if [ -f "$CFG" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CFG"
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CFG"
  fi

  chromium-browser \
    --kiosk \
    --incognito \
    --noerrordialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-features=Translate \
    --check-for-update-interval=31536000 \
    --autoplay-policy=no-user-gesture-required \
    "$DASHBOARD"

  # If Chromium exits for any reason, wait a moment and relaunch.
  sleep 3
done
