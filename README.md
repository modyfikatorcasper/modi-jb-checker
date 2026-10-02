# MODI JB CHECKER

**PS5 Serial & Factory Firmware Database**

[Open MODI JB CHECKER](https://modyfikatorcasper.github.io/modi-jb-checker/) · [Public repository](https://github.com/modyfikatorcasper/modi-jb-checker) · [Submit a verified unit](https://github.com/modyfikatorcasper/modi-jb-checker/issues/new?template=submit-verified-firmware.yml)

A fast, mobile-friendly retail-box checker from **Modi Diagnostic Lab / Modyfikator89**. Enter an S01 serial or an eight-character prefix to estimate the console family, model, production period and original firmware. Checks run in your browser, with no backend or framework.

## What you can trust

| Label | Meaning |
| --- | --- |
| CONFIRMED | The recorded individual unit was physically verified or has direct original evidence. |
| ESTIMATED | A serial/batch rule suggests a result. It does not confirm the entered console. |
| UNKNOWN | No supported match, conflicting box details or insufficient firmware evidence. |

**A confirmed reference unit never makes a prefix-matched console CONFIRMED.** One Wolverine unit at 13.20 does not establish the firmware of every Wolverine, CFI-2116 or May 2026 unit.

The three initial records are supplied by the project owner. Their verification labels preserve those physical-unit reports. Sanitized evidence photographs and original publication URLs were not supplied and have not been independently reviewed by this project. The UI and `evidence_review` fields disclose this. No fake proof images are included.

## Initial Modi records

| Unit | Prefix | Production | Firmware | Record status |
| --- | --- | --- | --- | --- |
| PS5 Slim · CFI-2116 B01Y | S01-F556… | 06.2025 | 11.20 | CONFIRMED, owner-reported |
| PS5 Pro · CFI-7121 B01Y | S01-F258… | 2025, estimated; no printed date | 11.40 | CONFIRMED, owner-reported |
| Marvel's Wolverine PS5 Slim · CFI-2116 BZJY | S01-V565… | 05.2026 | 13.20, factory / first observed | CONFIRMED, owner-reported |

The Wolverine record also includes Vietnam manufacturing, EDM-051 and the supplied system string `26.03-13.20.00.06-00.00.00.0.1`. A System Information screen proves observed firmware, not an untouched update history; preserve this distinction when contributing.

## How results are calculated

1. Normalize the serial locally (case, spaces and the optional trailing ellipsis). The initial decoder supports `S01-` followed by a letter and digits; unrecognized formats are rejected with a clear format message. It does not claim to decode every regional PS5 serial format.
2. Match the longest applicable public prefix in `verified-consoles.json` and `serial-rules.json`. Never return the complete input serial from the decoder.
3. Narrow matches using optional model and production-month details. A contradictory model/date suppresses firmware estimation. Dates come from observed labels or explicit sourced rules, not a claimed universal serial-date formula.
4. Estimate firmware from matching confirmed samples or sourced estimated rules. Different known values become a range. If any applicable sample lacks firmware evidence, firmware stays unknown. Pending records do not borrow a firmware value from their model family.
5. Compare integer firmware components against editable public exploit metadata. No floating-point version comparisons and no exploit compatibility hardcoded into JavaScript.

The current curated exploit snapshot is reviewed **2026-10-02**. [Relapse developer documentation](https://github.com/ntfargo/Relapse-Exploit) lists firmware 7.00–13.60. The UI says “Possibly compatible” for estimated firmware. The reference-unit detail view can say “Compatible with documented public exploit range” for a confirmed exact firmware. Neither promises unit-specific success, stability or a complete jailbreak. Outside the curated ranges means **not currently known in this database**, not proof that no public exploit exists. This project contains no exploit code.

## Run locally

No installation or build is needed for the website. Node 20.11 or newer is needed for the optional development tools.

```sh
npm start
```

Open `http://127.0.0.1:4173`. Alternatively run `python -m http.server 4173 --bind 127.0.0.1` in this directory. Do not open `index.html` via `file://`; JSON loading and ES modules require HTTP. The server logs only its startup URL, never request paths or submitted serials.

```sh
npm test
npm run validate
```

No npm dependencies are used. Automated checks cover known records, missing dates, invalid input, unknown prefixes, contradictory box details, privacy, version boundaries, exact/range exploit rules and data-only promotion of the Pro record. Browser QA checks mobile widths and live interactions; see `QA.md`.

## Publish to public GitHub Pages

1. Create a **public** repository named `modi-jb-checker` in your account. Upload **the contents of this directory**, including `.github/` and `.nojekyll`, to its `main` branch. The public title is **MODI JB CHECKER**.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Run the included **Deploy GitHub Pages** workflow (or push a commit). It validates data and runs tests, then uploads only the static website, the public JSON files, sanitized assets and contribution guide.
4. The deployment job provides `https://YOUR-ACCOUNT.github.io/modi-jb-checker/`. All paths are relative and support this repository subpath.

You can also use Pages' **Deploy from a branch**, selecting `main` and `/ (root)`, without the workflow. The Actions option keeps development files outside the deployed artifact and blocks invalid data updates.

GitHub Actions deployment uses GitHub's official [Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). GitHub publishing requires account access; a local project or ZIP is not an already-published repository.

## Edit the databases

| File | Purpose |
| --- | --- |
| `data/verified-consoles.json` | Individual Modi records, public prefixes, observation basis, verification state and optional proof files. |
| `data/serial-rules.json` | Model-identification patterns and attributed prefix/batch estimates; initially no invented community serial rules. |
| `data/firmware-ranges.json` | Exact firmware or firmware ranges, public support status, source and review date. |
| `data/sources.json` | Source credits and evidence limitations. |

Each file has `schema_version: 1` and `last_updated`. Every record/rule needs `source_id`, `source_name`, `source_url` (HTTPS or `null`), `source_date` and `data_type`. Sources must exist in `sources.json`. Record IDs must be unique. `node scripts/validate-data.js` validates these contracts and checks referenced proof files exist. The browser also validates the data and fails closed on unsafe identifiers or invalid records.

The Pro record was confirmed at original firmware 11.40 by the project owner on 2026-10-02. To confirm a pending record, verify the original firmware and edit its `firmware`, `firmware_basis`, `status`, `verification_pending`, `verified_by`, `confidence`, `evidence`, `evidence_review`, `source_url`, `source_date` and optional `proof`. Set `status` to `CONFIRMED` and `verification_pending` to `false`. Update review dates. No application code changes are needed. An unrelated visitor's prefix result still remains ESTIMATED.

New external serial rules belong in `rules` as objects with `id`, `serial_prefix` (at most eight characters), `status: "ESTIMATED"`, optional `model`, `console_family`, `production_period`, `production_from`, `production_to`, and `firmware` or `firmware_min`/`firmware_max`, plus all source metadata. Do not label a community rule as Modi-confirmed.

Exploit entries accept either `firmware: "13.20"` or `firmware_min` and `firmware_max`. Only `public: true` and `status: "compatible"` can generate positive support results. Unknown/private metadata cannot. Keep the review date and notes current; there is no live background fetching.

## Proof photos

Save **sanitized, flattened raster images** in `assets/proof/` and add entries to the unit's `proof` array:

```json
[
  { "type": "box_label", "file": "assets/proof/wolverine-box-redacted.jpg", "caption": "Box label with private identifiers removed" },
  { "type": "system_information", "file": "assets/proof/wolverine-system-redacted.jpg", "caption": "System software screen with serial and MAC addresses removed" }
]
```

These are **schema examples**, not supplied files. Leave `proof: []` until the real sanitized files exist. The UI automatically adds **VIEW PROOF** when files are attached and opens the record dialog; images are not loaded or shown on the main checker screen. Supported formats: PNG, JPEG and WebP. Strip metadata, cover identifiers with opaque blocks, export a flattened copy and inspect it before upload. Never commit an original private photo, even temporarily—Git history is public.

## Privacy

“Serial numbers are processed locally in your browser and are not stored.”

The application does not use analytics, telemetry, cookies, local/session storage, IndexedDB or a serial API. Only static JSON files are fetched. Form submission never navigates or sends a request, and serials are never put into URLs, console logs, generated results or public datasets. The text is present only in the input while the page is open. GitHub Pages still serves normal static asset requests and may retain its own hosting access logs; the serial is never included in them. External source links are opened only when you click them.

## Contribute

Use **Issues → New issue → Submit verified PS5 firmware**. Include the model, edition, region, production date (or state not printed), the **short serial prefix**, original firmware, update history, sanitized box label and sanitized System Information photos. Do not publicly disclose your complete serial, MAC addresses or personal information. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Structure

```text
index.html
css/style.css
js/app.js
js/serial-decoder.js
js/firmware-checker.js
js/data-validation.js
data/*.json
assets/images/favicon.svg
assets/proof/
scripts/serve.js
scripts/validate-data.js
test/checker.test.js
.github/ISSUE_TEMPLATE/submit-verified-firmware.yml
.github/workflows/pages.yml
```

Created by **Modi Diagnostic Lab** · **Modyfikator89**. Independent community project; not affiliated with Sony. MIT-licensed original project code and supplied records; external documentation retains its authors' rights. Source links provide attribution.
