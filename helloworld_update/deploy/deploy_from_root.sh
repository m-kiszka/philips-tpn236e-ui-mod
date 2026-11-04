#!/bin/sh
# deploy_from_root.sh - run ONCE from a root shell on the TV (e.g. over UART).
#
# Builds a writable copy of the web-UI page/ dir in /mtd_rwarea, injects the
# Hello World script into it, installs the overlay helpers, and activates the
# overlay so the change shows up. Nothing is re-signed; the signed squashfs is
# left untouched (we only mount OVER it).
#
# Put this folder on a USB stick (or scp it) and run:  sh deploy_from_root.sh
#
# Safe to re-run: every step is idempotent.

set -u
SRC_DIR=$(cd "$(dirname "$0")" && pwd)          # where these files live (USB)
RW=/mtd_rwarea/helloworld                        # our writable home
LIVE=/mtd_apexe/board/mframework/webui/PHI/page  # stock UI (RO squashfs)
PAGE=$RW/page
log() { echo "[deploy] $*"; }

[ -d "$LIVE" ] || { log "ERROR: live UI not found at $LIVE (is apexe mounted?)"; exit 1; }

log "1) create $RW"
mkdir -p "$RW" || exit 1

log "2) copy stock page/ -> $PAGE (first run only)"
if [ ! -d "$PAGE" ]; then
    cp -a "$LIVE" "$PAGE" || { log "copy failed"; exit 1; }
fi

log "3) install inject-helloworld.js into the copy"
cp -f "$SRC_DIR/inject-helloworld.js" "$PAGE/inject-helloworld.js" || exit 1

log "4) hook the inject script into index.html (idempotent)"
if ! grep -q "inject-helloworld.js" "$PAGE/index.html"; then
    # insert before the closing body tag
    sed -i 's#</body>#<script type="text/javascript" src="inject-helloworld.js"></script></body>#' \
        "$PAGE/index.html"
    grep -q "inject-helloworld.js" "$PAGE/index.html" \
        && log "   inject <script> added" || log "   WARN: could not patch index.html"
else
    log "   already hooked"
fi

log "5) install overlay helpers into $RW"
cp -f "$SRC_DIR/hw_overlay.sh" "$RW/hw_overlay.sh"
cp -f "$SRC_DIR/run_custom.sh" "$RW/run_custom.sh"
chmod +x "$RW/hw_overlay.sh" "$RW/run_custom.sh" 2>/dev/null

# 6) activate
AP_UPPER=/mtd_rwarea/ap_upper/board    # overlay-mode upper for apexe board/
if [ -d /mtd_rwarea/ap_upper ]; then
    log "6) overlay mode detected -> installing run_custom.sh into $AP_UPPER"
    mkdir -p "$AP_UPPER"
    cp -f "$SRC_DIR/run_custom.sh" "$AP_UPPER/run_custom.sh"
    chmod +x "$AP_UPPER/run_custom.sh" 2>/dev/null
    log "   it will be sourced by board/run.sh on next app start"
fi

log "6b) activate overlay now (live bind-mount) for immediate test"
sh "$RW/hw_overlay.sh" mount
sh "$RW/hw_overlay.sh" status

log "DONE. If the UI is already running, restart the app or: reboot"
log "Tip (test only): if SELinux blocks reads, 'setenforce 0' then re-mount."
