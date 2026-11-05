# Philips TPN236E — reverse engineering & "Hello World" UI mod

Educational reverse engineering of a Philips **50PUS7608/12** TV
(Titan OS, chassis **TPN236E**), plus a practical modification of its interface —
adding a **"Hello World"** screen / menu entry — deployed **without breaking the
firmware signature**.

Project heavily utilized Claude Code as an AI code assistant.

> [!WARNING]
> **Disclaimer.** This concerns analysis of a device I own, for educational
> purposes only. Hardware access (UART) and any modifications are done at your
> own risk — they void the warranty and can permanently damage the TV.
> This repository contains **only original work**; the vendor firmware and its
> extracted contents are **not** included here (they are excluded in
> `.gitignore`).

## Highlights

- **Offline firmware analysis:** package format (`TIMG`/`PIMG` → gzip → `NFSB`
  → squashfs LZO), platform (Novatek NT72xxx, ARM, Buildroot/BusyBox), and the
  update verification chain (RSA-2048 + SHA-256, key rooted in OTP).
  Conclusion: **a modified image cannot be flashed through the update loader**.
- **Working UI prototype** of the launcher with a "Hello World" entry (viewable
  in a desktop browser).
- **Signature-free deployment path:** the firmware's built-in apexe overlay (a
  writable, unsigned partition) plus a bind-mount from a root shell obtained over
  the UART serial console.
- **Three real UI integrations**, each verified in a browser with stubs:
  - **Hello World** — a screen bound to the remote's **BLUE** button via the UI's
    own `window.S.onkeydown`, and an optional **native Quick-menu tile**
    (anchored text patch, validated with `node --check`).
  - **Device info** — a screen that reads live values through existing read-only
    `Rpc*Get()` functions.
  - **State change (demo)** — a fully reversible **mute toggle**
    (`RpcSoundSysMute`).

## Repository layout

```
.
├─ README.md
├─ Philips_TPN236E_reverse_engineering.pdf   full 11-page report (incl. UART guide)
├─ helloworld_update/                         "Hello World" mod
│  ├─ preview/                                runnable launcher prototype
│  ├─ webui_patch/                            page-module pattern, RPC stubs, integration notes
│  └─ deploy/                                 on-device deploy scripts (overlay, inject, native tile)
├─ helloworld_devinfo/                        live device-info read (Rpc*Get)
└─ helloworld_setdemo/                        reversible state-change example (mute toggle)
```

> Vendor firmware (`*.upg`, `*.pkg`, `*.zip`) and its decompressed contents
> (`extracted/`) are intentionally **not** versioned — keep them locally.
>
> The analyzed **update and loader packages** (`upgrade.pkg` and the upgrade
> loader) were obtained from the community firmware archive at
> [toengel.net/philipsblog](https://toengel.net/philipsblog/); they are not
> redistributed here.

## Quick start (browser preview)

No TV required. Serve the project root and open a preview:

```sh
# from the repo root
python -m http.server 8731 --bind 127.0.0.1
```

| Preview | URL |
| --- | --- |
| Launcher + Hello World | `http://127.0.0.1:8731/helloworld_update/preview/index.html` |
| Device info (live read) | `http://127.0.0.1:8731/helloworld_devinfo/preview/index.html` |
| State change (mute) | `http://127.0.0.1:8731/helloworld_setdemo/preview/index.html` |

Navigate like a remote: `←` `→`, `Enter`, `Esc`. In the previews, RPC calls are
stubbed with placeholder values; on the TV they hit the real native backend.

## Deploying to the TV (summary)

Nothing touches the signed image — we only mount *over* it:

1. **Root over UART** — serial console; the root account has no password
   (see the report's UART appendix for a step-by-step guide).
2. Copy the files to a USB stick, then run
   `helloworld_update/deploy/deploy_from_root.sh` (copies `page/` to the writable
   `/mtd_rwarea`, injects our script, mounts the overlay).
3. Optionally run `patch_native_tile.sh` to add a native Quick-menu tile.
4. Restart the app → the **BLUE** button opens the screen (and/or the menu tile).

Details and caveats (SELinux, persistence): see
[`helloworld_update/deploy/README_deploy.md`](helloworld_update/deploy/README_deploy.md).

## Status

| Stage | Status |
| --- | --- |
| Firmware unpacking (offline) | Done |
| Hello World UI prototype (browser) | Verified |
| Update loader / secure-boot analysis | Flashing a modified image not possible (RSA-2048 + OTP) |
| Signature-free deployment (overlay / bind-mount) | Scripts ready |
| Trigger: BLUE button (`window.S.onkeydown`) | Verified |
| Native Quick-menu tile | Patch validated with `node --check` |
| Live device read (`Rpc*Get`) | Verified (browser stubs) |
| Reversible state change (mute) | Verified (browser stubs) |
| On-device test (real TV) | Pending — requires UART + deploy |

> Everything is verified offline in a browser. Running it on the actual TV is the
> remaining step and requires hardware access (UART root + deploy).

## Report

The full write-up (package format, partition table, verification chain, flasher
internals, overlay mechanism, deployment, and a step-by-step UART appendix) is in
**[`Philips_TPN236E_reverse_engineering.pdf`](Philips_TPN236E_reverse_engineering.pdf)**.

## References

- Community Philips / Titan OS firmware archive —
  [toengel.net/philipsblog](https://toengel.net/philipsblog/) — source of the
  `upgrade.pkg` and upgrade-loader packages analyzed in this project.
- Titan OS firmware installation guide —
  [docs.titanos.tv](https://docs.titanos.tv/firmware-installation-guide) —
  official notes on build types (production `…1` vs debug `…0`), USB
  `upgrade.pkg` update, and the `pkg.burn.7z` "empty burning" procedure.
