# LeetHub

LeetHub is a Chrome extension for synchronizing accepted LeetCode submissions to GitHub. It retrieves submitted source through LeetCode GraphQL, commits source and problem README files to the selected repository, and displays local synchronized-problem counts.

Authentication uses a user-provided fine-grained GitHub token on an extension-owned setup page. The service worker handles token storage, submission retrieval, upload queuing, deduplication, and non-forced branch updates.

LeetCode is the current supported platform. Other coding-site adapters, recommendations, offline practice, and comprehensive submission-history statistics are not implemented.

- [Setup Guide](Setup-Guide.md): build, install, connect a repository, and verify an upload.
- [Architecture](Architecture.md): browser contexts, messages, storage, and API flow.
- [README](../README.md): supported behavior and development commands.
