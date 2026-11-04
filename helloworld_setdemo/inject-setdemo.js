/*
 * inject-setdemo.js
 *
 * SEPARATE example that CHANGES TV state (not read-only). It toggles the system
 * mute via the UI's own RPC, which is fully reversible and non-destructive:
 *     RpcSoundSysMute({ params: { mute: 1 } })   // mute
 *     RpcSoundSysMute({ params: { mute: 0 } })   // unmute
 * (These exact calls are used throughout the stock firmware.)
 *
 * Self-contained; does not touch helloworld_update/ or helloworld_devinfo/.
 * Trigger: BLUE colour button (window.S.onkeydown). Desktop fallback: "m".
 *
 * Safety by design:
 *   - Only a reversible toggle (mute on/off); no risky or persistent settings.
 *   - Explicit trigger only; nothing runs on load.
 *   - Shows on screen what it did.
 *   - Wrapped in try/catch; can never break the UI.
 */
(function (w) {
  'use strict';

  var muted = false;     // our view of the state we set
  var BANNER_ID = 'setdemo-banner';

  function callRpc(name, params) {
    return new Promise(function (resolve, reject) {
      var fn = w[name];
      if (typeof fn !== 'function') { reject(new Error('n/a')); return; }
      var settled = false;
      var done = function (v) { if (!settled) { settled = true; resolve(v); } };
      var ret;
      try { ret = fn({ params: params || {}, completeCallback: done }); }
      catch (e) { if (!settled) { settled = true; reject(e); } return; }
      if (ret && typeof ret.then === 'function') ret.then(done, function (e) {
        if (!settled) { settled = true; reject(e); }
      });
      setTimeout(function () { if (!settled) { settled = true; reject(new Error('timeout')); } }, 4000);
    });
  }

  function banner(text, ok) {
    var el = document.getElementById(BANNER_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = BANNER_ID;
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = text;
    el.setAttribute('style', [
      'position:fixed', 'left:50%', 'top:40px', 'transform:translateX(-50%)',
      'z-index:99999', 'padding:14px 24px', 'border-radius:12px',
      'font-family:sans-serif', 'font-size:22px', 'font-weight:700', 'color:#fff',
      'background:' + (ok === false ? '#7a2d2d' : 'linear-gradient(145deg,#337fbf,#164776)'),
      'box-shadow:0 10px 30px rgba(0,0,0,.5)', 'pointer-events:none'
    ].join(';'));
    clearTimeout(banner._t);
    banner._t = setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 2500);
  }

  function toggleMute() {
    var next = muted ? 0 : 1;
    muted = !!next;                     // optimistic flip so fast repeats alternate
    callRpc('RpcSoundSysMute', { mute: next }).then(function () {
      banner(muted ? 'TV muted (set-demo)' : 'TV unmuted (set-demo)', true);
      if (w.console) console.log('[setdemo] RpcSoundSysMute mute=' + next);
    }, function (err) {
      muted = !next;                    // revert on failure
      banner('mute failed: ' + (err && err.message || 'error'), false);
    });
  }

  function keyName(e) {
    if (e == null) return '';
    if (typeof e === 'string') return e;
    if (typeof e === 'number') return String(e);
    return String(e.keyName || e.name || e.key || e.code || e.keyCode || '');
  }

  try {
    w.__setdemo_toggle_mute = toggleMute;   // for a native tile action, if wanted

    if (w.S && typeof w.S.onkeydown === 'function') {
      w.S.onkeydown(function (e) {
        var k = keyName(e);
        if (k === 'VK_BLUE' || (w.VK_BLUE != null && k === String(w.VK_BLUE))) { toggleMute(); return true; }
        return false;
      });
      if (w.console) console.log('[setdemo] bound to BLUE via window.S.onkeydown');
    }

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'm' || ev.key === 'M') { toggleMute(); ev.preventDefault(); }
    }, true);
  } catch (err) {
    try { console.error('[setdemo] inject failed', err); } catch (e2) {}
  }
})(window);
