# Set-demo — przykład zmiany stanu TV (osobny)

Osobny, samodzielny przykład, który **zmienia stan telewizora** (w odróżnieniu od
odczytu z `helloworld_devinfo/`). Dla bezpieczeństwa robi tylko **w pełni
odwracalną** rzecz: **przełącza systemowe wyciszenie** przez natywną funkcję UI.

Nic w `helloworld_update/` ani `helloworld_devinfo/` nie jest nadpisywane.

## Co robi

Przełącznik na **niebieskim przycisku** (BLUE) woła:

```js
RpcSoundSysMute({ params: { mute: 1 } })   // wycisz
RpcSoundSysMute({ params: { mute: 0 } })   // wyłącz wyciszenie
```

Te dokładne wywołania (`setup.sound.sysmute.set`, pole `mute: 0|1`) są używane w
całym stockowym firmware — stąd wybór: to zmiana **nieszkodliwa i natychmiast
odwracalna**. Po akcji pokazuje się banner „TV muted / unmuted (set-demo)".

Właściwości bezpieczeństwa:
- tylko odwracalny toggle (bez trwałych/ryzykownych ustawień),
- uruchamiane **wyłącznie** po naciśnięciu klawisza (nic nie startuje samo),
- odporne: obsługa `Promise`/`completeCallback`, timeout 4 s, `try/catch`,
- brak funkcji → banner z błędem, zero skutków ubocznych.

## Pliki

```
helloworld_setdemo/
├─ inject-setdemo.js             ← BLUE przełącza wyciszenie
├─ preview/
│  ├─ index.html                ← podgląd w przeglądarce (klawisz "m"), wskaźnik Speaker
│  └─ rpc-stubs-setdemo.js       ← zaślepka RpcSoundSysMute (tylko podgląd)
└─ README.md
```

## Podgląd w przeglądarce

Serwuj z katalogu projektu i otwórz:
```
http://127.0.0.1:8731/helloworld_setdemo/preview/index.html
```
Naciśnij **`m`** (lub zasymuluj BLUE). Wskaźnik „Speaker: ON/MUTED" pokazuje efekt
na zaślepce; na telewizorze zmieni się realne wyciszenie.

## Wdrożenie na telewizor

Reużywa mechanizmu z `../helloworld_update/deploy/` (bez duplikacji). Po
`deploy_from_root.sh`:
```sh
PAGE=/mtd_rwarea/helloworld/page
cp /media/sda1/helloworld_setdemo/inject-setdemo.js "$PAGE/inject-setdemo.js"
sed -i 's#inject-helloworld.js#inject-setdemo.js#' "$PAGE/index.html"
```
Restart aplikacji → **BLUE** przełącza wyciszenie telewizora.

## Zastrzeżenia — WAŻNE

- To **realna zmiana stanu** telewizora. Trzymaj się rzeczy **odwracalnych**.
- Funkcje `Set*` z nieznanymi parametrami mogą mieć **skutki uboczne** — nie wołaj
  ich „na ślepo". Używaj tylko wywołań o potwierdzonym kształcie (jak `mute`).
- Inny udokumentowany, odwracalny przykład (NIE włączony tutaj automatycznie):
  styl obrazu — `RpcPictureStyleSet({ params: { mode: <id> } })`
  (`setup.picture.mode.set`). Zmienia widoczne ustawienie; wybierz istniejące
  `mode` i miej jak wrócić do poprzedniego.
- Zmiany rób na własną odpowiedzialność, na własnym urządzeniu.
