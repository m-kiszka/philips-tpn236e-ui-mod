/*
 * inject-devinfo.js
 *
 * A "Device info" screen for the on-device web UI that reads REAL values from the
 * TV's native layer through existing Rpc*Get() functions, instead of showing
 * static text. Self-contained; does not modify or depend on the helloworld_update
 * files. Deploy exactly like inject-helloworld.js (see this folder's README).
 *
 * Trigger: BLUE colour button via the UI's own key API (window.S.onkeydown).
 * Desktop fallback for browser testing: press "d".
 *
 * Design notes:
 *   - Each Rpc*Get is a thin wrapper that returns a Promise (and/or calls a
 *     completeCallback). We support BOTH shapes and add a timeout, so one slow
 *     or missing call never hangs the screen.
 *   - Return-object field names are only fully known for a few calls, so unknown
 *     results are shown as compact JSON (we render whatever the device returns).
 *   - Read-only: no Set or action calls here.
 *
 * Everything is wrapped in try/catch; it can never break the TV UI.
 */
(function () {
  'use strict';

  var PANEL_ID = 'devinfo-panel';
  var open = false;

  // Rpc method map (name -> label -> optional field extractor).
  // 'pick' turns the resolved object into a display string; default = compact JSON.
  var ENV = ['PROD', 'ACC', '', '', '', '', 'DEV'];
  var ROWS = [
    { rpc: 'RpcModelInfoGet',            label: 'Model' },
    { rpc: 'RpcCurrentSoftWareInfoGet',  label: 'Software' },
    { rpc: 'RpcSystemRegionGet',         label: 'Region',   pick: function (r) { return r && r.id; } },
    { rpc: 'RpcSystemCountryGet',        label: 'Country',  pick: function (r) { return r && r.id; } },
    { rpc: 'RpcSystemLanguageGet',       label: 'Language', pick: function (r) { return r && r.id; } },
    { rpc: 'RpcSamServerEnvironmentGet', label: 'Environment',
      pick: function (r) { return ENV[(r && r.SeverEnvrionment) || 0] || 'PROD'; } },
    { rpc: 'RpcFactoryGetCertApp',       label: 'Certified app', pick: function (r) { return r && r.App; } },
    { rpc: 'RpcGetCurrentUTCtime',       label: 'UTC time' },
    { rpc: 'RpcChannelGetCount',         label: 'Channels' }
  ];

  function compact(v) {
    if (v == null) return String(v);
    if (typeof v === 'object') {
      try { var s = JSON.stringify(v); return s.length > 80 ? s.slice(0, 77) + '...' : s; }
      catch (e) { return '[object]'; }
    }
    return String(v);
  }

  // Call an Rpc* supporting both Promise-return and completeCallback styles,
  // with a timeout. Resolves with the device's value or rejects.
  function callRpc(name) {
    return new Promise(function (resolve, reject) {
      var fn = window[name];
      if (typeof fn !== 'function') { reject(new Error('n/a')); return; }
      var settled = false;
      var done = function (v) { if (!settled) { settled = true; resolve(v); } };
      var ret;
      try { ret = fn({ params: {}, completeCallback: done }); }
      catch (e) { if (!settled) { settled = true; reject(e); } return; }
      if (ret && typeof ret.then === 'function') ret.then(done, function (e) {
        if (!settled) { settled = true; reject(e); }
      });
      setTimeout(function () { if (!settled) { settled = true; reject(new Error('timeout')); } }, 4000);
    });
  }

  function buildPanel() {
    var wrap = document.createElement('div');
    wrap.id = PANEL_ID;
    wrap.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:99999', 'display:flex',
      'align-items:center', 'justify-content:center',
      'background:rgba(8,10,12,.80)', 'font-family:sans-serif'
    ].join(';'));
    var panel = document.createElement('div');
    panel.setAttribute('style', [
      'width:min(560px,88vw)', 'padding:34px 38px 26px',
      'border-radius:18px', 'border:1px solid #333', 'color:#fff',
      'background:linear-gradient(160deg,#1b1d1f,#141618)',
      'box-shadow:0 30px 80px -20px #000'
    ].join(';'));
    var rows = ROWS.map(function (r, i) {
      return '<div style="display:flex;justify-content:space-between;gap:16px;' +
        'padding:9px 0;border-bottom:1px solid #232527">' +
        '<span style="color:#b0b0b0;font-size:14px">' + r.label + '</span>' +
        '<span id="di-' + i + '" style="color:#fff;font-size:13px;font-weight:600;' +
        'font-family:monospace;text-align:right;max-width:62%;word-break:break-word">...</span></div>';
    }).join('');
    panel.innerHTML =
      '<div style="font-size:26px;font-weight:700;margin-bottom:4px">Device info</div>' +
      '<div style="color:#b0b0b0;font-size:13px;margin-bottom:16px">Live values read via Rpc*Get()</div>' +
      rows +
      '<div style="margin-top:20px;color:#b0b0b0;font-size:13px">BLUE / Back to close</div>';
    wrap.appendChild(panel);
    return wrap;
  }

  function fill() {
    ROWS.forEach(function (r, i) {
      callRpc(r.rpc).then(function (res) {
        var val = r.pick ? r.pick(res) : compact(res);
        if (val == null || val === '') val = compact(res);
        set(i, val);
      }, function (err) {
        set(i, (err && err.message === 'n/a') ? 'n/a' : ('- (' + (err && err.message || 'error') + ')'));
      });
    });
  }

  function set(i, text) {
    var el = document.getElementById('di-' + i);
    if (el) el.textContent = text;
  }

  function showPanel() {
    if (document.getElementById(PANEL_ID)) return;
    (document.body || document.documentElement).appendChild(buildPanel());
    open = true;
    fill();
  }
  function hidePanel() {
    var el = document.getElementById(PANEL_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    open = false;
  }
  function toggle() { open ? hidePanel() : showPanel(); }

  function keyName(e) {
    if (e == null) return '';
    if (typeof e === 'string') return e;
    if (typeof e === 'number') return String(e);
    return String(e.keyName || e.name || e.key || e.code || e.keyCode || '');
  }
  function isTrigger(k) {
    if (k === 'VK_BLUE') return 'toggle';
    try { if (window.VK_BLUE != null && k === String(window.VK_BLUE)) return 'toggle'; } catch (e) {}
    if (open && (k === 'VK_BACK' || k === 'VK_EXIT' || k === 'Escape' || k === 'Backspace')) return 'close';
    return null;
  }

  try {
    // expose for a native menu tile action (see patch in this folder's README)
    window.__devinfo_show = showPanel;
    window.__devinfo_hide = hidePanel;
    window.__devinfo_toggle = toggle;

    if (window.S && typeof window.S.onkeydown === 'function') {
      window.S.onkeydown(function (e) {
        var act = isTrigger(keyName(e));
        if (act === 'toggle') { toggle(); return true; }
        if (act === 'close') { hidePanel(); return true; }
        return false;
      });
      if (window.console) console.log('[devinfo] bound to BLUE via window.S.onkeydown');
    }

    // desktop fallback for browser testing
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'd' || ev.key === 'D') { toggle(); ev.preventDefault(); }
      else if (open && (ev.key === 'Escape' || ev.key === 'Backspace')) { hidePanel(); ev.preventDefault(); }
    }, true);
  } catch (err) {
    try { console.error('[devinfo] inject failed', err); } catch (e2) {}
  }
})();
