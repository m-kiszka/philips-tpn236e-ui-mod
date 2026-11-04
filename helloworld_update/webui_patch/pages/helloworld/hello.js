/*
 * pages/helloworld/hello.js
 *
 * Prototype of the page module that the "Hello World" update adds to the
 * Philips/TPV web UI (board/mframework/webui/PHI/page/).
 *
 * The real page modules in the firmware are webpack-bundled, minified chunks
 * (each registers itself via webpackJsonp). This file is a readable, un-minified
 * equivalent that follows the SAME public contract the UI exposes:
 *
 *   - routes live in window.Pages / window.PathToWin (defined in index.html)
 *   - a page renders its DOM into the current ".virtual-window" layer
 *   - text comes from i18n(ID_*) using lib/i18n/<LANG>.js
 *   - device data is read through native Rpc*() calls that return Promises
 *   - the window manager (lib/win-manager.js) opens/closes windows by route
 *
 * It is runnable in the browser preview via rpc-stubs.js.
 */
(function (w) {
  'use strict';

  var ROUTE = '/helloworld/hello';

  // 1) Register the route, mirroring the window.Pages / window.PathToWin maps
  //    that index.html builds. "2" is a mid-level window layer (same value used
  //    by e.g. /system/debugmenu in the stock UI).
  w.Pages = w.Pages || {};
  w.PathToWin = w.PathToWin || {};
  w.Pages.hello = ROUTE;
  w.PathToWin[ROUTE] = 2;

  function t(id) { return w.i18n ? w.i18n(id) : id; }

  // 2) Read device info through native RPCs. Returns a Promise of a plain object.
  //    Promise.all mirrors how the stock UI fans out several RPCs at once.
  function loadDeviceInfo() {
    return Promise.all([
      w.RpcSystemModelGet     ? w.RpcSystemModelGet()     : w.__rpcStub(),
      w.RpcSystemSwVersionGet ? w.RpcSystemSwVersionGet() : w.__rpcStub(),
      w.RpcSystemRegionGet    ? w.RpcSystemRegionGet()    : w.__rpcStub(),
      w.RpcSystemCountryGet   ? w.RpcSystemCountryGet()   : w.__rpcStub(),
      w.RpcSystemLanguageGet  ? w.RpcSystemLanguageGet()  : w.__rpcStub(),
      w.RpcSamServerEnvironmentGet ? w.RpcSamServerEnvironmentGet() : w.__rpcStub(),
      w.RpcFactoryGetCertApp  ? w.RpcFactoryGetCertApp()  : w.__rpcStub()
    ]).then(function (r) {
      var envLabel = w.__envLabel ? w.__envLabel((r[5] && r[5].SeverEnvrionment) || 0) : 'PROD';
      return {
        model:    (r[0] && r[0].model)   || '-',
        software: (r[1] && r[1].version) || '-',
        region:   (r[2] && r[2].id)      || '-',
        country:  (r[3] && r[3].id)      || '-',
        language: (r[4] && r[4].id)      || '-',
        env:      envLabel,
        cert:     (r[6] && r[6].App)     || 'None'
      };
    });
  }

  // 3) The page controller.
  function HelloWorldPage() {}

  HelloWorldPage.prototype.render = function (container) {
    var el = document.createElement('div');
    el.className = 'component-helloworld';
    el.innerHTML =
      '<div class="hw-title">' + t('ID_hello_world') + '</div>' +
      '<div class="hw-sub">' + t('ID_hw_subtitle') + '</div>' +
      '<div class="hw-info" aria-busy="true">loading...</div>' +
      '<div class="hw-note"></div>';
    container.appendChild(el);

    // Fill device info asynchronously once the RPCs resolve.
    loadDeviceInfo().then(function (info) {
      var rows = [
        ['ID_hw_model', info.model],
        ['ID_hw_software', info.software],
        ['ID_hw_region', info.region],
        ['ID_hw_country', info.country],
        ['ID_hw_language', info.language],
        ['ID_hw_env', info.env],
        ['ID_hw_cert', info.cert]
      ];
      var html = rows.map(function (row) {
        return '<div class="hw-row"><span class="hw-k">' + t(row[0]) +
               '</span><span class="hw-v">' + row[1] + '</span></div>';
      }).join('');
      var info_el = el.querySelector('.hw-info');
      info_el.innerHTML = html;
      info_el.setAttribute('aria-busy', 'false');

      // Region-conditional text, same pattern as window.__IS_EU in the stock UI.
      var note = (info.region === 'EU') ? t('ID_hw_eu_note') : t('ID_hw_noneu_note');
      el.querySelector('.hw-note').textContent = note;
    });

    return el;
  };

  HelloWorldPage.prototype.onKey = function (keyName, winManager) {
    if (keyName === 'back' || keyName === 'Escape') {
      if (winManager && winManager.close) winManager.close(ROUTE);
      return true;
    }
    return false;
  };

  // 4) Publish the module so the window manager can instantiate it by route.
  w.__pageModules = w.__pageModules || {};
  w.__pageModules[ROUTE] = HelloWorldPage;

})(window);
