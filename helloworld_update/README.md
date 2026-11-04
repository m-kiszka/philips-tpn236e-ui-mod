# Hello World — aktualizacja UI (prototyp)

Osobna „aktualizacja" dla web UI telewizora **Philips 50PUS7608/12**
(Titan OS / TPN236E). Dodaje do menu pozycję **Hello World**, która otwiera
ekran z komunikatem i danymi urządzenia (model, wersja, region, kraj, język,
środowisko, aplikacja certyfikowana) pobieranymi przez `Rpc…`. Całość jest
**offline** i **testowalna w przeglądarce na PC** — nie wymaga telewizora.

Wersja bazowa UI: `v236.006.169.001` → tu oznaczona jako `…+hw1`.

## Co jest w środku

```
helloworld_update/
├─ preview/
│  └─ index.html              ← DZIAŁAJĄCY prototyp launchera z kafelką „Hello World”
├─ webui_patch/
│  ├─ pages/helloworld/hello.js   ← moduł strony (async, czyta dane przez RPC)
│  ├─ rpc-stubs.js            ← zaślepki Rpc…/i18n, żeby UI ruszyło w przeglądarce
│  └─ integration.md          ← dokładne zmiany w prawdziwym UI
├─ run-preview.cmd            ← uruchamia serwer z katalogu projektu (font marki działa)
├─ PATCHES.md                 ← JAK działają patche + przykłady modyfikacji
└─ README.md                  ← ten plik
```

## Jak obejrzeć prototyp

Najprościej — dwuklik na **`run-preview.cmd`** (serwuje z katalogu projektu, dzięki
czemu działa oryginalny font marki), a potem otwórz w przeglądarce:

```
http://127.0.0.1:8731/helloworld_update/preview/index.html
```

Sterowanie jak pilotem:

- **← →** — przechodzenie między kafelkami
- **Enter** — otwarcie zaznaczonej pozycji
- **Esc / Backspace** — powrót

Kafelek **Hello World** (oznaczony `NEW`) otwiera nakładkę `virtual-window`, która
pokazuje napis oraz **dane urządzenia pobierane asynchronicznie przez `Rpc…`**
(ze stanem ładowania i notką zależną od regionu).

> **Font marki:** `preview/index.html` ma `@font-face` wskazujący Twój wypakowany
> `NeueFrutigerWorld-Book.ttf` z `extracted/…/page/lib/assets/philips/`. Rozwiązuje
> się tylko przy serwowaniu z katalogu projektu (stąd `run-preview.cmd`). Bez niego
> prototyp użyje fontu systemowego — też wygląda dobrze.

## Jak to rozwijać

Pełny opis działania patchy i **gotowe przykłady modyfikacji** (zmiana tekstu,
dodanie języka, nowy wiersz danych/RPC, druga strona, interaktywny przycisk,
podmiana ilustracyjnych RPC na prawdziwe) są w **`PATCHES.md`**.

## Jak to się ma do prawdziwej aktualizacji

Prototyp 1:1 odwzorowuje publiczny kontrakt UI. Lista zmian na prawdziwym drzewie
`page/` jest w **`webui_patch/integration.md`**:

1. nowy wpis w `window.Pages` / `window.PathToWin` (`index.html`),
2. nowy moduł `pages/helloworld/hello.js`,
3. klucz `ID_hello_world` (+ pozostałe `ID_hw_*`) w `lib/i18n/<LANG>.js`,
4. wejście z istniejącego menu.

## Jak wdrożyć na TV (bez łamania podpisu)

Drzewo `page/` jest w **podpisanym (NFSB) squashfs** — nie zmienisz go „w
miejscu". Zmianę nakłada się przez drogę z **Części B** raportu:

1. root przez **UART** (konto root bez hasła),
2. kopia `page/` w **zapisywalnej** partycji `/mtd_rwarea/…`,
3. nałożenie **bind-mountem/overlay** na oryginał,
4. utrwalenie przez **`run_custom.sh`** albo **autostart z USB**.

Pełny opis: `..\Philips_TPN236E_reverse_engineering.pdf`.

---
*Materiał edukacyjny dotyczący własnego urządzenia. Prototyp nie zawiera
oryginalnych zasobów firmware ani grafik marki; font marki jest tylko
referencją do Twojej lokalnej, wypakowanej kopii.*
