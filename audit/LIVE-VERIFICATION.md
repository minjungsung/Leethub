# Live integration verification

Verified on October 15, 2026 with an unpacked extension in signed-in Chrome and an initialized private disposable GitHub repository. Credentials and account identifiers are omitted.

- Submitted a Python3 Two Sum solution. LeetCode showed Accepted, 65/65 tests passed.
- Used the actual popup to upload the accepted submission. GitHub received `LeetCode/0001-two-sum/Solution.py` and a problem README. The source matched the submitted code; repository-scoped statistics became one Easy problem.
- Repeated the same upload. The popup reported that the solution was already uploaded; GitHub still contained only the initial commit and one solution commit.
- Submitted the same correct algorithm with a verification comment. A submission-check request triggered the service worker, without clicking manual upload, and produced a second solution commit. Statistics remained one problem.
- Reloading the extension while an older submission detail page remained open reprocessed that older accepted solution and created a further commit restoring its source. Opening historical details deliberately uploads the selected submission; it is not a latest-only history filter.
- The second automatic commit source SHA-256 was `be30fdd96a44847f6452eb33add409300feabc0a94cf5de9a40f9484eb10d461`.
- Paused via the popup toggle; manual upload became disabled. Re-enabled the integration.
- The authenticated submission-details GraphQL query worked in the actual service worker. Both submission-check URL forms are supported; the tested detail form returned HTTP 200.

The tested flow validates real authentication, accepted source extraction, GitHub writes, automatic detection, deduplication, and statistics for Python3. Other languages, expired tokens, protected branches, browser restarts, and concurrent external Git writers were covered only where stated in automated tests, not by this live session. No claim is made that every possible account configuration was tested.

The disposable repository is retained for review. It contains test solutions, not extension source.
