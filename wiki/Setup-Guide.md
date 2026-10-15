# Setup Guide

Build with `npm ci` and `npm run build`, then load `build` as an unpacked Chrome extension through `chrome://extensions`.

Use the popup's setup link to connect a fine-grained GitHub token with Contents read/write permission for one initialized repository. Select **Link an Existing Repository**, enter its name or `owner/repository`, choose organization, and select **Get Started**. Repository creation is optional and requires additional GitHub permission.

Sign in to LeetCode in the same browser profile. New accepted submissions are detected through submission-check network completion events. Accepted detail pages are also detected. Use the popup's manual submission ID / URL field to retry or upload older submissions.

The popup shows errors and a link to the latest uploaded solution. Verify the uploaded code against your accepted submission. A read-only or expired token, unavailable source, unsupported language, empty repository, protected branch, or API failure must not be mistaken for success.

Changing auto-upload takes effect for new work without reloading problem pages. Changing source files requires rebuilding and reloading the extension; a page reload installs its new content script.

Run `npm run typecheck`, `npm test -- --watchAll=false`, and `npm run build` before packaging with `npm run package`. `npm run watch` rebuilds source changes; reload the unpacked extension manually.

The extension currently supports LeetCode only. It has no recommendation or offline-practice workflow.
