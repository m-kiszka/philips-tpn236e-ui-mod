# Wdrożenie „Hello World" na telewizor — bez łamania podpisu

Skrypty wdrażające naszą modyfikację UI przez **wbudowany mechanizm overlay**
telewizora. **Podpisany squashfs nie jest ruszany** — montujemy się tylko *nad*
nim, więc nie trzeba niczego podpisywać.

> Materiał edukacyjny dla własnego urządzenia. Dostęp sprzętowy (UART) oznacza
> utratę gwarancji i ryzyko uszkodzenia. Działasz na własną odpowiedzialność.

## Dlaczego to działa (mechanizm z firmware)

Skrypt startowy `profile_emmc` montuje partycję aplikacji (apexe) na dwa sposoby,
w zależności od flagi device tree `nvt_debugger/ap_overlay`:

- `ap_overlay = 0` (produkcja) → `mount -t nfsb` — **read-only, podpis weryfikowany przy montowaniu**.
- `ap_overlay ≠ 0` → `overlayfs`: lower = podpisany squashfs (RO), **upper = partycja `apdat` (zapisywalna, niepodpisana)**, scalony widok w `/mtd_apexe`.

Czyli upper (`/mtd_rwarea/ap_upper/...`) nadpisuje pliki squashfs **bez podpisu**.
To wbudowany, zamierzony punkt rozszerzeń. Nasze skrypty korzystają z niego, a na
secie produkcyjnym robią to samo ręcznie (bind-mount z roota).

## Pliki

| Plik | Rola |
|---|---|
| `deploy_from_root.sh` | **uruchom raz z roota** — buduje kopię `page/` w `/mtd_rwarea`, wstrzykuje `inject-helloworld.js`, instaluje overlay i aktywuje go |
| `hw_overlay.sh` | rdzeń: `mount` / `umount` / `status` nakładki `page/` |
| `run_custom.sh` | hook `run_custom_main` wołany przez `board/run.sh` (tryb overlay / USB) |
| `inject-helloworld.js` | wstrzykiwany do UI — rejestruje trasę `/helloworld/hello` i pokazuje napis „Hello World" |
| `uninstall_from_root.sh` | cofnięcie wszystkiego (squashfs i tak nietknięty) |

## Procedura

1. **Zdobądź roota** — podłącz UART (patrz PDF, Część B: `ttyS0`, konto root bez hasła).
2. **Wgraj te pliki** na telewizor — pendrive (montowany jako `/media/sda1`) albo `scp`.
3. **Uruchom** z roota:
   ```sh
   sh /media/sda1/helloworld_update/deploy/deploy_from_root.sh
   ```
   Skrypt:
   - skopiuje `page/` z `/mtd_apexe` do `/mtd_rwarea/helloworld/page`,
   - doda `<script src="inject-helloworld.js">` przed `</body>` w `index.html`,
   - zainstaluje `hw_overlay.sh` + `run_custom.sh`,
   - zrobi **bind-mount** kopii nad żywą ścieżką UI (natychmiastowy test).
4. **Zrestartuj aplikację** (lub `reboot`). Powinien pojawić się napis **„Hello World"**.

## Trwałość po restarcie

- **Tryb overlay (`ap_overlay ≠ 0`):** `deploy_from_root.sh` wrzuca `run_custom.sh`
  do `/mtd_rwarea/ap_upper/board/`, skąd `board/run.sh` sam go `source`'uje przy
  starcie — trwałe, czysto przez wbudowany mechanizm.
- **Produkcja (`ap_overlay = 0`):** `board/` jest read-only, więc hook nie wejdzie
  sam. Opcje trwałości:
  - włączyć `nvt_debugger/ap_overlay` (wymaga dostępu do device tree / inżynieryjnego uboota — zwykle zablokowane),
  - albo wołać `hw_overlay.sh mount` przy każdym bootcie z roota (np. skrypt z UART).
  Do eksperymentów wystarczy jednorazowy bind-mount z `deploy_from_root.sh`.

## Opcjonalnie: natywny kafelek w Szybkim menu

Oprócz przycisku BLUE możesz dodać **prawdziwy kafelek „Hello World" w Szybkim
menu**. Po `deploy_from_root.sh` uruchom:
```sh
sh /media/sda1/helloworld_update/deploy/patch_native_tile.sh
```
Skrypt robi trzy chirurgiczne, literalne podmiany na **kopii** (nie w podpisanym
squashfs), każda kotwiczona na stringu występującym w firmware dokładnie raz:
1. `lib/i18n/ENG.js` — etykieta `"HELLO_WORLD":"Hello World"`,
2. `pages/quickmenu/quickmenu.js` — nowa pozycja na końcu pierwszej grupy (ikona `icon_demo_me`),
3. ten sam plik — `case` w switchu, którego akcja woła `window.__helloworld_show()` (z `inject-helloworld.js`).

Wzorzec pochodzi wprost z firmware — pozycje menu mają akcje typu
`S.open(F.help)` (`window.S.open(window.Pages.help)`). Patch jest **idempotentny,
odwracalny** (dotyczy tylko kopii) i **pomija się**, jeśli kotwice nie pasują
(wtedy zostaje działający przycisk BLUE). Poprawność patcha zweryfikowano
`node --check`. Po patchu otwórz ponownie Szybkie menu (przeładuj UI).

## Uwagi / pułapki

- **SELinux:** pliki w `/mtd_rwarea` mają inny kontekst niż apexe — jeśli webview
  nie czyta nakładki, do testu z roota: `setenforce 0`, potem ponów `hw_overlay.sh mount`.
  Docelowo dopasuj kontekst (`chcon --reference`), co `hw_overlay.sh` próbuje zrobić.
- **Timing:** overlay musi być aktywny, zanim UI załaduje `index.html`. Hook
  `run_custom.sh` jest wołany wcześnie w `board/run.sh`, więc to zwykle wystarcza.
- **Wyzwalacz:** `inject-helloworld.js` wpina się w natywną obsługę klawiszy UI
  przez `window.S.onkeydown` (globalny zarządca okien). Po wgraniu naciśnij na
  pilocie **niebieski przycisk (BLUE)** — pojawi się ekran „Hello World"; BLUE/Back
  go zamyka. BLUE nie jest używany przez szybkie menu, więc nie koliduje.
  W przeglądarce (test) ten sam kod reaguje na klawisz **`h`**.
- Dlaczego klawisz, a nie kafelek: tablice pozycji launchera/quickmenu są w
  zamkniętych domknięciach webpacka (nieosiągalne z zewnątrz), więc wpięcie w
  realne `onkeydown` jest pewniejsze. Natywny kafelek wymaga przebudowy chunku
  quickmenu — to następny krok (patrz `..\PATCHES.md`).

## Cofnięcie
```sh
sh /media/sda1/helloworld_update/deploy/uninstall_from_root.sh
```
Przywraca stockowy UI bez śladu — podpisany obraz nie był modyfikowany.
