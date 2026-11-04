#!/bin/sh
# hw_overlay.sh - core overlay helper for the Hello World update.
#
# Overlays our modified web-UI "page" directory on top of the signed, read-only
# squashfs, WITHOUT re-signing anything. It bind-mounts a writable copy kept in
# /mtd_rwarea over the live UI path. Works from a root shell (UART) on a stock
# (production) set, and is also what run_custom.sh calls in overlay mode.
#
# Usage:  hw_overlay.sh mount | umount | status
#
# Idempotent and fail-safe: if the payload is missing it does nothing.

HW_SRC=/mtd_rwarea/helloworld/page                               # our writable copy
HW_DST=/mtd_apexe/board/mframework/webui/PHI/page                 # live UI path (RO squashfs)
LOG=/dev/console

log() { echo "[hw_overlay] $*" > "$LOG" 2>/dev/null; }

is_mounted() { mount | grep -q " $HW_DST "; }

do_mount() {
    if [ ! -d "$HW_SRC" ]; then log "no payload at $HW_SRC, skipping"; return 0; fi
    if is_mounted; then log "already mounted"; return 0; fi
    if [ ! -d "$HW_DST" ]; then log "target $HW_DST missing (UI not mounted yet?)"; return 1; fi

    # Try to match the SELinux context of the original tree so the webview/uhttpd
    # can read our files (best-effort; ignored on non-SELinux builds).
    command -v chcon >/dev/null 2>&1 && chcon -R --reference="$HW_DST" "$HW_SRC" 2>/dev/null

    if mount -o bind "$HW_SRC" "$HW_DST" 2>>"$LOG"; then
        log "overlay OK: $HW_SRC -> $HW_DST"
        return 0
    fi
    log "overlay FAILED"
    return 1
}

do_umount() {
    if is_mounted; then umount "$HW_DST" 2>>"$LOG" && log "unmounted"; else log "not mounted"; fi
}

case "$1" in
    mount)  do_mount ;;
    umount) do_umount ;;
    status) is_mounted && echo "overlay: ACTIVE" || echo "overlay: inactive" ;;
    *)      echo "usage: $0 mount|umount|status" ;;
esac
