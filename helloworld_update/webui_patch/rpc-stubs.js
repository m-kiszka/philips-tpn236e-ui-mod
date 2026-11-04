/*
 * rpc-stubs.js
 *
 * Minimal stubs so the Hello World page (and the launcher preview) can run in a
 * plain desktop browser, WITHOUT the TV's native JSON-RPC backend.
 *
 * On the real TV these globals are provided by the native app: the UI calls
 * functions like RpcSystemRegionGet() and gets Promises back. Here we return
 * resolved Promises with harmless defaults so nothing hangs or throws.
 *
 * Two kinds of RPCs below:
 *   [CONFIRMED]    - names actually seen in the firmware's index.html boot code.
 *   [ILLUSTRATIVE] - plausible names invented only for this demo to show how a
 *                    page would read device info. Do NOT assume they exist on
 *                    the TV; swap them for the real call when you know it.
 *
 * Load this BEFORE the app/page scripts.
 */
(function (w) {
  'use strict';

  // ---- i18n -------------------------------------------------------------
  // The real UI loads window.LANG_<CODE> (e.g. LANG_ENG) from lib/i18n/<CODE>.js
  // and looks keys up by id. We seed the keys this update adds, plus a
  // passthrough fallback that returns the key itself when missing.
  w.LANG_ENG = w.LANG_ENG || {};
  var ENG = {
    ID_hello_world: 'Hello World',
    ID_hw_subtitle: 'Custom page added by the Hello World update.',
    ID_hw_device:   'Device',
    ID_hw_model:    'Model',
    ID_hw_software: 'Software',
    ID_hw_region:   'Region',
    ID_hw_country:  'Country',
    ID_hw_language: 'Language',
    ID_hw_env:      'Environment',
    ID_hw_cert:     'Certified app',
    ID_hw_eu_note:  'Running in an EU region build.',
    ID_hw_noneu_note: 'Running in a non-EU region build.'
  };
  for (var k in ENG) { if (!(k in w.LANG_ENG)) w.LANG_ENG[k] = ENG[k]; }

  // Optional Polish strings (demonstrates multi-language — see PATCHES.md).
  w.LANG_POL = w.LANG_POL || {};
  var POL = {
    ID_hello_world: 'Witaj swiecie',
    ID_hw_subtitle: 'Strona dodana przez aktualizacje Hello World.'
  };
  for (var k2 in POL) { if (!(k2 in w.LANG_POL)) w.LANG_POL[k2] = POL[k2]; }

  w.i18n = w.i18n || function (id) {
    var dict = w['LANG_' + (w.CURRENT_LANGUAGE || 'ENG')] || w.LANG_ENG || {};
    return Object.prototype.hasOwnProperty.call(dict, id) ? dict[id] : id;
  };

  // ---- generic RPC helpers ---------------------------------------------
  function resolved(value) {
    // Small delay so the UI's loading state is visible, like a real IPC round-trip.
    return new Promise(function (res) { setTimeout(function () { res(value); }, 120); });
  }

  // [CONFIRMED] called on boot in the stock index.html (window.onload).
  w.RpcSystemRegionGet         = w.RpcSystemRegionGet         || function () { return resolved({ id: 'EU' }); };
  w.RpcSystemCountryGet        = w.RpcSystemCountryGet        || function () { return resolved({ id: 'PL' }); };
  w.RpcSystemLanguageGet       = w.RpcSystemLanguageGet       || function () { return resolved({ id: 'ENG' }); };
  w.RpcSamServerEnvironmentGet = w.RpcSamServerEnvironmentGet || function () { return resolved({ SeverEnvrionment: 0 }); };
  w.RpcFactoryGetCertApp       = w.RpcFactoryGetCertApp       || function () { return resolved({ App: 'None' }); };

  // [ILLUSTRATIVE] stand-ins for "read model / software version". Replace the
  // names with the real RPCs once identified in the firmware.
  w.RpcSystemModelGet     = w.RpcSystemModelGet     || function () { return resolved({ model: '50PUS7608/12' }); };
  w.RpcSystemSwVersionGet = w.RpcSystemSwVersionGet || function () { return resolved({ version: 'TPN236E_V236.006.169.001' }); };

  // Catch-all: any other Rpc* a cloned page references resolves to {} so it does
  // not throw while prototyping in the browser.
  w.__rpcStub = function () { return resolved({}); };

  // Maps a server environment code to a label, same table as the stock UI.
  w.__envLabel = function (code) {
    return (['PROD', 'ACC', '', '', '', '', 'DEV'][code] || 'PROD');
  };
})(window);
