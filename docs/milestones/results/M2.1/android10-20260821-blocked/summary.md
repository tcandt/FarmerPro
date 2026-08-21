# M2.1 Android 10 Physical Validation Result

## Metadata

Device:
Manufacturer: N/A
Model: N/A
Serial: N/A
Android: N/A
API: N/A
Build fingerprint: N/A
Display: N/A
DPI: N/A
ROM: N/A

Network topology:
Server IP: N/A
Device IP: N/A

Server SHA: a4545dab78a738743da91523d3f48815d8ec96a3
APK SHA: N/A
Branch: main
Build type: debug
Accessibility: N/A
Test date/time: 2026-08-21T15:36:00+07:00

## Smoke

BLOCKER: No physical Android 10 device available. Only emulator detected.

## Full Functional

BLOCKED

## Resilience

BLOCKED

## Performance

BLOCKED

## Failure Details

- **Test Case**: Device Discovery
- **Attempt**: Pre-flight
- **Expected**: A real physical Android 10 device connected via ADB.
- **Actual**: No physical devices found. `adb devices -l` showed only `emulator-5562`.
- **Relevant logs**:
  ```text
  List of devices attached
  emulator-5562          device product:sdk_gphone16k_x86_64 model:sdk_gphone16k_x86_64 device:emu64xa16k transport_id:12
  ```

## Final Verdict

Android 10 Runtime:
BROKEN (BLOCKED)

Functional:
BROKEN (BLOCKED)

Performance:
BROKEN (BLOCKED)

Reconnect/Fencing:
BROKEN (BLOCKED)

Overall M2.1:
PARTIAL

Reason:
No physical Android device visible through ADB. Testing aborted as per strict instructions to not substitute with emulator. Android 8/9 remain untested.
