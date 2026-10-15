# LeetHub

LeetHub is a Chrome Manifest V3 extension that uploads accepted LeetCode submissions to a selected GitHub repository. It fetches the actual submitted source and language from LeetCode instead of reading editor or problem-statement DOM elements.

## Supported features

- Automatic detection of completed LeetCode submission checks while the extension is installed.
- Upload accepted submission detail pages, or enter a submission ID / URL in the popup.
- Commit the source and problem README to the repository's default branch.
- Skip identical source and README content already on GitHub.
- Preserve concurrent commits with non-forced branch updates and conflict retries.
- Organize by platform or language file extension.
- Display counts of problems synchronized by this extension, with difficulty totals. Submission runtime and memory are saved with local statistics.

LeetCode is the supported platform. Programmers, Baekjoon, GeeksforGeeks, SWEA, and Goorm adapters are not included. Recommendations, comprehensive wrong-answer tracking, offline practice, and historical account statistics are not implemented.

## Install

Requirements: Node.js 20.19 or newer, npm, Chrome, and `zip` for packaging.

```sh
npm ci
npm run typecheck
npm test -- --watchAll=false
npm run build
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the repository's `build` directory. A normal web server does not provide extension APIs.

Open the extension popup and choose **Connect GitHub**. Create a fine-grained GitHub token restricted to the desired repository with **Contents: read and write**, and set an expiration date. Enter it on the extension's setup page. Link an existing repository, using its name or `owner/repository`; initialize it with a README first. New private repository creation is optional and needs additional GitHub account permission.

Choose organization and **Get Started**. This enables auto upload. Sign in to LeetCode using the same browser profile and submit a solution. Only accepted submissions with available source and language are uploaded. You can also visit your accepted submission detail page, or paste its ID / URL into **Upload an accepted submission** in the popup. Older submissions are uploaded only when selected this way; there is no bulk history import.

Check **View latest solution** and any error displayed in the popup. A failed extraction, unsupported language, expired/read-only token, empty repository, or protected branch produces an error instead of a success record. Uploads already committed when the toggle is switched off cannot be undone; preparation checks the toggle again before committing.

## Development and release

```sh
npm run watch    # rebuild on source/public changes; reload the unpacked extension manually
npm run package  # build and produce artifacts/leethub-<version>.zip
```

`npm start` watches and rebuilds the extension just like `npm run watch`; reload the unpacked extension to exercise browser APIs.

The build uses esbuild to produce independent popup, content-script, and service-worker bundles. Vitest runs the existing automated checks with jsdom. This replaces the unmaintained Create React App dependency graph, including vulnerable packages without patched releases. Type checking remains a separate required CI step; esbuild does not perform type checking. The release workflow builds and attaches an extension ZIP after its verification gate. Update `public/manifest.json` when changing extension versions.

See [Security](SECURITY.md), [Setup Guide](wiki/Setup-Guide.md), and [Architecture](wiki/Architecture.md). Automated checks cover API extraction, rejected requests, deduplication, conflicts, migration, setup, and popup behavior. The signed-in Python3 upload path was verified with a disposable repository; see [live verification](audit/LIVE-VERIFICATION.md) for evidence and limits. Private API schema changes may require adapter updates.
