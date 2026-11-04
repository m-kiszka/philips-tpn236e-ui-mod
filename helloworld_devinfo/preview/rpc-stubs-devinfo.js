/*
 * rpc-stubs-devinfo.js  (PREVIEW ONLY)
 *
 * Fake Rpc*Get() functions so the Device info screen can be viewed in a desktop
 * browser without the TV's native backend. On the real TV these are provided by
 * the native app and return REAL values; here we return plausible placeholders.
 *
 * Shapes match what the UI is known to read (region/country/language -> .id,
 * env -> .SeverEnvrionment, certApp -> .App); the rest are illustrative and are
 * rendered as compact JSON by inject-devinfo.js.
 *
 * Load BEFORE inject-devinfo.js.
 */
(function (w) {
  'use strict';
  function later(v) { return new Promise(function (res) { setTimeout(function () { res(v); }, 150); }); }

  w.RpcModelInfoGet            = w.RpcModelInfoGet            || function () { return later({ model: '50PUS7608/12', chassis: 'TPN236E' }); };
  w.RpcCurrentSoftWareInfoGet  = w.RpcCurrentSoftWareInfoGet  || function () { return later({ version: 'TPN236E_V236.006.169.001' }); };
  w.RpcSystemRegionGet         = w.RpcSystemRegionGet         || function () { return later({ id: 'EU' }); };
  w.RpcSystemCountryGet        = w.RpcSystemCountryGet        || function () { return later({ id: 'PL' }); };
  w.RpcSystemLanguageGet       = w.RpcSystemLanguageGet       || function () { return later({ id: 'ENG' }); };
  w.RpcSamServerEnvironmentGet = w.RpcSamServerEnvironmentGet || function () { return later({ SeverEnvrionment: 0 }); };
  w.RpcFactoryGetCertApp       = w.RpcFactoryGetCertApp       || function () { return later({ App: 'None' }); };
  w.RpcGetCurrentUTCtime       = w.RpcGetCurrentUTCtime       || function () { return later({ utc: 1762286400 }); };
  w.RpcChannelGetCount         = w.RpcChannelGetCount         || function () { return later({ count: 142 }); };
})(window);
