#!/bin/sh
# run_custom.sh
#
# This is the documented hook: /mtd_apexe/board/run.sh does
#     if [ -f "./run_custom.sh" ]; then source ./run_custom.sh; run_custom_main; fi
# so a run_custom.sh placed next to run.sh is sourced at app start and must
# define run_custom_main().
#
# It only reaches this location when board/ is writable, i.e. in OVERLAY mode
# (nvt_debugger/ap_overlay != 0) or when booting board/ from USB. On a stock
# read-only (production) set, run it instead from a root shell via hw_overlay.sh.
#
# All it does is activate our page overlay. Fail-safe: never blocks normal boot.

run_custom_main() {
    _hw="/mtd_rwarea/helloworld/hw_overlay.sh"
    if [ -x "$_hw" ]; then
        "$_hw" mount
    elif [ -f "$_hw" ]; then
        sh "$_hw" mount
    else
        echo "[run_custom] hw_overlay.sh not found, skipping" > /dev/console 2>/dev/null
    fi
}
