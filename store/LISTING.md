# Chrome Web Store listing

Name: LeetHub

Short description: Sync accepted LeetCode submissions to a selected GitHub repository.

Suggested category: Developer Tools

Language: English

## Detailed description

LeetHub saves your accepted LeetCode solutions to a GitHub repository you choose.

It retrieves the code from the actual accepted submission, then commits the source file and problem README to the repository's default branch. Identical source and README files are skipped. Non-forced branch updates preserve other changes when uploads happen concurrently.

Features:
- Detect new accepted LeetCode submissions automatically.
- Upload an older accepted submission by opening its detail page or entering its ID or URL.
- Organize solutions by platform or language file extension.
- View synchronized-problem counts and difficulty totals.
- Pause uploads, change the repository, and inspect the latest uploaded solution.

Setup requires signing in to LeetCode and providing a fine-grained GitHub token with Contents read and write access to one initialized repository. Linking an existing repository is recommended. Creating a new private repository requires additional GitHub permission.

The token stays in local extension storage and is used only for GitHub API requests. LeetHub has no developer-operated analytics or data collection server.

Supported platform: LeetCode. Recommendations, offline practice, other coding platforms, and bulk submission-history import are not included.

LeetHub is an independent project and is not affiliated with LeetCode or GitHub.

## Single purpose

Synchronize user-selected accepted LeetCode submissions and problem descriptions to the user's selected GitHub repository.

## Permission justifications

- `storage`: Store the GitHub token, repository configuration, enablement setting, upload results, and synchronized-problem statistics locally. Restrict token access to trusted extension contexts.
- `webRequest`: Observe completion of LeetCode submission-check requests, extract the submission ID from the request URL, and retrieve the actual submission status/source from LeetCode. Does not modify traffic or collect browsing history.
- `https://leetcode.com/*`: Run the detail-page detector and retrieve the user's accepted submission details using their signed-in LeetCode session.
- `https://api.github.com/*`: Verify the user-provided GitHub token, retrieve repository metadata, and write solution commits to the selected repository.

Remote code: No. Executable scripts are included in the extension package; API responses are treated as data.

## Privacy disclosures to verify in the dashboard

Declare authentication information (GitHub token and existing authenticated session use), personally identifiable information (GitHub account name), and website content (submitted code and problem details). The extension transmits code and problem details to the selected GitHub repository and persists account configuration locally. It observes submission-check URLs solely for this functionality and does not retain general browsing activity. Follow the current dashboard definitions when completing the disclosure categories; do not select "no user data".

Certifications: Data is not sold to third parties, used for unrelated purposes, or used for creditworthiness or lending decisions. Review and certify these in the developer dashboard.

Privacy policy: Link the public repository's `PRIVACY.md` page after main is updated.

## Review instructions

1. Install the extension and open its popup.
2. Open Connect GitHub, provide your own fine-grained GitHub token with Contents read/write to an initialized test repository, choose Link an Existing Repository, and select Get Started.
3. Sign in to your own LeetCode account. Submit an accepted solution or use one of your existing accepted submission IDs in the popup.
4. Verify source and README files in the selected repository and confirm the popup reports the upload.
5. Repeat the same submission to verify no duplicate commit; disable auto upload to pause work.

Do not attach live tokens, private submissions, or personal browser screenshots to the review submission. The supplied screenshots show the real extension UI with fictional demonstration data, not a live upload.
