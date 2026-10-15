# Architecture

Webpack produces three independent entry bundles: `main.js` for the React popup/setup UI, `background.js` for the Manifest V3 service worker, and `content.js` for LeetCode submission-detail navigation. Popup HTML includes only `main.js`; content and background contexts are independently executable.

The service worker owns legacy storage migration and restricts local storage to trusted extension contexts. Content scripts send submission IDs and request safe status information; they cannot read the token. Authentication occurs only on the extension setup page using a user-provided token.

`webRequest.onCompleted` observes LeetCode submission-check completion URLs. Both these events and detail-page/manual messages feed a single service-worker upload queue. Duplicate pending IDs share a promise. Sender origin and extension identity are validated before accepting messages.

The parser retrieves `submissionDetails` through LeetCode GraphQL with browser credentials, rejects missing source/language/problem fields, and returns only accepted status code 10. It never extracts code from `pre code` or the current editor. No arbitrary API URL or source code is accepted from content messages.

The GitHub client validates HTTP status for every request. Upload reads the default branch and its commit/tree, compares Git blob hashes for both source and README, and creates only necessary commits. Ref updates use `force: false`. Conflicts retry against the latest parent up to three times, preserving unrelated files through `base_tree`. Settings are rechecked before committing. Local problem statistics and success feedback are written only after GitHub confirms the new ref, or confirms identical files already exist.

Statistics count synchronized problems by repository and problem ID. Credentials, settings, and statistics remain in local extension storage; legacy synced credentials are removed during migration. Empty repositories must first be initialized on GitHub.

Only LeetCode has an adapter. Its authenticated API and submission-check URL schema are external dependencies and require live smoke testing when they change.
