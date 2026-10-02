# Submit a verified PS5 firmware record

Open a GitHub issue using **Submit verified PS5 firmware**. Evidence applies to one console; it does not establish a whole model or production batch.

Provide:

- Console model (for example CFI-2116 BZJY), edition and region.
- Printed production date. If absent, write “not printed”; label any inferred period as estimated.
- A short prefix such as **S01-V565…**. At most the first eight characters; do not include the unique ending digits.
- Original firmware and full **system software version** if available. Do not confuse the software version with a serial or MAC address.
- Whether the console was new/sealed, when it was first observed and whether it was ever updated. If original firmware is uncertain, call it first observed.
- Sanitized box-label and System Information photos, source/publication URL and additional notes.

Before attaching photos, remove full serial numbers, MAC addresses, barcodes/QR codes encoding identifiers, personal information, receipt details and image metadata. Use opaque masks, export a flattened raster copy and inspect it. Do not attach originals or reversible overlays. Public GitHub issues and Git history cannot be treated as private storage.

## Maintainer review

Check evidence and attribution before marking a unit CONFIRMED. Record the exact verification basis in `evidence_review` and the firmware basis in `firmware_basis`: `factory`, `first_observed`, `factory_or_first_observed` or `unverified`. Set a missing firmware to `null`; never infer it from an unrelated model family.

Keep entries pending or UNKNOWN when evidence does not establish the original firmware. Community guides may inform ESTIMATED serial rules; they never become Modi-confirmed without a separate physical-unit verification. Never replace multiple different verified firmware values with a single convenient value.

Store only the prefix. Add sanitized images to `assets/proof/`, source metadata to every record and source credits to `data/sources.json`. Add actual production date only when evidenced; inferred intervals use `production_period` or `production_from`/`production_to`.

Run `npm test` and `npm run validate`, and check that the phone layout and proof dialog are usable before merging. A database-only update must not require an application-code change.
