# Security

Browser extensions cannot keep an OAuth client secret confidential. Authentication uses a user-provided fine-grained GitHub token on the extension-owned welcome page. Prefer one existing repository with Contents read/write access and an expiration date. Creating a new repository may require additional account permissions and is optional.

Tokens remain in extension-local storage; they are never included in source or sent through content-script authentication messages. Content scripts run only on supported coding sites. A compromised extension or browser profile can still access local tokens, so revoke tokens when removing the extension or suspecting compromise.

The previously embedded OAuth client secret was exposed in source and historical commits. Its issuer must revoke it. Removing the constant and sanitizing history cannot revoke a credential or invalidate previously issued OAuth tokens.
