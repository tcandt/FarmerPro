# Farm Console Page

## Purpose

Operate 20-30 Android APK devices from one console, with later scale to larger fleets.

## Required Regions

- Header: brand, fleet status, network health, sync state, language/user controls.
- Device grid: Solumate-style tiles, numbered headers, connection badges, live/mock screen area, nav controls.
- Right rail: tile size, stream config, quick controls, sync devices, selected followers.
- Optional detail strip: active device profile and control latency telemetry.

## Acceptance Notes

- No horizontal overflow at 1366, 1440, or 1920 width.
- 30 mock devices render without layout thrash.
- Offline, waiting, active, error, and sync states are distinct.
