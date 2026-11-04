# Philips TPN236E — reverse engineering & „Hello World" UI mod

Edukacyjny reverse engineering oprogramowania **własnego** telewizora
**Philips 50PUS7608/12** (Titan OS, chassis **TPN236E**) oraz praktyczna
modyfikacja jego interfejsu — dodanie ekranu/pozycji **„Hello World"** —
wdrażana **bez łamania podpisu** obrazu.

> **Zastrzeżenie.** Materiał dotyczy analizy własnego urządzenia w celach
> edukacyjnych. Ingerencja sprzętowa (UART) i modyfikacje wykonujesz na własną
> odpowiedzialność — oznaczają utratę gwarancji i ryzyko uszkodzenia.
> Repozytorium zawiera **wyłącznie nasz oryginalny kod i raport**; firmware
> producenta oraz jego wypakowane pliki **nie są** tu dołączone (są wykluczone
> w `.gitignore`).

## Co to robi

- **Analiza firmware (offline):** format pakietu (`TIMG`/`PIMG` → gzip → `NFSB`
  → squashfs LZO), platforma (Novatek NT72xxx, ARM, Buildroot/BusyBox), oraz
  łańcuch weryfikacji update'u (RSA-2048 + SHA-256, klucz zakotwiczony w OTP).
  Wniosek: **zmodyfikowanego obrazu nie wgrasz update loaderem**.
- **Działający prototyp UI** launchera z pozycją „Hello World" (do obejrzenia w
  przeglądarce na PC).
- **Ścieżka wdrożenia bez podpisu:** wbudowany overlay apexe (zapisywalna,
  niepodpisana partycja) + bind-mount z roota, uzyskanego przez konsolę UART.
- **Dwie realne integracje z UI:** wyzwalacz na **niebieskim przycisku** pilota
  (przez natywne `window.S.onkeydown`) oraz **natywny kafelek w Szybkim menu**
  (patch kotwiczony na unikalnych stringach, zwalidowany `node --check`).

## Struktura repo

```
.
├─ README.md                                   ← ten plik
├─ Philips_TPN236E_reverse_engineering.pdf     ← pełny raport (8 stron)
└─ helloworld_update/
   ├─ README.md            ← opis modyfikacji + jak obejrzeć prototyp
   ├─ PATCHES.md           ← jak działają patche + przykłady modyfikacji
   ├─ run-preview.cmd      ← uruchamia lokalny serwer podglądu
   ├─ preview/             ← DZIAŁAJĄCY prototyp launchera (HTML/CSS/JS)
   ├─ webui_patch/         ← wzorzec modułu strony, zaślepki RPC, nota integracyjna
   └─ deploy/              ← skrypty wdrożeniowe na telewizor
      ├─ README_deploy.md
      ├─ deploy_from_root.sh      ← uruchom raz z roota (overlay + inject)
      ├─ hw_overlay.sh            ← mount/umount/status nakładki
      ├─ run_custom.sh            ← hook sourcowany przez board/run.sh
      ├─ inject-helloworld.js     ← rejestracja trasy + przycisk BLUE
      ├─ patch_native_tile.sh     ← opcjonalny natywny kafelek w menu
      └─ uninstall_from_root.sh   ← pełne cofnięcie
```

> Firmware producenta (`*.upg`, `*.pkg`, `*.zip`) i jego wypakowana zawartość
> (`extracted/`) nie są wersjonowane — trzymaj je lokalnie, poza repo.

## Szybki start — podgląd w przeglądarce

1. Uruchom `helloworld_update/run-preview.cmd` (serwuje z katalogu projektu).
2. Otwórz `http://127.0.0.1:8731/helloworld_update/preview/index.html`.
3. Sterowanie jak pilotem: `←` `→`, `Enter`, `Esc`. Kafelek **Hello World**
   (plakietka `NEW`) otwiera ekran z danymi urządzenia (w przeglądarce — zaślepki).

Szczegóły: [`helloworld_update/README.md`](helloworld_update/README.md).

## Wdrożenie na telewizor (skrót)

Pełna, bezpieczna ścieżka **bez ruszania podpisanego obrazu**:

1. **root przez UART** (konsola szeregowa; konto root bez hasła).
2. Pliki na pendrive → `sh .../deploy/deploy_from_root.sh` (kopiuje `page/` do
   zapisywalnego `/mtd_rwarea`, wstrzykuje nasz skrypt, montuje nakładkę).
3. Opcjonalnie `patch_native_tile.sh` — dokłada natywny kafelek w Szybkim menu.
4. Restart aplikacji → **BLUE** otwiera „Hello World" (i/lub kafelek w menu).

Krok po kroku + pułapki (SELinux, trwałość, trzymanie overlay):
[`helloworld_update/deploy/README_deploy.md`](helloworld_update/deploy/README_deploy.md).

## Status

| Etap | Stan |
|---|---|
| Rozpakowanie firmware (offline) | ✅ |
| Prototyp UI „Hello World" (przeglądarka) | ✅ zweryfikowany |
| Analiza update loadera / secure boot | ✅ loaderem się nie da (RSA-2048 + OTP) |
| Wdrożenie bez podpisu (overlay/bind-mount) | ✅ skrypty gotowe |
| Trigger: niebieski przycisk (`window.S.onkeydown`) | ✅ zweryfikowany |
| Natywny kafelek w Szybkim menu | ✅ patch zwalidowany `node --check` |

## Pełny raport

Komplet ustaleń (format firmware, tablica partycji, łańcuch weryfikacji,
wnętrze flashera, mechanizm overlay, wdrożenie) jest w
**`Philips_TPN236E_reverse_engineering.pdf`**.
