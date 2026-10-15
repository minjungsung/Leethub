# Design references

The extension UI uses Apple-inspired typography, grouped content, rounded controls, restrained blue action color, and subtle material separation. It is implemented in HTML/CSS; it does not use Apple's native Liquid Glass rendering engine or proprietary symbols.

References reviewed:
- [Apple Human Interface Guidelines: Materials](https://developer.apple.com/design/human-interface-guidelines/materials), retrieved October 15, 2026. Guidance: use glass sparingly in the functional layer, maintain legibility, and keep content surfaces distinct.
- [Apple macOS](https://www.apple.com/macos/), retrieved October 15, 2026. Reference for spacing, type hierarchy, and material restraint.

Custom inline SVG symbols replace platform-dependent text glyphs. Content panels remain opaque for legibility. Subtle translucency is limited to controls and decorative setup elements. Reduced-transparency, increased-contrast, and reduced-motion preferences receive fallbacks.
