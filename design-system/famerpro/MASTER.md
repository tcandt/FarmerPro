# FamerPro Design System

Product type: internal operations dashboard for APK-managed cloud phones.

## Visual Direction

- Dense, scan-first console layout inspired by Solumate device tiles.
- Brand identity uses dark navy base with mint, teal and cyan status accents.
- Avoid landing-page composition, decorative blur, heavy shadows, and large gradients.
- UI controls must stay stable when devices reconnect, resize, or change profile.

## Core Tokens

- Ink: `#081D3A`
- Mint: `#00E676`
- Teal: `#00BFAE`
- Cyan: `#20D4FF`
- Pale surface: `#E6F7F3`
- Typography: Space Grotesk preferred, system fallback acceptable.

## Interaction Rules

- Device state must include icon or text, not only color.
- Minimum control target: 44 x 44 px.
- Focus states visible.
- Pointer coordinates are normalized before sending to control transport.
- MOVE commands should be coalesced at animation-frame cadence.

## Layout Rules

- First screen is the console, not a marketing page.
- Right rail contains tile size, stream profile, quick Android controls, sync, and device list.
- Device grid uses stable tile dimensions and scroll isolation.
- Selected device and sync master must be visually obvious.
