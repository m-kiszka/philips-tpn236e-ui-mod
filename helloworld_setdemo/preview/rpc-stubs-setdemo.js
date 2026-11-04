/*
 * rpc-stubs-setdemo.js  (PREVIEW ONLY)
 *
 * Fakes RpcSoundSysMute so the mute toggle can be seen in a desktop browser.
 * It updates a visible indicator on the page instead of touching real audio.
 * On the TV the real RpcSoundSysMute changes the actual system mute.
 *
 * Load BEFORE inject-setdemo.js.
 */
(function (w) {
  'use strict';
  function paint(muted) {
    var el = document.getElementById('mute-indicator');
    if (el) {
      el.textContent = muted ? 'Speaker: MUTED' : 'Speaker: ON';
      el.style.color = muted ? '#e08' : '#7fd7d6';
    }
  }
  w.__previewMuted = false;
  w.RpcSoundSysMute = w.RpcSoundSysMute || function (e) {
    e = e || {};
    var v = (e.params && e.params.mute) ? 1 : 0;
    w.__previewMuted = !!v;
    paint(w.__previewMuted);
    return new Promise(function (res) { setTimeout(function () { res({ result: true }); }, 120); });
  };
  document.addEventListener('DOMContentLoaded', function () { paint(w.__previewMuted); });
})(window);
