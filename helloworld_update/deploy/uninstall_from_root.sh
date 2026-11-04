#!/bin/sh
# uninstall_from_root.sh - revert the Hello World overlay. Run from root on the TV.
# The signed squashfs was never modified, so this fully restores the stock UI.

set -u
RW=/mtd_rwarea/helloworld
AP_UPPER=/mtd_rwarea/ap_upper/board
log() { echo "[uninstall] $*"; }

log "1) unmount overlay (if active)"
[ -f "$RW/hw_overlay.sh" ] && sh "$RW/hw_overlay.sh" umount

log "2) remove overlay-mode hook"
[ -f "$AP_UPPER/run_custom.sh" ] && rm -f "$AP_UPPER/run_custom.sh"

log "3) remove our writable copy"
rm -rf "$RW"

log "DONE. Restart the app or reboot to be back on the stock UI."
