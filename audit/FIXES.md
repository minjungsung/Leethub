# Functional fixes

The fixes were developed on `fix/reliable-submission-sync` against the audited source tree. Before integration, remote main history was rewritten to `28c325d` with an identical source tree; the fix commit is based on that current main history. The original audit report describes the baseline, not this implementation.

## Changes

- Retrieve accepted submission source, language, problem ID, content, difficulty, runtime, and memory through authenticated LeetCode GraphQL. Reject missing data and nonaccepted status.
- Detect completed submission-check requests in the service worker, with detail-page navigation and a manual submission ID / URL fallback.
- Keep local credentials accessible only to trusted extension contexts. Content scripts send IDs only. Run migration once, preserve existing local data, await completion, and remove old synchronized credentials.
- Queue uploads across tabs. Compare both remote source and README Git blob hashes, normalize language names, and share the actual file path across checks and writes.
- Check every GitHub response. Use the actual default branch and base tree. Never force a ref update; retry conflicts with the latest head. Update statistics only after confirmed success or verified remote duplicates.
- Recheck integration settings before committing. Turning off prevents new upload work, including in already open pages. Changes already committed cannot be undone by toggling off.
- Replace legacy jQuery setup with awaited APIs and React feedback. Support repository owner/name input, persist organization, unlink and reconnect safely, and display valid GitHub links and repository-scoped counts.
- Generate independent popup, service-worker, and content bundles. Fix compatible Node types, enable TLS verification, replace the broken watch helper, add type checking to CI, and attach build ZIPs to releases.
- Document LeetCode as the supported platform. Remove advertised adapters and features that had no functioning implementation; recommendations, offline practice, and comprehensive historical statistics are not added.

## Validation

- Clean dependency installation passed with TLS verification enabled.
- `npm run typecheck` passed.
- `npm test -- --watchAll=false --runInBand` passed: 7 suites, 45 tests.
- `npm run package` passed; `artifacts/leethub-1.0.5.zip` passed ZIP integrity verification.
- Built popup HTML contains only the main entry; all manifest bundle paths exist.
- `actionlint .github/workflows/*.yml` and `git diff --check` passed.
- Isolated headless Chrome loaded the unpacked build through the Chrome debugging Extensions API. The popup rendered `LeetHub`, service-worker status returned disabled-by-default, migration completed, and no status error was returned. This used no real accounts or credentials. Chrome 155 ignored legacy extension-loading flags for the project; the explicit debugging load API was required.

The tests cover rejected authentication, setup errors, accepted source extraction, missing/nonaccepted submissions, Unicode blob encoding, failed uploads, remote duplicates, missing README repair, conflict retries, disabled integration, migration preservation, cross-tab queueing, sender validation, safe status responses, popup navigation, and statistics.

## Remaining external verification

A genuine signed-in LeetCode accepted submission and a disposable GitHub repository were not available for live upload testing. The private GraphQL schema and submission-check URL are external dependencies. Verify a real accepted upload, exact source bytes, token permissions, and branch protection in a signed-in browser before publishing. Live remote branches and releases were not changed.

Install locally by loading `build` through `chrome://extensions` in Developer mode, then connecting an initialized repository from the popup. The ZIP can be extracted and loaded the same way.
