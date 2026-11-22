/*
 * inject-helloworld.js
 *
 * Runtime injection for the on-device web UI. deploy_from_root.sh appends
 *     <script type="text/javascript" src="inject-helloworld.js"></script>
 * just before </body> in our writable copy of page/index.html.
 *
 * What it does (all fail-safe, wrapped in try/catch so it can never break the TV):
 *   1) Registers a /helloworld/hello route into window.Pages / window.PathToWin.
 *   2) Hooks the UI's OWN input path: window.S.onkeydown(fn) is how stock pages
 *      register a remote-key handler (window.S is the global window manager).
 *      We bind the BLUE colour button to open a "Hello World" screen styled like
 *      the UI's virtual-window overlay. BLUE is unused by the quick menu, so it
 *      does not clash.
 *   3) A desktop-keyboard fallback (press "h") so the same code is testable in a
 *      plain browser where window.S does not exist.
 *
 * Why a key binding and not a menu tile: the launcher/quick-menu item arrays live
 * inside minified webpack closures, not reachable from outside. Binding a remote
 * key via the UI's real onkeydown API is the robust, non-fragile integration.
 * Wiring a native tile is the next step and needs the quickmenu chunk rebuilt.
 */
(function () {
  'use strict';

  var PANEL_ID = 'hw-panel';
  var open = false;

  function t(id, fallback) {
    try { if (window.i18n) { var s = window.i18n(id); if (s && s !== id) return s; } } catch (e) {}
    return fallback;
  }

  function buildPanel() {
    var wrap = document.createElement('div');
    wrap.id = PANEL_ID;
    wrap.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:99999', 'display:flex',
      'align-items:center', 'justify-content:center',
      'background:rgba(8,10,12,.78)', 'font-family:sans-serif'
    ].join(';'));
    var panel = document.createElement('div');
    panel.setAttribute('style', [
      'min-width:420px', 'max-width:86vw', 'padding:40px 44px', 'text-align:center',
      'border-radius:18px', 'border:1px solid #333', 'color:#fff',
      'background:linear-gradient(160deg,#1b1d1f,#141618)',
      'box-shadow:0 30px 80px -20px #000'
    ].join(';'));
    panel.innerHTML =
      '<div style="display:inline-block;font-size:12px;letter-spacing:1.5px;' +
      'text-transform:uppercase;color:#7fd7d6;border:1px solid #7fd7d6;' +
      'border-radius:999px;padding:4px 12px;margin-bottom:16px">custom page</div>' +
      '<div style="font-size:44px;font-weight:700;margin-bottom:8px">' +
      t('ID_hello_world', 'Hello World') + '</div>' +
      '<div style="color:#b0b0b0;font-size:15px">' +
      t('ID_hw_subtitle', 'Injected into the live UI via window.S.onkeydown.') + '</div>' +
      '<div style="font-family:monospace;color:#7fd7d6;font-size:13px;margin-top:16px">' +
      'route: /helloworld/hello</div>' +
      '<div style="margin-top:22px;color:#b0b0b0;font-size:13px">BLUE / Back to close</div>';
    wrap.appendChild(panel);
    return wrap;
  }

  function showPanel() {
    if (document.getElementById(PANEL_ID)) return;
    (document.body || document.documentElement).appendChild(buildPanel());
    open = true;
  }
  function hidePanel() {
    var el = document.getElementById(PANEL_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    open = false;
  }
  function toggle() { open ? hidePanel() : showPanel(); }

  // Normalise whatever the key handler receives into a comparable token.
  function keyName(e) {
    if (e == null) return '';
    if (typeof e === 'string') return e;
    if (typeof e === 'number') return String(e);
    return String(e.keyName || e.name || e.key || e.code || e.keyCode || '');
  }

  function isTrigger(k) {
    // BLUE colour button (string name, or the global VK code), else Back to close.
    if (k === 'VK_BLUE') return 'toggle';
    try { if (window.VK_BLUE != null && k === String(window.VK_BLUE)) return 'toggle'; } catch (e) {}
    if (open && (k === 'VK_BACK' || k === 'VK_EXIT' || k === 'Escape' || k === 'Backspace')) return 'close';
    return null;
  }

  try {
    // 1) route registration (best-effort)
    window.Pages = window.Pages || {};
    window.PathToWin = window.PathToWin || {};
    window.Pages.hello = '/helloworld/hello';
    window.PathToWin['/helloworld/hello'] = 2;

    // Expose the overlay so a native menu tile (added by patch_native_tile.sh)
    // can trigger exactly the same screen from its switch-case action.
    window.__helloworld_show = showPanel;
    window.__helloworld_hide = hidePanel;
    window.__helloworld_toggle = toggle;

    // 2) native hook — TPN236E-specific (verified live 2026-11-22):
    //    Remote keys arrive at the launcher as PRIMITIVE NUMBERS through
    //    S.keydown (e.g. VK_BLUE=406, VK_BACK=461), NOT as DOM events and
    //    NOT as objects with keyName/keyCode. The stock S.onkeydown(fn)
    //    handler array is also wiped by the base shim's
    //    checkFactoryStopKeydown() (S.keydownHandlers=[]), so any handler
    //    registered that way at load time is silently lost. The robust hook
    //    is therefore wrapping S.keydown itself with a numeric compare.
    var wrapped = false;
    try {
      if (window.S && typeof window.S.keydown === 'function' && !window.S.__hw_wrapped) {
        var origKeydown = window.S.keydown;
        var wrappedKeydown = function (e) {
          var k = String(e);
          if (window.VK_BLUE != null && k === String(window.VK_BLUE)) { toggle(); return; }
          if (open && (k === String(window.VK_BACK) || k === 'VK_BACK' || k === 'VK_EXIT')) { hidePanel(); return; }
          return origKeydown.apply(window.S, arguments);
        };
        wrappedKeydown.__hw_orig = origKeydown;
        window.S.keydown = wrappedKeydown;
        window.S.__hw_wrapped = true;
        wrapped = true;
        if (window.console) console.log('[helloworld] BLUE bound via S.keydown wrapper (numeric VK codes)');
      }
    } catch (e2) {}
    if (!wrapped && window.console) console.log('[helloworld] S.keydown not present; keyboard fallback only (press "h")');

    // 3) desktop fallback for browser testing (and as a safety net)
    document.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (k === 'h' || k === 'H') { toggle(); ev.preventDefault(); }
      else if (open && (k === 'Escape' || k === 'Backspace')) { hidePanel(); ev.preventDefault(); }
    }, true);

    if (!bound && window.console) console.log('[helloworld] window.S not present; keyboard fallback only (press "h")');
  } catch (err) {
    try { console.error('[helloworld] inject failed', err); } catch (e2) {}
  }
})();
