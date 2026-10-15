# Publish LeetHub

## Prepared package

Build and package with `npm run package`. Upload `artifacts/leethub-1.0.7.zip` as a Chrome extension in the Chrome Web Store developer dashboard. All executable code is bundled locally; source maps and unrelated archived assets are excluded.

Store copy and permission explanations are in [LISTING.md](LISTING.md). The privacy policy is in [PRIVACY.md](../PRIVACY.md). Graphic assets are in `store/assets`.

## Developer dashboard steps

1. Sign in at https://chrome.google.com/webstore/devconsole with the publishing account. Complete developer registration if needed.
2. For a new listing, choose New item and upload the ZIP. For an existing item, confirm its extension ID and upload the package as an update. A new version must exceed the published version.
3. Add the English description, category, icon, screenshots, and promotional tile. Add the public privacy policy URL and repository support URL.
4. Complete the Privacy practices fields using the concrete data handling and permission explanations in LISTING.md.
5. Perform a real accepted-submission upload with your test accounts and compare committed source bytes before submitting for review.
6. Select public visibility and submit for review. Publication is subject to Google's review; uploading the ZIP is not the same as a published listing.

The developer account, any existing extension ID, and signed-in dashboard access are required to submit. This repository does not contain publishing credentials. Do not commit them or paste tokens into public issues.
