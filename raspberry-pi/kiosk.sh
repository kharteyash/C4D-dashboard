#!/bin/bash
# C4D Mortgage dashboard kiosk launcher.
# Tuned for Raspberry Pi 3 (1GB RAM) on Raspberry Pi OS with desktop,
# works on both X11 (Bullseye/Bookworm on Pi 3) and Wayland (trixie).
DASHBOARD="https://lucent-cocada-4772fc.netlify.app/"

# Keep the screen awake (X11 only; harmless no-ops elsewhere).
if command -v xset >/dev/null 2>&1; then
  xset s off || true
  xset s noblank || true
  xset -dpms || true
fi

# Use whichever Chromium is installed (chromium-browser on Pi OS, chromium on Debian).
CHROME="$(command -v chromium-browser || command -v chromium)"

# Launch Chromium in kiosk mode, and relaunch it if it ever dies.
while true; do
  # Clear any crash flags so no "restore pages" bubble appears after a hard power-off.
  CFG="$HOME/.config/chromium/Default/Preferences"
  if [ -f "$CFG" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CFG"
    sed -i 's/"exit_type":"[^"]*"/"exit_type":"Normal"/' "$CFG"
  fi

  "$CHROME" \
    --kiosk \
    --start-fullscreen \
    --incognito \
    --noerrordialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-features=Translate \
    --disable-component-update \
    --check-for-update-interval=31536000 \
    --autoplay-policy=no-user-gesture-required \
    --password-store=basic \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --disk-cache-size=52428800 \
    --renderer-process-limit=2 \
    --ozone-platform-hint=auto \
    "$DASHBOARD"

  # If Chromium exits for any reason, wait a moment and relaunch.
  sleep 3
done
