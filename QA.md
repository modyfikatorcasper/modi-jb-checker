# Verification report

Checked 2026-10-02. This report describes local verification, not a completed GitHub deployment or independent physical-console evidence review.

## Automated checks

`node --test`: **17 passed, 0 failed**. `node scripts/validate-data.js`: **passed**. Browser application modules: JavaScript syntax checks passed.

Coverage includes invalid/empty/oversized input, known Slim and Wolverine prefixes, unknown prefixes, missing production date, pending Pro firmware, model/date contradictions, serial normalization, exact firmware rules, numeric version comparison, exploit-range boundaries, private exploit exclusion, partial support and gaps, differing verified samples, editable prefix rules and data-only promotion of the Pro entry. Public data validation rejects overlong serial identifiers, MAC addresses, private serial fields, unsourced entries, false confirmation, unsupported statuses and unsafe proof paths.

## Live browser checks

| Check | Result |
| --- | --- |
| S01-F556 | PS5 Slim, 11.20 estimate; reference unit CONFIRMED |
| S01-F258, no date | PS5 Pro, estimated 2025 period, firmware unknown, pending verification |
| S01-V565, no optional fields | PS5 Slim, CFI-2116 BZJY, 05.2026, 13.20 estimate, possibly compatible |
| S01-X999 | UNKNOWN; no invented firmware |
| Invalid and empty serial | Clear error; previous result removed |
| Wolverine with conflicting Pro model | UNKNOWN and conflict message; no firmware estimate |
| Wolverine with matching model and date | ESTIMATED at 13.20, date identified as box input |
| Full synthetic serial | Only its short prefix appears in the generated result |
| Search Wolverine | One matching record |
| Estimated filter | One pending Pro record |
| Unknown filter | Accessible empty state |
| Record details | Firmware basis, source, Vietnam, EDM-051 and complete system software string visible |
| Missing public proof | Disclosed explicitly; no fabricated evidence |
| Console warnings/errors | None observed |
| Repository subpath | Working at /modi-jb-checker/; modules, JSON, CSS and icon load |

Checked widths **320, 375, 390, 768 and 1024 CSS pixels**. Page width never exceeded the viewport after the mobile overflow fix. Screenshots inspected at phone and desktop widths. The database deliberately scrolls horizontally inside its own labeled region; the page does not. Phone input controls remain usable and the featured record retains its confirmation status. Keyboard-focus styling, dialog focus management, accessible labels and live-result markup are present.

## Remaining evidence and hosting work

The project owner must attach genuine sanitized proof files and original publication URLs when available. The initial confirmation statuses preserve the supplied reports and are explicitly identified as owner-reported.

The GitHub Actions workflow is included and follows official Pages deployment documentation, but has not been executed against a GitHub repository in this session. Public repository creation and live Pages deployment require the destination account and authenticated GitHub access. No deployment URL is claimed.
