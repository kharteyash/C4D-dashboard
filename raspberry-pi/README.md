# Office TV Dashboard — Raspberry Pi Kiosk Setup

This runs `index.html` fullscreen on a TV, forever, auto-starting on boot and
auto-recovering if the browser crashes. No web server or hosting needed.

## 1. Put the files on the Pi

Copy the whole `dashboard` folder to the Pi so you have:

```
/home/pi/dashboard/index.html
/home/pi/dashboard/raspberry-pi/kiosk.sh
```

(If your username isn't `pi`, update the paths in `kiosk.sh` and below.)

## 2. Install what's needed

```bash
sudo apt update
sudo apt install -y chromium-browser unclutter x11-xserver-utils
```

## 3. Make the launcher executable

```bash
chmod +x /home/pi/dashboard/raspberry-pi/kiosk.sh
```

## 4. Auto-start on boot

Raspberry Pi OS has TWO possible setups depending on version. Check which one
you have, then follow A or B.

### A) Older Pi OS (X11 / LXDE — "Bullseye" and earlier)

Create the autostart file:

```bash
mkdir -p /home/pi/.config/lxsession/LXDE-pi
nano /home/pi/.config/lxsession/LXDE-pi/autostart
```

Put this single line in it:

```
@/home/pi/dashboard/raspberry-pi/kiosk.sh
```

### B) Newer Pi OS Bookworm (Wayland, default on Pi 4/5)

Use the user systemd service instead:

```bash
mkdir -p /home/pi/.config/systemd/user
nano /home/pi/.config/systemd/user/dashboard.service
```

Paste:

```ini
[Unit]
Description=Office TV Dashboard kiosk
After=graphical-session.target

[Service]
ExecStart=/home/pi/dashboard/raspberry-pi/kiosk.sh
Restart=always

[Install]
WantedBy=graphical-session.target
```

Then enable it:

```bash
systemctl --user enable dashboard.service
sudo loginctl enable-linger pi
```

> Not sure which version? Run `cat /etc/os-release`. "bookworm" = use B.

## 5. Set the Pi to boot to desktop & auto-login

```bash
sudo raspi-config
```

- **System Options -> Boot / Auto Login -> Desktop Autologin**

This makes the Pi reach the desktop without a keyboard, so the kiosk can start.

## 6. Reboot and you're done

```bash
sudo reboot
```

The TV should come up showing the dashboard fullscreen and stay there forever.

---

## Optional: reboot the Pi every night (keeps it fresh for months)

Reboots at 4:00 AM daily:

```bash
sudo crontab -e
```

Add:

```
0 4 * * * /sbin/reboot
```

## Troubleshooting

- **Screen goes black after a while** -> the `xset` lines in `kiosk.sh` handle
  this; make sure the script actually ran. On Wayland (Bookworm) screen blanking
  is controlled by the desktop: Preferences -> Screen Blanking -> Off, or run
  `xset` won't apply — disable blanking in the Screensaver settings instead.
- **"Restore pages?" bubble** -> already handled by the `sed` cleanup and
  `--disable-session-crashed-bubble` in `kiosk.sh`.
- **Data not updating** -> the dashboard needs internet (Wi-Fi/Ethernet) for
  weather, news, and stock APIs. Confirm the Pi is online.
- **Want to exit kiosk** -> plug in a keyboard and press `Ctrl+Alt+F2` for a
  terminal, or SSH in and `pkill chromium`.
