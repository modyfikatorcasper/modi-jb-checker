# Verification report

Original browser checks: 2026-10-02. PL / EN update checked 2026-10-04. Local verification is described below. Physical-console evidence has not been independently reviewed.

## Automated checks

`node --test`: **20 passed, 0 failed**. `node scripts/validate-data.js`: **passed**. Browser application modules: JavaScript syntax checks passed.

The PL / EN update adds regression checks for stable firmware/model identifiers, unchanged confirmation semantics, translated counts/dates/sources and Polish errors/evidence caveats. Browser checks verify Polish default, English switching, preservation of input and the existing Pro 11.40 result, bilingual record details and errors, localized search/filter behavior, language URL reload and mobile layout at 320 and 390 pixels. Header language buttons follow the separate PL / EN controls used by Modi Maps. Language switches do not store or transmit serials.

Coverage includes invalid/empty/oversized input, known Slim and Wolverine prefixes, unknown prefixes, missing production date, pending Pro firmware, model/date contradictions, serial normalization, exact firmware rules, numeric version comparison, exploit-range boundaries, private exploit exclusion, partial support and gaps, differing verified samples, editable prefix rules and data-only promotion of the Pro entry. Public data validation rejects overlong serial identifiers, MAC addresses, private serial fields, unsourced entries, false confirmation, unsupported statuses and unsafe proof paths.

## Live browser checks

| Check | Result |
| --- | --- |
| S01-F556 | PS5 Slim, 11.20 estimate; reference unit CONFIRMED |
| S01-F258, no date | PS5 Pro, estimated 2025 period, 11.40 estimate; reference unit CONFIRMED |
| S01-V565, no optional fields | PS5 Slim, CFI-2116 BZJY, 05.2026, 13.20 estimate, possibly compatible |
| S01-X999 | UNKNOWN; no invented firmware |
| Invalid and empty serial | Clear error; previous result removed |
| Wolverine with conflicting Pro model | UNKNOWN and conflict message; no firmware estimate |
| Wolverine with matching model and date | ESTIMATED at 13.20, date identified as box input |
| Full synthetic serial | Only its short prefix appears in the generated result |
| Search Wolverine | One matching record |
| Confirmed filter | Three owner-confirmed records, including Pro at 11.40 |
| Estimated filter | Accessible empty state |
| Unknown filter | Accessible empty state |
| Record details | Firmware basis, source, Vietnam, EDM-051 and complete system software string visible |
| Missing public proof | Disclosed explicitly; no fabricated evidence |
| Console warnings/errors | None observed |
| Repository subpath | Working at /modi-jb-checker/; modules, JSON, CSS and icon load |

Checked widths **320, 375, 390, 768 and 1024 CSS pixels**. Page width never exceeded the viewport after the mobile overflow fix. Screenshots inspected at phone and desktop widths. The database deliberately scrolls horizontally inside its own labeled region; the page does not. Phone input controls remain usable and the featured record retains its confirmation status. Keyboard-focus styling, dialog focus management, accessible labels and live-result markup are present.

## Remaining evidence and hosting work

The project owner must attach genuine sanitized proof files and original publication URLs when available. The initial confirmation statuses preserve the supplied reports and are explicitly identified as owner-reported.

The public repository is [modyfikatorcasper/modi-jb-checker](https://github.com/modyfikatorcasper/modi-jb-checker). GitHub Pages is configured to use the included Actions workflow. The first deployment started before Pages was enabled; only the failed deployment job was retried after configuration. The successful validation results were preserved. The checker URL is https://modyfikatorcasper.github.io/modi-jb-checker/.
