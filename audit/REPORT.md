# LeetHub functional audit

This report describes the original audited commit, before the subsequent fixes. Its reproduction script targets that original source and is not a regression test for the updated implementation.

Date: 2026-10-15. Audited source commit: `500882ea00bc532e52f282308003d88552754082`.

**Verdict: the current revision builds, but its core solution synchronization cannot be considered reliable.** The existing CI verifies three authentication tests and compilation. It does not verify submitted-code extraction, submission detection, repository setup, deduplication, failure handling, or browser integration.

The application source was left unchanged. This directory contains an offline reproduction harness and findings. No real credentials, repositories, submissions, releases, or remote branches were modified.

## Verification performed

| Check | Result | Limits |
| --- | --- | --- |
| `npm ci --strict-ssl=true` | Passed | Local Node 24.17.0 / npm 11.13.0; CI uses Node 20. |
| `npm test -- --watchAll=false --runInBand` | Passed: 1 suite, 3 tests | Authentication tests use mocked storage, API responses, and repository helpers. |
| `npm run build` | Passed | Compilation does not establish extension behavior. |
| `npm run build:dev` | Passed | CRA still creates an optimized production build. |
| `npm start` | Compiled; local HTTP response 200 | A normal web page lacks extension APIs. |
| `npx tsc --noEmit` | Failed | TypeScript 4.9 cannot parse declarations in `@types/node` 26 (`ffi.d.ts`). |
| `npm run watch -- --help` | Failed | `chokidar: command not found`. |
| `node audit/reproduce.cjs` | 14 assertions reproduced the documented conditions | Synthetic DOM, storage, and GitHub mocks; not live browser E2E. Some assertions establish configuration facts rather than runtime failures. |
| Remote checks on audited commit | CI and dependency gate passed | Consistent with the limited local test coverage. |
| Published releases | None | No installable release artifact was available to test. |
| `npm audit --json --strict-ssl=true` | Inconclusive | Registry advisory request failed certificate validation; no vulnerability totals established. |

`results.json` records probe outcomes. Reproduce from the repository root after installing dependencies:

```sh
node audit/reproduce.cjs
```

The harness exits successfully when all expected defective behaviors or configuration conditions are reproduced. This success means the audit reproduced its findings, not that the product passed functional acceptance.

## Prioritized findings

### P1: Submitted code is not extracted reliably

Evidence: `src/scripts/leetcode/parsing.ts:28`, `src/scripts/leetcode/programmers.ts:94`, `src/scripts/leetcode/uploadfunctions.ts:44`.

The parser takes the first `pre code` element on the page. This can be a problem-statement example, while an editor such as Monaco stores the user's code elsewhere. Without this element, the parser returns an empty solution. The subsequent object-level nonempty check still passes because the result contains keys, and the uploader has no source-code validation. Synthetic editor and statement fixtures reproduced both incorrect example extraction and empty code extraction.

Language extraction depends on `[data-mode-id]` with no fallback. Both supported sites share this LeetCode-specific parser; Programmers has no distinct extraction implementation. The parser does not read an accepted submission ID, submitted source, or submission language from a verified result. Even reading a current editor correctly would not ensure it matches the accepted submission.

Fix: collect the accepted submission's authoritative source and language through a platform-specific adapter, validate mandatory fields, and reject extraction failures before creating Git objects. Cover editing after submission, blank editors, examples, and Unicode source.

### P1: Upload failures can be reported as success

Evidence: `src/scripts/github.ts:180`, `src/scripts/leetcode/uploadfunctions.ts:62`.

GitHub helpers parse response JSON without checking HTTP status. A 401 or 403 response from the final ref PATCH returns no useful SHA but does not throw. The uploader then saves local SHA metadata and invokes the success callback. The offline probe reproduced this with a 401 response. Upload helpers also catch and swallow errors, preventing callers from reliably distinguishing success from failure.

Fix: reject every unsuccessful API response with an actionable error, propagate failure to the caller, and update local state only after verifying the branch ref advanced to the intended commit. Cover expired tokens, read-only tokens, rate limits, protected branches, network failures, and empty repositories.

### P1: Forced branch updates can discard concurrent commits

Evidence: `src/scripts/github.ts:55`, `src/scripts/github.ts:186`.

`updateHead` defaults to `force: true`; the uploader accepts that default. A second tab or external push can move the branch after the parent SHA is read. A later forced update can replace the new head with a sibling commit, removing the other change from branch history. The local upload lock only protects one script instance, not other tabs. The probe verified the forced PATCH payload; actual history loss was not performed.

Fix: use non-forced updates and retry conflicts by rebuilding against the latest parent. Serialize uploads through one extension-owned coordinator.

### P1: New-repository setup throws at runtime

Evidence: `src/constants/StatusCode.ts:53`, `src/scripts/welcome.ts:25`.

`StatusCode.ts` calls `$` but never imports jQuery. Importing jQuery in another module does not provide a lexical `$` binding, and its bundled CommonJS build does not install a global binding. A mocked 201 creation response reproduced `$ is not defined`. Because setting `mode_type` happens before the callback fails, setup may leave inconsistent state. Error-response branches also use the missing binding. The current Welcome tests mock the entire repository helper, so they cannot detect this issue.

The response handler also treats all unlisted statuses, including server errors, as success. Linking does not verify write permission; several failure statuses, including 401, lack an actionable handler. Repository helper listeners are registered at module import before React mounts the target elements, so these legacy listeners cannot be relied on.

Fix: replace the jQuery callbacks with awaited repository APIs and React state. Accept only the expected success status, validate returned fields and permissions, and test the real helpers.

### P1: Duplicate submissions are not deduplicated

Evidence: `src/scripts/leetcode/programmers.ts:268`, `src/scripts/leetcode/uploadfunctions.ts:42`, `src/scripts/leetcode/uploadfunctions.ts:65`.

The cache lookup uses `example/solutions/Two Sum.javascript`; successful uploads store `example/solutions/LeetCode/Two-Sum/Solution.js`. These paths cannot match. Repeated accepted-element insertions trigger another upload after the local lock resets. The probe reproduced two uploads for the same source and documented the mismatched lookup.

Fix: derive the upload path once and share it with cache lookup and storage. Use accepted submission identity as an additional idempotency key, and test repeated observations and multiple tabs.

### P1: Legacy storage migration can overwrite current authentication

Evidence: `src/scripts/storage.ts:5`, `src/scripts/storage.ts:26`, `config-overrides.js:9`.

When `isSync` is absent, migration writes each sync value into local storage without checking whether a local value already exists or the sync value is absent. Existing local token and hook values were overwritten with undefined values in the callback-style mock. The migration marker is written before migrations complete, and statistics initialization runs concurrently.

Storage code also has import-time initialization. The built popup loads `main.js`, standalone `storage.js`, and additional entries containing storage dependencies, so initialization can run from multiple bundles. Statistics maps are cleared on a version mismatch without recording the current version in that initializer; reconstruction depends on a later upload flow.

Fix: run a single awaited migration from the service worker, preserve local values, skip absent sync keys, and set the marker only after all writes complete. Validate behavior with the real Chrome storage API.

### P2: Auto-upload toggles do not affect already open pages

Evidence: `src/scripts/leetcode/programmers.ts:173`, `src/components/Popup.tsx:86`.

The content script reads enablement during initialization only. It neither listens to storage changes nor rechecks enablement before uploading. Disabling the popup toggle leaves an existing observer active; enabling it after a page initialized while disabled leaves no observer until reinitialization or reload. Both behaviors were reproduced.

Fix: subscribe to enablement changes, disconnect or create the observer accordingly, and recheck before initiating uploads.

### P2: Acceptance detection misses valid updates and can react to unrelated success UI

Evidence: `src/scripts/leetcode/programmers.ts:48`, `src/scripts/leetcode/programmers.ts:72`, `src/scripts/leetcode/programmers.ts:142`.

Only added HTMLElement nodes are checked. Replacing a pending result with an `Accepted` text node is ignored, and `characterData` is not observed. Existing results at initialization are not scanned. Generic `.success` selectors and substring matches do not establish that this was a final accepted submission; unrelated success messages or local test results can trigger the same path. The text-node case was reproduced; current live site DOMs were not captured.

Fix: bind detection to a platform submission identity and final status. Test the current platform DOM or submission API rather than guessed class names.

### P2: Claimed features and platform support exceed implementation

| Claim or UI | Source finding |
| --- | --- |
| Accepted / Wrong Answer tracking, runtime, memory | Only guessed success detection exists; no comprehensive status or runtime/memory collection. |
| Personalized statistics | Uploads update file SHAs, never `stats.problems`; Popup computes counts but does not render them. Reproduced unchanged problem statistics after a simulated successful upload. |
| Problem recommendations | No recommendation implementation found. |
| Offline problem access | No offline problem-save or retrieval workflow found. |
| Language organization selector | Value is kept in React state but never persisted; uploader always uses `LeetCode/`. |
| Programmers support | Same LeetCode parser and directory; separate functioning support is unverified. |
| GeeksforGeeks, Baekjoon, SWEA, Goorm | Manifest matches exist, but initialization restricts itself to LeetCode and Programmers. No upload adapters found. The solved.ac proxy has no call site. |
| Language filename mapping | `cpp` works, but display value `C++` yields `Solution.txt`; similarly `C#` and some SQL display names are not normalized. |

Fix: define an honest support matrix, implement and test promised features, and rewrite README/setup instructions around the actual extension workflow.

### P2: Repository navigation and reconnection UI are incomplete

Evidence: `src/components/Popup.tsx:55`, `src/components/Popup.tsx:133`, `src/components/Popup.tsx:62`, `src/components/Welcome.tsx:94`, `src/scripts/leetcode/util.ts:30`.

The hook is stored as `owner/repository` and used directly as an anchor href, resolving to a path inside the extension rather than GitHub. Reproduced URL resolution confirms this. Authentication-only storage changes are omitted from the popup listener. The unlink text offers no working unlink action. Upload links select the first branch-map entry rather than the active repository, producing wrong navigation after repository changes. Error/status paragraphs combine HTML `hidden` attributes with imperative display changes, which needs browser verification.

Fix: construct explicit GitHub URLs, provide setup/reconnect/unlink controls after connection, and manage feedback through React state.

### P2: Development, packaging, and documentation need correction

Evidence: `package.json:44`, `reload-extension.js`, `webpack.config.js`, `.github/workflows/release.yml`, `wiki/Setup-Guide.md`, `wiki/Architecture.md`.

`npm run watch` invokes an uninstalled `chokidar` executable. Even after installing it, the command does not rebuild changed code, and the reload helper is a placeholder that attempts to pass an extension ID to `chrome.runtime.reload` through an unspecified CDP target. The separate webpack config points to nonexistent `src/background.ts`. The actual successful CRA build includes all entry scripts in popup HTML, including service-worker and content-script entries; those contexts should have explicit entry lists.

An independent `npx tsc --noEmit` check fails with syntax errors in `@types/node/ffi.d.ts`: installed Node types use syntax newer than the declared TypeScript 4.9 compiler supports. CRA build success does not eliminate this incompatible declaration dependency. Align the compiler and Node type versions and include a direct type check in CI.

The release workflow creates a changelog/release but does not build and attach the extension package. The repository currently has no releases. Wiki architecture/setup still describe removed OAuth callbacks, broad page injection, and an obsolete build pipeline. README describes generic CRA website deployment, which does not install a browser extension, and references a LICENSE file absent from the checked-out files.

### Configuration and security follow-ups

- `public/manifest.json` grants `github.com` host access but not `api.github.com`. This is a configuration gap, **not proof that GitHub requests are blocked**: an unauthenticated OPTIONS request to GitHub's API returned permissive origin and Authorization-header CORS policies. Actual browser authentication/upload must be tested before attributing failures to permissions.
- `.npmrc` disables TLS certificate verification. Dependency installation with verification enabled succeeded locally, but the advisory endpoint failed certificate validation. Correct certificate trust and enable verification rather than treating that endpoint failure as a clean security audit.
- Token input and basic validation are confined to an extension page, and rejected tokens are not stored in existing tests. However, local storage remains accessible to the extension's content scripts by default; the uploader reads the token there. This is distinct from exposure to the page's own JavaScript in its separate world. Prefer keeping token access and GitHub writes in the service worker with validated requests.
- `SECURITY.md` documents the previously embedded OAuth secret. Its issuer-side revocation and any previously issued credentials were not verified by this audit. No historical secret values were printed or copied.

## Required live acceptance before claiming functionality

The local checks establish code defects without modifying real accounts. They do not prove a Chrome extension installation can authenticate and upload a genuine accepted submission. Use an isolated browser profile and disposable repository for these remaining checks:

1. Load the built extension and inspect popup, service-worker, and content-script errors.
2. Verify valid, invalid, expired, and read-only tokens; existing repositories; creation permission failures; empty repositories; and non-main default branches.
3. Submit known solutions on each supported site and compare the exact committed source with the accepted submission, including language and Unicode.
4. Repeat the same submission, run local examples, submit a wrong answer, and navigate between problems in the SPA. Verify upload counts and correct filenames.
5. Toggle on and off with pages already open, restart Chrome, reload the extension, and reconnect another repository.
6. Push a concurrent commit from another client or submit from two tabs; verify all changes remain on the branch without forced updates.
7. Verify API failures display failure and leave local SHA state unchanged; verify statistics and organization settings if retained as supported features.

These live checks remain unperformed. The source-level findings above are sufficient to reject a claim that the current build reliably provides the advertised functionality.
