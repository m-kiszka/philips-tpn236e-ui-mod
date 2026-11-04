# PATCHES.md — jak działają patche „Hello World"

Opis techniczny aktualizacji: co robi każdy plik, jak elementy łączą się ze sobą
oraz gotowe przykłady modyfikacji. Kod i identyfikatory są po angielsku (konwencja
projektu), objaśnienia po polsku.

Dotyczy web UI telewizora **Philips 50PUS7608/12** (Titan OS / TPN236E), drzewo:
`/mtd_apexe/board/mframework/webui/PHI/page/`.

---

## 1. Model mentalny — jak zbudowany jest UI

UI to aplikacja webowa. Cztery „gniazda", w które wpinają się patche:

| Gniazdo | Gdzie w firmware | Rola |
|---|---|---|
| `window.Pages` + `window.PathToWin` | `index.html` | rejestr tras (ekranów) i warstw okien |
| moduł strony | `pages/<grupa>/<nazwa>.js` | renderuje DOM danego ekranu |
| `window.LANG_<CODE>` + `i18n(id)` | `lib/i18n/<CODE>.js` | teksty w wielu językach |
| `Rpc*()` | dostarcza natywna apka | odczyt/zapis danych urządzenia (Promise) |

Menedżer okien (`lib/win-manager.js`) otwiera trasę: instancjonuje moduł strony
i każe mu wyrenderować się do aktywnej warstwy `.virtual-window`.

Przepływ przy otwarciu ekranu „Hello World":

```
[menu] --Enter--> win-manager.open('/helloworld/hello')
      --> new HelloWorldPage().render(container)
      --> Promise.all([ Rpc... ])        (odczyt danych urzadzenia)
      --> wstawienie wierszy + tekst zalezny od regionu
```

---

## 2. Co jest w `webui_patch/`

### `pages/helloworld/hello.js` — moduł strony
Czytelny odpowiednik chunku webpacka. Kolejno:

1. **Rejestruje trasę** w `window.Pages` / `window.PathToWin`:
   ```js
   w.Pages.hello = '/helloworld/hello';
   w.PathToWin['/helloworld/hello'] = 2;   // warstwa okna (jak /system/debugmenu)
   ```
2. **Pobiera dane urządzenia** przez `Promise.all([...Rpc...])` → zwraca obiekt
   `{model, software, region, country, language, env, cert}`.
3. **Renderuje** tytuł (`i18n('ID_hello_world')`), podtytuł, tabelę danych i
   notkę zależną od regionu (wzorzec `window.__IS_EU` ze stocka).
4. **Obsługuje klawisze** (`onKey`): `back`/`Escape` zamyka okno.
5. **Publikuje moduł**: `window.__pageModules['/helloworld/hello'] = HelloWorldPage`.

### `rpc-stubs.js` — zaślepki backendu
Pozwala uruchomić stronę w przeglądarce bez telewizora. Zawiera:
- słowniki `LANG_ENG` / `LANG_POL` z kluczami tej aktualizacji + funkcję `i18n`,
- RPC **[CONFIRMED]** (nazwy realnie widziane w `index.html`): `RpcSystemRegionGet`,
  `RpcSystemCountryGet`, `RpcSystemLanguageGet`, `RpcSamServerEnvironmentGet`,
  `RpcFactoryGetCertApp`,
- RPC **[ILLUSTRATIVE]** (nazwy wymyślone na potrzeby dema): `RpcSystemModelGet`,
  `RpcSystemSwVersionGet` — do podmiany, gdy poznasz prawdziwe,
- helper `__envLabel(code)` (ta sama tabela `['PROD','ACC',...,'DEV']` co w UI).

> Każdy stub zwraca `Promise` z ~120 ms opóźnieniem, żeby był widoczny stan
> ładowania — jak prawdziwy round-trip IPC.

### `integration.md` — mapa zmian na prawdziwym UI
Dokładne wstawki do `index.html`, `pages/`, `lib/i18n/*` oraz jak to wdrożyć na
TV bez łamania podpisu (droga z Części B raportu).

## 3. Co jest w `preview/`

### `index.html` — działający launcher
Oryginalna rekonstrukcja wyglądu (ciemny motyw, akcent niebieski). Zawiera:
- `@font-face` wskazujący **Twój wypakowany** font marki
  (`extracted/.../NeueFrutigerWorld-Book.ttf`) + fallback systemowy,
- model menu (`Pages` + `order`) z nową kafelką `helloworld` (plakietka `NEW`),
- nawigację pilotem (`←`/`→`/`Enter`/`Esc`),
- wbudowaną kopię logiki strony „Hello World" (`renderHelloWorld` + `loadDeviceInfo`),
  identyczną w zachowaniu z `pages/helloworld/hello.js`.

Font rozwiązuje się tylko, gdy serwujesz z **katalogu projektu** — użyj
`run-preview.cmd` (patrz `README.md`).

---

## 4. Przykłady modyfikacji

### Przykład A — zmiana napisu / dodanie języka
W `rpc-stubs.js` (prototyp) lub docelowo w `lib/i18n/<CODE>.js`:
```js
// angielski
w.LANG_ENG.ID_hello_world = 'Hello from my TV';
// polski — wybierany, gdy CURRENT_LANGUAGE === 'POL'
w.LANG_POL.ID_hello_world = 'Witaj swiecie';
```
Nic więcej nie trzeba — `i18n('ID_hello_world')` samo wybierze język.

### Przykład B — dodanie nowego wiersza danych (nowy RPC)
1. Dodaj stub w `rpc-stubs.js`:
   ```js
   w.RpcNetworkMacGet = w.RpcNetworkMacGet || function () {
     return resolved({ mac: 'AA:BB:CC:00:11:22' });
   };
   ```
2. Dołóż go do `Promise.all(...)` w `loadDeviceInfo()` i do mapy wyniku:
   ```js
   // ...w.RpcNetworkMacGet()  -> r[7]
   mac: (r[7] && r[7].mac) || '-'
   ```
3. Dodaj klucz i18n + wiersz w tabeli:
   ```js
   w.LANG_ENG.ID_hw_mac = 'MAC address';
   // w rows:
   ['ID_hw_mac', info.mac]
   ```

### Przykład C — druga własna strona + kafelek w menu
1. Skopiuj `pages/helloworld/hello.js` → `pages/helloworld/about.js`, zmień
   `ROUTE = '/helloworld/about'` i treść.
2. W `preview/index.html` dodaj wpis do `Pages` i do `order`:
   ```js
   about: { icon: 'ℹ', name: 'About', route: '/helloworld/about', isNew: true }
   // order.push('about')
   ```
3. Docelowo: analogiczne wpisy w `window.Pages`/`window.PathToWin` (`index.html`).

### Przykład D — interaktywny przycisk wywołujący RPC
W `render()` modułu dodaj przycisk i akcję (np. zapis flagi):
```js
var btn = document.createElement('button');
btn.textContent = t('ID_hw_action');
btn.addEventListener('click', function () {
  // prototyp: dowolny Rpc*; na TV realny zapis, np. do /mtd_rwarea przez natyw
  (w.RpcSystemSetFlag ? w.RpcSystemSetFlag({ name: 'hello', value: 1 }) : w.__rpcStub())
    .then(function () { btn.textContent = 'OK'; });
});
el.appendChild(btn);
```

### Przykład E — podmiana „ilustracyjnych" RPC na prawdziwe
Gdy zidentyfikujesz realną nazwę (np. w `main.js`/`lib/*.js` przez
`grep -i Rpc.*Model`), podmień nazwę funkcji w `rpc-stubs.js` **i** w
`loadDeviceInfo()`. Kontrakt (zwracany kształt obiektu) zostaw ten sam, żeby
reszta kodu działała bez zmian.

---

## 5. Jak znaleźć prawdziwe nazwy RPC i strony
Na wypakowanym drzewie (`extracted/.../page/`):
```bash
# wszystkie wywolania RPC
grep -rhoE "Rpc[A-Za-z0-9_]+" lib main.js pages | sort -u
# mapa tras
#   -> window.Pages / window.PathToWin w index.html (juz masz)
```
Dzięki temu rozszerzysz patch o realne wywołania zamiast zaślepek.

---

## 6. Wdrożenie na telewizor (skrót)
`page/` jest w **podpisanym (NFSB) squashfs** — modyfikacja „w miejscu" wymaga
ponownego podpisu. Dlatego:
1. root przez **UART** (konto root bez hasła),
2. kopia `page/` w zapisywalnym `/mtd_rwarea/…`,
3. **bind-mount/overlay** na oryginał,
4. utrwalenie przez `run_custom.sh` / autostart z USB.

Pełny opis mechanizmów: `..\Philips_TPN236E_reverse_engineering.pdf` (Część B).
