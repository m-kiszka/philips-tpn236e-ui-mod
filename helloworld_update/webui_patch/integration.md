# Integracja „Hello World" z prawdziwym UI

Dokładne zmiany, które odwzorowuje ten prototyp. Dotyczą drzewa web UI:
`/mtd_apexe/board/mframework/webui/PHI/page/`.

Wszystkie identyfikatory/komentarze w kodzie są po angielsku (konwencja projektu).

---

## 1. Rejestracja trasy — `index.html`

W `index.html` UI buduje dwa obiekty: `window.Pages` i `window.PathToWin`.
Dodaj do nich nowy wpis (liczba `2` = warstwa okna, jak np. `/system/debugmenu`):

```js
// window.Pages — dołóż:
"hello": "/helloworld/hello",

// window.PathToWin — dołóż:
"/helloworld/hello": 2,
```

## 2. Moduł strony — `pages/helloworld/hello.js`

Nowy plik. Wzorzec w: `webui_patch/pages/helloworld/hello.js`.
W firmware strony to zminifikowane chunki webpacka — docelowo moduł trzeba
zbudować tym samym pipeline'em albo dołożyć jako osobny skrypt ładowany z
`index.html`:

```html
<script type="text/javascript" src="pages/helloworld/hello.js"></script>
```

## 3. Tekst — `lib/i18n/ENG.js` (i inne języki)

Format pliku: `window.LANG_ENG = { "ID_...": "...", ... }`. Dołóż klucz:

```js
"ID_hello_world": "Hello World",
```

Dla kompletu ten sam klucz można dopisać do pozostałych `lib/i18n/<CODE>.js`
(np. `POL.js`: `"ID_hello_world": "Witaj świecie"`).

## 4. Wejście z menu

Podepnij otwarcie trasy `/helloworld/hello` z istniejącego menu
(np. pozycja w szybkim menu `pages/quickmenu/`), wywołując menedżer okien
(`lib/win-manager.js`) z nowym routem.

---

## Jak to uruchomić na TV (bez łamania podpisu)

Drzewo `page/` leży w **podpisanym (NFSB) squashfs** `apexe` — nie da się go
zmienić „w miejscu" bez ponownego podpisania. Dlatego zmiany wdraża się przez
drogę z Części B raportu:

1. Mając **root przez UART** (konto root bez hasła), skopiuj `page/` do
   **zapisywalnej** partycji (`/mtd_rwarea/...`).
2. Nałóż katalog zmodyfikowany na oryginalny **bind-mountem / overlay** zamiast
   podpisanego squashfs.
3. Utrwal to przez hook **`run_custom.sh`** lub **autostart z USB**
   (`/media/sda1/board/run.sh`) — skrypty wykonywane w locie, poza podpisem.

Szczegóły tych mechanizmów: patrz `Philips_TPN236E_reverse_engineering.pdf`,
rozdziały „Część B" i „Co możesz zrobić później".
