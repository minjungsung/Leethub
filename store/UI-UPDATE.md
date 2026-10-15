# Version 1.0.6 UI update

The popup and setup page use Apple-inspired system typography, opaque white grouped content, cool gray backgrounds, rounded blue action buttons, and custom SVG icons. Subtle material effects are reserved for controls and decorative setup elements. Accessibility preferences have reduced-motion, reduced-transparency, and contrast fallbacks. The popup scrolls within Chrome's 600-pixel height limit when feedback is visible.

GitHub connection and repository selection remain two explicit steps. Connected users can pause automatic uploads, view repository-scoped statistics, upload an older accepted submission, and open the latest solution.

Type checking, 45 automated tests, production build, and isolated unpacked Chrome smoke tests passed. Signed-in Chrome verification confirmed GitHub connection, private repository linking, an accepted Python3 Two Sum upload, exact source preservation, README creation, repeated-upload deduplication, and automatic detection of a second accepted submission without clicking the popup upload button. Pausing disabled manual upload; re-enabling restored it. These live checks cover the tested Python3 path, not every language, token expiration, branch protection, or concurrent remote client.

See [live verification](../audit/LIVE-VERIFICATION.md) and [design references](DESIGN-REFERENCES.md).

## Rounded popup follow-up

The popup has a 4px white inset around a 12px rounded panel and a thin scrollbar. Content cards use 14px corners. The panel scrolls within 592px so the complete popup stays within Chrome's 600px height limit. Chrome controls the native window border. The setup page keeps its independent layout.

The updated unpacked extension was reloaded in Chrome; the rendered panel initially had a 24px corner radius and no horizontal overflow. Type checking, all 45 existing tests, production packaging, and ZIP integrity checks passed. An authenticated accepted Python3 submission's 286 source bytes matched the GitHub solution exactly (SHA-256: `81e0e33c3eddf9dde2d7cbabbc9441dabf9e3693d9a14117342ca47039823dc6`). A repeated upload through the updated popup returned "This solution is already uploaded." and left the remote branch head unchanged.

The corner radius was subsequently reduced to 12px, card corners to 14px, and the outer inset to 4px for a more restrained appearance.

## Shared icon update

The toolbar, popup, and setup header now share an independent vector mark: white code brackets and a sky-blue upload arrow on a dark navy rounded tile. Raster icons at 16, 32, 48, and 128px are generated from `public/assets/leethub-mark.svg`; store screenshot generation uses the same source. The page favicon uses the current icon as well.
