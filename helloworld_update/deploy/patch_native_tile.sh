#!/bin/sh
# patch_native_tile.sh - OPTIONAL: add a real "Hello World" TILE to the Quick menu.
#
# Runs AFTER deploy_from_root.sh, patching the WRITABLE overlay copy of the UI
# (not the signed squashfs). It makes three surgical, literal text edits, each
# anchored on a string that occurs exactly once in stock firmware:
#
#   1) lib/i18n/ENG.js   - add the label   "HELLO_WORLD":"Hello World"
#   2) quickmenu.js list - append a tile after the last item of the first group
#   3) quickmenu.js switch- add a case whose action calls window.__helloworld_show()
#                           (exposed by inject-helloworld.js)
#
# The tile reuses the existing "icon_demo_me" glyph. Selecting it opens the same
# Hello World screen as the BLUE button. Fully reversible: it only touches our
# copy, so uninstall_from_root.sh / removing the overlay restores stock.
#
# Experimental: anchors are matched literally; if firmware differs the patch is
# skipped and the always-working BLUE-button binding remains.
#
# Usage:  sh patch_native_tile.sh [PAGE_DIR]    (default: /mtd_rwarea/helloworld/page)

set -u
PAGE=${1:-/mtd_rwarea/helloworld/page}
QM="$PAGE/pages/quickmenu/quickmenu.js"
ENG="$PAGE/lib/i18n/ENG.js"
log() { echo "[tile] $*"; }

for f in "$QM" "$ENG"; do
    [ -f "$f" ] || { log "ERROR: $f not found (run deploy_from_root.sh first)"; exit 1; }
done

if grep -q "HELLO_WORLD" "$QM" 2>/dev/null; then
    log "already patched, nothing to do"; exit 0
fi

# literal (non-regex) single-pass replace: file old new
awk_replace() {
    awk -v o="$2" -v n="$3" '
        { s=$0; r=""; L=length(o);
          while ((p=index(s,o))>0) { r=r substr(s,1,p-1) n; s=substr(s,p+L) }
          print r s }
    ' "$1" > "$1.hw" && mv "$1.hw" "$1"
}

# --- anchors (each occurs exactly once in stock TPN236E) ---
I18N_OLD='window.LANG_ENG={'
I18N_NEW='window.LANG_ENG={"HELLO_WORLD":"Hello World",'

ITEM_OLD='{i18n:"MAIN_APP_NAME_DEMO_ME",name:"demo me",type:-1,index:10,selected:!1,icon:"icon_demo_me"}'
ITEM_NEW='{i18n:"MAIN_APP_NAME_DEMO_ME",name:"demo me",type:-1,index:10,selected:!1,icon:"icon_demo_me"},{i18n:"HELLO_WORLD",name:"hello world",type:-1,index:11,selected:!1,icon:"icon_demo_me"}'

CASE_OLD='case"HELP":e.fn=()=>{uiLog("help"),S.open(F.help)};break;'
CASE_NEW='case"HELLO_WORLD":e.fn=()=>{window.__helloworld_show&&window.__helloworld_show()};break;case"HELP":e.fn=()=>{uiLog("help"),S.open(F.help)};break;'

# verify every anchor is present before touching anything
fail=0
grep -qF "$I18N_OLD" "$ENG" || { log "anchor miss: i18n header";  fail=1; }
grep -qF "$ITEM_OLD" "$QM"  || { log "anchor miss: demo_me item"; fail=1; }
grep -qF "$CASE_OLD" "$QM"  || { log "anchor miss: HELP case";    fail=1; }
if [ "$fail" != 0 ]; then
    log "firmware layout differs -> skipping tile patch (BLUE button still works)"
    exit 2
fi

log "1/3 add i18n label"; awk_replace "$ENG" "$I18N_OLD" "$I18N_NEW"
log "2/3 add menu tile";  awk_replace "$QM"  "$ITEM_OLD" "$ITEM_NEW"
log "3/3 add tile action";awk_replace "$QM"  "$CASE_OLD" "$CASE_NEW"

# confirm
if grep -q '"HELLO_WORLD":"Hello World"' "$ENG" && grep -q 'name:"hello world"' "$QM" \
   && grep -q 'case"HELLO_WORLD"' "$QM"; then
    log "OK - tile added to Quick menu. Reopen the Quick menu (reload UI) to see it."
else
    log "WARN: verification failed; check the files"
    exit 3
fi
