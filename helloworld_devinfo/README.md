# Device info — realny odczyt z systemu (osobny wariant)

Osobny, samodzielny wariant modyfikacji UI: ekran **„Device info"**, który czyta
**prawdziwe** dane telewizora przez istniejące funkcje `Rpc*Get()` (zamiast
statycznego „Hello World"). Nic w `helloworld_update/` nie jest nadpisywane.

## Co pokazuje

Po otwarciu wywołuje zestaw **tylko-odczytowych** funkcji i wyświetla, co realnie
wróci z natywnej warstwy. Każda `Rpc…` to cienki wrapper wołający transport
`l("<metoda>", params, cb)` i zwracający `Promise`. Zmapowane metody (prosto z
bundla firmware):

| Etykieta | Funkcja | Metoda transportu | Znane pole |
|---|---|---|---|
| Model | `RpcModelInfoGet` | `setup.system.modelinfo.get` | (surowy JSON) |
| Software | `RpcCurrentSoftWareInfoGet` | `setup.update.current.software.info` | (surowy JSON) |
| Region | `RpcSystemRegionGet` | `setup.system.region.get` | `.id` |
| Country | `RpcSystemCountryGet` | `setup.system.country.get` | `.id` |
| Language | `RpcSystemLanguageGet` | `setup.system.language.get` | `.id` |
| Environment | `RpcSamServerEnvironmentGet` | — | `.SeverEnvrionment` → PROD/ACC/DEV |
| Certified app | `RpcFactoryGetCertApp` | `setup.factory.certApp.get` | `.App` |
| UTC time | `RpcGetCurrentUTCtime` | `setup.time.getCurrentUTCtime` | (surowy JSON) |
| Channels | `RpcChannelGetCount` | `tuner.channel.getCount` | (surowy JSON) |

Odczyt jest **odporny**: obsługuje zwrot przez `Promise` i przez `completeCallback`,
ma **timeout 4 s** na wywołanie, a wynik pokazuje jako znane pole lub — gdy kształtu
nie znamy na pewno — jako **surowy, skrócony JSON**. Brak funkcji → `n/a`,
odrzucenie/timeout → `- (powód)`. Dzięki temu nie zgaduje pól, tylko renderuje to,
co urządzenie faktycznie zwróci.

## Pliki

```
helloworld_devinfo/
├─ inject-devinfo.js              ← wstrzykiwany skrypt; BLUE otwiera ekran Device info
├─ preview/
│  ├─ index.html                 ← podgląd w przeglądarce (klawisz "d")
│  └─ rpc-stubs-devinfo.js        ← zaślepki Rpc*Get (tylko do podglądu)
└─ README.md
```

## Podgląd w przeglądarce

Uruchom lokalny serwer z katalogu projektu (jak dla głównego prototypu) i otwórz:
```
http://127.0.0.1:8731/helloworld_devinfo/preview/index.html
```
Naciśnij **`d`** (lub zasymuluj BLUE). Zobaczysz ekran z danymi z **zaślepek**;
na telewizorze będą to realne wartości.

## Wdrożenie na telewizor

Reużywa istniejącego mechanizmu z `../helloworld_update/deploy/` — **bez
duplikowania skryptów**. Po `deploy_from_root.sh` (który tworzy zapisywalną kopię
`page/` i montuje nakładkę) wystarczy użyć **tego** injectu zamiast
`inject-helloworld.js`:

```sh
# 1) wdróż bazę (kopia page/ + overlay) jak dotąd
sh /media/sda1/helloworld_update/deploy/deploy_from_root.sh

# 2) podmień wstrzykiwany skrypt na wariant devinfo (w kopii, nie w squashfs)
PAGE=/mtd_rwarea/helloworld/page
cp /media/sda1/helloworld_devinfo/inject-devinfo.js "$PAGE/inject-devinfo.js"
# przełącz hook w index.html z inject-helloworld.js na inject-devinfo.js
sed -i 's#inject-helloworld.js#inject-devinfo.js#' "$PAGE/index.html"
```
Restart aplikacji → **BLUE** otwiera „Device info" z realnymi danymi.
(Natywny kafelek: jak w `../helloworld_update/deploy/patch_native_tile.sh`, tylko
akcja woła `window.__devinfo_show()`.)

## Zastrzeżenia

- **Tylko odczyt.** Żadnych `Set*`/akcji zmieniających stan telewizora.
- Nazwy funkcji i metody transportu są pewne (z bundla), ale **dokładny kształt
  odpowiedzi** części z nich potwierdzisz dopiero na urządzeniu — dlatego nieznane
  wyniki pokazujemy jako surowy JSON.
- Realne wartości widać **tylko na telewizorze**; w przeglądarce działają zaślepki.
