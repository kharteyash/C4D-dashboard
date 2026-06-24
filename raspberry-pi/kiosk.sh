#!/bin/bash
# SafeTrust dashboard kiosk launcher for Raspberry Pi.
# For Raspberry Pi OS (Debian 13 "trixie") — Wayland / labwc.
DASHBOARD="https://safetrust-dashboard.netlify.app/"

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
    --incognito \
    --noerrordialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-features=Translate \
    --check-for-update-interval=31536000 \
    --autoplay-policy=no-user-gesture-required \
    --ozone-platform-hint=auto \
    --password-store=basic \
    --ignore-gpu-blocklist \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --disable-gpu-driver-bug-workarounds \
    --enable-features=CanvasOopRasterization \
    "$DASHBOARD"

  # If Chromium exits for any reason, wait a moment and relaunch.
  sleep 3
done
