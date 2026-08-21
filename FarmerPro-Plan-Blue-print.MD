# FamerPro — Master Implementation Blueprint

## Trạng thái

- 🟢 **DONE** — đã hoàn tất/xác minh.
- 🟦 **LOCKED** — kiến trúc/spec đã chốt, chưa triển khai code.
- 🟡 **VALIDATE** — đã có hướng triển khai nhưng bắt buộc benchmark/device-test.
- ⚪ **TODO** — chưa triển khai.
- 🔴 **BLOCKER** — không được mở phase sau trước khi xử lý.

> **Quy tắc trạng thái:** chỉ chuyển một mục sang 🟢 khi code + test + acceptance criteria của mục đó đã pass. Không đánh xanh vì “code compile được”.

---

# I. PHASE 0 — FOUNDATION, SOURCE MAPPING & ARCHITECTURE FREEZE

**Trạng thái tổng:** 🟦 LOCKED  
**Mục tiêu:** xác lập FamerPro là project mới, không trở thành bản vá chồng lên SocMTool.

## 1. Nguồn tham khảo

### a. SocMTool — 🟢 DONE: source analysis

Giữ ý tưởng:

```text
Android APK
   ↓
MediaProjection
   ↓
network
   ↓
Web viewer

Web control
   ↓
network
   ↓
AccessibilityService
```

Nhưng không giữ media pipeline hiện tại:

```text
RGBA
→ Bitmap
→ JPEG
→ Base64
→ JSON
→ Socket.IO
```

SocMTool thực tế đang dùng `ImageReader`, tạo RGBA byte array, `Bitmap`, JPEG 85 và Socket.IO. 

`SocketManager` cũng đang trộn registration, media và control trong cùng một abstraction. 

### b. stream-phonefarm-solumate — 🟢 DONE: source analysis

Giữ:

```text
Device grid
Selected viewer
Tile resize
Stream settings
Main/Follower SyncPanel
Normalized pointer coordinates
Back/Home/Recent
Per-device status
```

Repo đã có tile size riêng với stream config, bitrate/FPS controls và main/follower sync UX. 

Touch của repo normalize tọa độ về `0..1`, rồi map theo kích thước từng target. Đây là pattern nên đưa vào FamerPro. 

Không giữ:

```text
ADB
USB
scrcpy server dependency
browser-side fanout authoritative control
one H264 decoder worker per hundreds of devices
```

Backend repo đó xoay quanh scrcpy/ADB. 

### c. OpenDroid — 🟢 DONE: source analysis

Dùng để tham khảo:

```text
Kotlin Android architecture
Hilt DI
Room
Accessibility service lifecycle
instrumentation tests
release lint/signing discipline
service separation
```

OpenDroid hiện dùng Kotlin, `minSdk 26`, Hilt, Room và Compose. 

Accessibility code được tách thành service + node traversal + automator thay vì nhét tất cả vào socket handler. 

Coordinate gesture cũng đi qua `dispatchGesture()`. 

**Không copy AndroidManifest của OpenDroid.** Manifest của repo đó yêu cầu rất nhiều permission cho chức năng AI assistant; FamerPro phải dùng principle of least privilege. 

---

## 2. Stack FamerPro

### a. Android Agent

**🟦 Kotlin**

```text
Kotlin
Coroutines
Hilt
Room
Android Foreground Service
MediaProjection
WebRTC Android
AccessibilityService
```

Không dùng Java mới cho core agent.

### b. Backend

**🟦 Go**

Lý do:

```text
many persistent connections
cheap goroutines
low allocation path possible
good WebSocket support
good concurrency model
Pion WebRTC ecosystem
single deployable binaries
```

Runtime backend ban đầu:

```text
Go Control Gateway
Go Signaling
Go Device Registry
Go Media coordinator
PostgreSQL
```

Chưa cần microservices ngay.

### c. Frontend

**🟦 TypeScript + React**

```text
React
TypeScript
Vite
TanStack Query
Zustand
TanStack Virtual
WebRTC
CSS/Tailwind + design tokens
```

Không dùng Vue song song với React.

### d. Python

Chỉ dùng:

```text
benchmark
load testing
report generation
device test tooling
```

Không đưa Python vào realtime media/control hot path.

### e. Rust

**⚪ RESERVED**

Chỉ mở Rust nếu profiling chứng minh Go media worker không đáp ứng.

Không dùng Rust chỉ vì “nhanh hơn”.

---

# II. FAMERPRO MASTER CODEGRAPH

**Trạng thái:** 🟦 LOCKED

```text
                         ┌────────────────────────────┐
                         │      FamerPro Web UI       │
                         │ React + TypeScript         │
                         │                            │
                         │ Grid / Viewer / Sync       │
                         └────────────┬───────────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │                                    │
                    ▼                                    ▼
             CONTROL PLANE                         MEDIA PLANE
             Binary WebSocket                      WebRTC
                    │                                    │
                    ▼                                    ▼
          ┌──────────────────┐                 ┌────────────────┐
          │ Control Gateway  │                 │ Media Router   │
          │ Go               │                 │ Go/Pion        │
          └────────┬─────────┘                 └───────┬────────┘
                   │                                   │
                   ▼                                   │
          ┌──────────────────┐                         │
          │ Command Coord.   │                         │
          │ seq / clock      │                         │
          │ group fan-out    │                         │
          └────────┬─────────┘                         │
                   │                                   │
      ┌────────────┼─────────────┐                     │
      │            │             │                     │
      ▼            ▼             ▼                     ▼
   Phone 1      Phone 2       Phone 30             Phone streams
      │            │             │
      ├────────────┴─────────────┘
      │
      ▼
┌────────────────────────────────────────────┐
│          FamerPro Agent APK               │
│                                           │
│ DeviceSession                             │
│ CaptureEngine                             │
│ WebRTC Publisher                         │
│ CommandQueue                              │
│ ClockSync                                 │
│ AccessibilityExecutor                    │
│ Telemetry                                │
└────────────────────────────────────────────┘
```

---

# III. MONOREPO SKELETON

**Trạng thái:** ⚪ TODO

```text
FamerPro/
│
├── apps/
│   │
│   ├── android-agent/
│   │   ├── app/
│   │   ├── core/
│   │   ├── device/
│   │   ├── media/
│   │   ├── control/
│   │   ├── network/
│   │   ├── telemetry/
│   │   └── storage/
│   │
│   └── web-console/
│       ├── src/app/
│       ├── src/components/
│       ├── src/features/device-grid/
│       ├── src/features/viewer/
│       ├── src/features/control/
│       ├── src/features/sync/
│       ├── src/features/streams/
│       ├── src/stores/
│       └── src/design-system/
│
├── services/
│   └── core-server/
│       ├── cmd/server/
│       ├── internal/device/
│       ├── internal/control/
│       ├── internal/clock/
│       ├── internal/signaling/
│       ├── internal/media/
│       ├── internal/auth/
│       ├── internal/telemetry/
│       └── internal/persistence/
│
├── packages/
│   ├── protocol/
│   ├── generated/
│   └── design-tokens/
│
├── infrastructure/
│   ├── docker/
│   ├── prometheus/
│   └── grafana/
│
├── tools/
│   ├── benchmark/
│   ├── loadtest/
│   └── device-lab/
│
├── docs/
│   ├── adr/
│   ├── protocol/
│   ├── benchmark/
│   └── runbooks/
│
└── design-system/
    └── famerpro/
        ├── MASTER.md
        └── pages/
```

---

# IV. PHASE 1 — ANDROID AGENT FOUNDATION

**Trạng thái:** ⚪ TODO

**Goal:** APK chạy ổn định Android 8/9/10 trước khi thêm video/control phức tạp.

## 1. Project base

### a. Gradle

```text
minSdk = 26
targetSdk = current validated target
Kotlin
Hilt
Room
Coroutines
```

OpenDroid là reference tốt cho việc giữ `minSdk 26`, Hilt và Room. 

### b. Package structure

```text
com.famerpro.agent
│
├── app
├── bootstrap
├── device
├── media
├── control
├── accessibility
├── network
├── telemetry
└── persistence
```

---

## 2. Device identity

### a. `DeviceIdentity.kt`

```kotlin
data class DeviceIdentity(
    val deviceId: String,
    val model: String,
    val manufacturer: String,
    val androidApi: Int,
    val appVersion: String
)
```

### b. Device ID

Không dùng Socket.IO SID làm device ID.

Device ID phải stable qua reconnect:

```text
install
   ↓
generate UUID
   ↓
store locally
   ↓
server enrollment
   ↓
stable device identity
```

---

## 3. Capability probe

### a. `DeviceCapabilities.kt`

```kotlin
data class DeviceCapabilities(
    val displayWidth: Int,
    val displayHeight: Int,
    val densityDpi: Int,
    val maxRefreshRate: Float,
    val supportsAvc: Boolean,
    val encoderProfiles: List<EncoderProfile>
)
```

### b. Probe

Test:

```text
360p15
360p25
720p30
720p60
1080p30
```

Không giả định mọi phone hỗ trợ 60 FPS.

---

## 4. Lifecycle

### a. Services

```text
FamerProApplication
      │
      ├── Enrollment
      ├── DeviceSessionService
      ├── CaptureService
      └── AccessibilityService
```

### b. Rule

`AccessibilityService` không được sở hữu WebSocket.

`CaptureService` không được xử lý control.

---

## 5. Phase 1 codegraph

```text
Application
    │
    ▼
DeviceEnrollment
    │
    ▼
DeviceIdentity
    │
    ├── CapabilityProbe
    ├── ConfigRepository
    └── DeviceSessionService
             │
             ▼
        Backend Gateway
```

### Acceptance

- ⚪ Android 8 real device launches.
- ⚪ Android 9 real device launches.
- ⚪ Android 10 real device launches.
- ⚪ Device reconnect giữ nguyên `deviceId`.
- ⚪ No crash sau 12h idle.
- ⚪ Service restart recovery test pass.

---

# V. PHASE 2 — LOW-LATENCY CONTROL PLANE

**Trạng thái:** ⚪ TODO

Đây là phase ưu tiên cao nhất vì mục tiêu là cảm giác điều khiển gần như tức thời.

## 1. Transport

### a. Persistent connection

```text
APK
 ↕
Binary WebSocket
 ↕
Go Control Gateway
```

Không:

```text
HTTP request/touch
JSON object/mousemove
```

### b. Protocol

Dùng:

```text
binary protobuf
```

Ví dụ schema:

```proto
message ControlCommand {
  string command_id = 1;
  uint64 sequence = 2;
  string group_id = 3;

  ControlType type = 4;

  float x_norm = 5;
  float y_norm = 6;

  uint32 pointer_id = 7;
  int64 execute_at_mono = 8;
}
```

---

## 2. Command semantics

### a. Reliable

```text
DOWN
UP
KEY
HOME
BACK
RECENT
PROFILE_CHANGE
```

### b. Latest-wins

```text
MOVE
SCROLL_MOVE
```

Nếu queue có:

```text
MOVE 21
MOVE 22
MOVE 23
MOVE 24
```

executor chưa chạy thì giữ:

```text
MOVE 24
```

---

## 3. APK control codegraph

```text
WebSocketReader
      │
      ▼
CommandDecoder
      │
      ▼
SequenceGuard
      │
      ▼
CommandQueue
      │
      ▼
CommandScheduler
      │
      ▼
AccessibilityExecutor
      │
      ▼
dispatchGesture()
```

---

## 4. Accessibility Executor

Tham khảo cách OpenDroid tách Accessibility service khỏi automation logic. 

### a. Interface

```kotlin
interface InputExecutor {
    suspend fun execute(command: ControlCommand): ExecutionResult
}
```

### b. Single execution lane

```text
network coroutine
network coroutine
network coroutine
       │
       ▼
 bounded queue
       │
       ▼
 SINGLE executor
```

Không dispatch nhiều gesture concurrent.

---

## 5. Coordinate mapper

Từ Solumate giữ pattern normalized coordinates. 

Browser:

```text
xNorm = pointerX / sourceWidth
yNorm = pointerY / sourceHeight
```

Phone:

```text
realX = xNorm * physicalWidth
realY = yNorm * physicalHeight
```

### c. Mapping modes

```text
NORMALIZED
EXACT_PIXEL
FIT_CONTENT
```

Default:

```text
NORMALIZED
```

---

## 6. 1 → N control

Browser không gửi 30 socket messages.

Browser gửi:

```text
GROUP_COMMAND
group=room01
```

Control Hub:

```text
                  command
                     │
             ┌───────┴───────┐
             │ Control Hub   │
             └───────┬───────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
   Phone 1        Phone 2        Phone 30
```

---

## 7. Synchronization

### a. Immediate mode

Dùng khi control một phone:

```text
execute ASAP
```

### b. Sync mode

Dùng 20–30 follower:

```text
server receive T0
      ↓
executeAt = T0 + leadTime
      ↓
all devices queue
      ↓
execute near same clock
```

[Inference] Initial target:

```text
leadTime: 15–30 ms LAN
```

Sau benchmark mới chốt.

---

## 8. Control performance acceptance

[Inference] Target ban đầu:

```text
Browser → Gateway:
P95 < 10 ms LAN

Gateway → APK:
P95 < 10 ms

APK receive → gesture dispatch:
P95 < 10 ms

20–30 device dispatch skew:
P95 < 10–15 ms
```

Không gọi đây là “0 ms”.

Mục tiêu UX là:

> không cảm nhận thấy độ trễ khi thao tác.

---

# VI. PHASE 3 — SELECTED DEVICE MEDIA

**Trạng thái:** ⚪ TODO

Chỉ làm **1 selected device** trước.

## 1. Capture graph

```text
MediaProjection
      │
      ▼
ScreenCapturer
      │
      ▼
WebRTC VideoSource
      │
      ▼
Hardware Video Encoder
MediaCodec-backed
      │
      ▼
WebRTC PeerConnection
      │
      ▼
Media Node
      │
      ▼
Browser
```

Không dùng JPEG.

---

## 2. Media modules

```text
media/
├── ProjectionManager.kt
├── ScreenCaptureController.kt
├── RtcPublisher.kt
├── StreamProfileManager.kt
├── EncoderCapabilityProbe.kt
└── MediaStatsCollector.kt
```

---

## 3. ACTIVE profiles

[Inference]

```text
ACTIVE_STANDARD
720 × 1280
30 FPS
1.5–2.5 Mbps

ACTIVE_HIGH
720 × 1280
60 FPS
2.5–4 Mbps

ACTIVE_DETAIL
1080-class
30 FPS
3–5 Mbps
```

Resolution phải giữ aspect ratio thực.

---

## 4. Dynamic profiles

```text
user selects phone
        │
        ▼
ProfileController
        │
        ▼
ACTIVE
```

Khi bỏ selected:

```text
ACTIVE
  ↓
THUMB
```

---

## 5. Phase 3 codegraph

```text
Web Viewer
    │
    │ select device 07
    ▼
Backend
    │
    ├── media subscribe
    └── SET_PROFILE ACTIVE
                 │
                 ▼
            Android #07
                 │
          WebRTC Publisher
                 │
                 ▼
             Media Node
                 │
                 ▼
          Selected Viewer
```

---

## 6. Selected-stream acceptance

[Inference] Initial target:

```text
30 FPS stable:
🟡 must validate

60 FPS:
only validated-capable devices

glass-to-glass:
target P95 < 120 ms LAN

control:
must remain responsive during video load
```

Control and video cannot share blocking queue.

---

# VII. PHASE 4 — WEB CONSOLE FOUNDATION

**Trạng thái:** ⚪ TODO

Frontend concept lấy từ `stream-phonefarm-solumate`, không lấy ADB architecture.

Repo tham khảo hiện có `Tile`, `DeviceViewer`, `SyncPanel`, `RightBar`, `ActiveContext`. 

## 1. Main shell

```text
┌─────────────────────────────────────────────────────────────┐
│ FamerPro             Online 24/30        Network / Health   │
├───────────────────────────────┬─────────────────────────────┤
│                               │ Stream                     │
│                               │ Tile size                  │
│       DEVICE GRID             │ FPS                        │
│                               │ Bitrate                    │
│                               │                            │
│                               │ Sync                       │
│                               │ Main                       │
│                               │ Followers                  │
└───────────────────────────────┴─────────────────────────────┘
```

---

## 2. Feature tree

```text
features/
│
├── device-grid/
│   ├── DeviceGrid.tsx
│   ├── DeviceTile.tsx
│   ├── DeviceTileHeader.tsx
│   └── DeviceVirtualizer.tsx
│
├── viewer/
│   ├── ActiveViewer.tsx
│   └── ViewerControls.tsx
│
├── sync/
│   ├── SyncPanel.tsx
│   ├── MasterSelector.tsx
│   └── FollowerSelector.tsx
│
└── control/
    ├── PointerController.ts
    ├── CoordinateMapper.ts
    └── KeyboardController.ts
```

---

## 3. React skeleton

```tsx
export function DeviceTile({ device }: DeviceTileProps) {
  const select = useDeviceStore(s => s.selectDevice);

  return (
    <article className="device-tile">
      <DeviceTileHeader device={device} />

      <DeviceVideo
        deviceId={device.id}
        mode="thumbnail"
        onPointerDown={() => select(device.id)}
      />

      <DeviceNavigation deviceId={device.id} />
    </article>
  );
}
```

Không nhét WebRTC lifecycle vào `DeviceTile`.

Phải tách:

```text
UI Component
   ↓
Media Subscription Hook
   ↓
Media Client
```

---

# VIII. FRONTEND NON-NEGOTIABLE RULES

**Trạng thái:** 🟦 LOCKED

UI/UX Pro Max đặt Accessibility và Touch/Interaction ở mức ưu tiên critical; các check gồm contrast, keyboard navigation, minimum touch size, loading feedback và performance/virtualization. 

## 1. Architecture

### a.

Không WebSocket logic trong component UI.

### b.

Không WebRTC connection tạo trực tiếp trong tile component.

### c.

Không authoritative sync logic trong browser.

### d.

Không `useState` rải rác cho device fleet state.

Dùng:

```text
DeviceStore
ControlStore
SyncStore
LayoutStore
```

---

## 2. Render performance

### a.

Device grid bắt buộc virtualized.

### b.

Offscreen tile không được tiếp tục full decode nếu không cần.

### c.

Không tạo:

```text
2 workers × 300 tile
```

Solumate hiện dùng decoder worker + render worker per stream tile, phù hợp để tham khảo logic backpressure nhưng không nên mở rộng nguyên xi đến hàng trăm tile. 

### d.

Pointer MOVE flush tối đa một lần mỗi animation frame phía UI.

---

## 3. Design system

UI/UX Pro Max khuyến nghị new project tạo một master design system và page override thay vì tự styling từng trang. 

FamerPro:

```text
design-system/famerpro/
├── MASTER.md
├── tokens.ts
└── pages/
    ├── farm-console.md
    └── device-viewer.md
```

---

## 4. Visual direction

FamerPro là internal operations dashboard.

Ưu tiên:

```text
high information density
clear device states
low visual noise
fast scanning
consistent control location
dark/light compatibility
```

Không:

```text
large gradients everywhere
glass blur on 30 tiles
heavy shadow per tile
decorative animation
emoji icons
```

UI/UX Pro Max cũng nêu SVG icons thay emoji, visible focus state, reduced-motion và responsive requirements. 

---

## 5. Accessibility

Minimum interactive target:

```text
44 × 44 px
```

Visible focus.

Không sử dụng màu duy nhất để biểu thị:

```text
online
offline
error
sync
```

Ví dụ:

```text
● Online
× Offline
! Error
⇄ Sync
```

---

## 6. Animation

Control UI:

```text
50–150ms feedback
```

Không dùng animation làm trì hoãn command.

Semantic state thay đổi ngay; animation chỉ thể hiện feedback.

---

# IX. PHASE 5 — 20–30 PHONE MVP TARGET

**Trạng thái:** ⚪ TODO

Đây là production gate đầu tiên.

## 1. Target topology

```text
                        Browser
                           │
            ┌──────────────┴──────────────┐
            │                             │
        Control WS                      WebRTC
            │                             │
            ▼                             ▼
     Go Core Server                 Media Router
            │                             │
            ├─────────────┐               │
            ▼             ▼               ▼
        Device 1       Device 30      30 streams
```

---

## 2. Stream profiles

### a. Normal thumbnail

[Inference]

```text
THUMB_STD
288–360 px width
15 FPS
150–250 kbps
```

### b. High thumbnail

```text
THUMB_HIGH
360–480 px width
20–25 FPS
250–400 kbps
```

### c. Selected

```text
ACTIVE
720-class
30 FPS

ACTIVE_60
720-class
60 FPS
capability dependent
```

---

## 3. Bandwidth controller

Backend maintains:

```text
GlobalBandwidthBudget
PerDeviceProfile
ActiveDevicePriority
BrowserSubscriptionState
```

Pseudo:

```go
func (c *ProfileController) Resolve(d Device, selected bool) Profile {
    if selected {
        return d.BestActiveProfile()
    }

    if c.networkPressure.High() {
        return ThumbEco
    }

    return ThumbStandard
}
```

---

## 4. Browser subscription controller

```text
SELECTED
→ ACTIVE stream

VISIBLE TILE
→ THUMB_STD

NEAR VIEWPORT
→ THUMB_ECO

OFFSCREEN
→ pause / very-low-rate
```

---

## 5. MVP acceptance

[Inference] Targets:

```text
Devices online: 30

Control master:
1

Followers:
29

Thumbnail:
15 FPS baseline

Selected:
30 FPS baseline

60 FPS:
supported phones only

Command loss:
0 for DOWN/UP/KEY

MOVE:
latest-wins

UI:
no long-task >50ms during normal interaction

Browser:
no uncontrolled memory growth

Server:
no per-frame INFO logging
```

---

# X. PHASE 6 — SYNCHRONIZED 1 → 20–30 CONTROL

**Trạng thái:** ⚪ TODO

## 1. Clock synchronization

Each APK:

```text
server timestamp request
       ↓
round trip
       ↓
offset estimator
       ↓
monotonic offset
```

Do not use wall-clock `Date.now()` semantics alone.

---

## 2. Sequence

Every command:

```text
group_id
sequence
command_id
execute_at
```

APK stores:

```text
lastAcceptedSequence
```

Reject:

```text
sequence <= lastAcceptedSequence
```

where protocol semantics require strict ordering.

---

## 3. Sync graph

```text
Pointer event
     │
     ▼
NormalizedInput
     │
     ▼
Control Gateway
     │
     ▼
CommandCoordinator
     │
     ├── seq=12031
     ├── executeAt=T+20ms
     │
     ▼
Fanout
 ┌───┼────┬────┬───────────┐
 ▼   ▼    ▼    ▼           ▼
P1  P2   P3   P4          P30
 │   │    │    │           │
queue to executeAt          │
 └───┴────┴────┴───────────┘
             │
             ▼
        Accessibility
```

---

## 4. Failure rules

### a. Lost MOVE

Safe to replace with newest MOVE.

### b. Lost UP

Not acceptable.

Require:

```text
reliable delivery
timeout
release watchdog
```

### c. Device delayed

Do not delay 29 healthy phones indefinitely.

Device marked:

```text
sync_degraded
```

---

## 5. Metrics

```text
command_created_at
gateway_received_at
device_received_at
scheduled_execute_at
dispatch_called_at
gesture_callback_at
```

Calculate:

```text
network delay
queue delay
execution delay
group skew
```

---

# XI. BACKEND NON-NEGOTIABLE RULES

**Trạng thái:** 🟦 LOCKED

## 1. Separation

Never:

```text
WebSocket handler
  ├── DB queries
  ├── control policy
  ├── media handling
  └── logging everything
```

Instead:

```text
Transport
 ↓
Application Service
 ↓
Domain
 ↓
Adapter
```

---

## 2. No Base64 media

Forbidden:

```text
H264 → Base64 → JSON
```

Media is binary transport only.

---

## 3. Bounded queues

Every queue must declare:

```text
capacity
overflow behavior
priority
timeout
```

No unlimited channels.

---

## 4. Backpressure

Control:

```text
critical commands preserved
MOVE coalesced
```

Media:

```text
old video frames dropped
newest frame preferred
```

---

## 5. Logging

Do not:

```text
log every video frame
log every pointer MOVE at INFO
```

Use metrics counters/histograms.

---

## 6. Device ownership

One server node owns authoritative active session:

```text
deviceId
→ sessionId
→ nodeId
```

Reconnect invalidates stale connection.

---

## 7. Protocol version

Every handshake:

```text
protocolVersion
agentVersion
capabilitiesVersion
```

Server rejects incompatible protocol explicitly.

---

## 8. Idempotency

Commands with physical side effects carry:

```text
commandId
sequence
```

Never retry blindly without command identity.

---

# XII. PHASE 7 — RESILIENCE & OBSERVABILITY

**Trạng thái:** ⚪ TODO

## 1. Failure injection

Required tests:

```text
Wi-Fi interruption
WebSocket reconnect
server restart
APK process kill
screen rotation
MediaProjection stop
Accessibility restart
encoder restart
duplicate command
stale command
late UP
browser reload
```

---

## 2. Telemetry

Android:

```text
capture_fps
encode_fps
bitrate
dropped_frames
temperature
memory
control_queue_depth
control_latency
reconnect_count
```

Backend:

```text
connected_devices
commands_per_second
fanout_latency
group_skew
media_ingress
media_egress
ws_queue_depth
```

Frontend:

```text
rendered_tiles
visible_tiles
selected_fps
dropped_frames
long_tasks
memory estimate
```

---

## 3. Dashboard

```text
Grafana
├── Fleet health
├── Media
├── Control latency
├── Synchronization
└── Errors
```

---

# XIII. PHASE 8 — 50–100 PHONE SCALE

**Trạng thái:** ⚪ TODO

Không mở phase này trước khi 30-phone gate ổn định.

## 1. Browser

Mandatory:

```text
virtualized grid
visibility-based subscriptions
offscreen unsubscribe
```

---

## 2. Backend

Introduce:

```text
Gateway Node
Media Node
Control ownership
```

```text
Load Balancer
     │
 ┌───┴────┐
 ▼        ▼
GW1      GW2
 │        │
 └───┬────┘
     ▼
shared presence
```

---

## 3. Stream modes

```text
0–30:
THUMB_STD

30–60:
THUMB_ECO / THUMB_STD

60–100:
visibility dependent
```

Target 10–25 FPS becomes configurable, not universal.

---

# XIV. PHASE 9 — 100–300+ PHONE SCALE

**Trạng thái:** ⚪ TODO

At this stage browser should not decode hundreds of independent streams continuously.

## 1. Mosaic strategy

```text
100 device streams
       │
       ▼
Media workers
       │
       ▼
Mosaic compositor
       │
       ├── Page 1: 25 phones
       ├── Page 2: 25 phones
       ├── Page 3: 25 phones
       └── Page 4: 25 phones
```

Browser:

```text
1 mosaic stream
+
1 selected stream
```

---

## 2. Interaction overlay

```text
mosaic video
   │
   ├─ logical cell device01
   ├─ logical cell device02
   ├─ ...
   └─ logical cell device25
```

Click cell:

```text
cell 13
  ↓
deviceId
  ↓
open active stream
```

---

## 3. Distributed services

Only here consider:

```text
NATS
Redis
multiple media nodes
multiple gateway nodes
```

Not in initial MVP.

---

# XV. INITIAL PERFORMANCE BUDGET

**Trạng thái:** 🟡 VALIDATE

## 1. 30 phones

[Inference]

Assume thumbnail average:

```text
200 kbps × 29
= 5.8 Mbps
```

Selected:

```text
~2.5 Mbps
```

Ingress:

```text
~8.3 Mbps
```

A single viewer egress roughly similar plus protocol overhead.

This leaves room below 50 Mbps.

Actual content complexity, hardware encoders and network behavior must be measured.

---

## 2. Latency priorities

Priority order:

```text
P0 control latency
P1 control synchronization
P2 selected video latency
P3 thumbnail FPS
P4 thumbnail image quality
```

If network pressure occurs:

```text
reduce thumbnail bitrate
    ↓
reduce thumbnail resolution
    ↓
reduce offscreen FPS
```

Never sacrifice control responsiveness first.

---

# XVI. UI/UX QUALITY GATE

**Trạng thái:** 🟦 LOCKED

UI/UX Pro Max prioritizes accessibility, interaction, performance and responsive behavior, including list virtualization/main-thread budgeting guidance. 

Before any frontend phase can become 🟢:

## 1.

- [ ] Device state readable without relying on color.
- [ ] Focus states visible.
- [ ] Keyboard navigation works.
- [ ] Touch/click targets ≥44px where appropriate.
- [ ] Grid is virtualized.
- [ ] No horizontal overflow.
- [ ] No heavy animation on live tiles.
- [ ] Layout tested at 1366, 1440, 1920 widths.
- [ ] 30 devices do not cause layout thrash.
- [ ] Selected device visually obvious.
- [ ] Sync master visually obvious.
- [ ] Sync followers count always visible.
- [ ] Destructive controls require intentional interaction.
- [ ] Loading/reconnecting/offline states distinct.

---

# XVII. ANDROID QUALITY GATE

**Trạng thái:** ⚪ TODO

Before Agent phase becomes 🟢:

## 1. Lifecycle

- [ ] Android 8 physical.
- [ ] Android 9 physical.
- [ ] Android 10 physical.
- [ ] app process killed.
- [ ] network reconnect.
- [ ] screen rotate.
- [ ] screen off/on.
- [ ] Accessibility interrupted.

## 2. Control

- [ ] tap.
- [ ] long press.
- [ ] continuous swipe.
- [ ] rapid swipe.
- [ ] back.
- [ ] home.
- [ ] recents.
- [ ] 30-target fanout.

## 3. Media

- [ ] 30 FPS.
- [ ] profile downgrade.
- [ ] profile upgrade.
- [ ] orientation.
- [ ] encoder recovery.
- [ ] no accumulating frame queue.

---

# XVIII. BACKEND QUALITY GATE

**Trạng thái:** ⚪ TODO

- [ ] Race detector clean.
- [ ] bounded memory under load.
- [ ] 30 persistent devices.
- [ ] 30 media sessions.
- [ ] 30-target command broadcast.
- [ ] duplicate command test.
- [ ] stale session test.
- [ ] gateway restart test.
- [ ] no unbounded goroutines.
- [ ] no unbounded Go channels.
- [ ] no media Base64.
- [ ] structured logging.
- [ ] Prometheus metrics.

---

# XIX. DEVELOPMENT ORDER — KHÔNG ĐƯỢC ĐỔI

```text
PHASE 0
Architecture/spec
       │
       ▼
PHASE 1
APK foundation
       │
       ▼
PHASE 2
1-device control
       │
       ▼
PHASE 3
1-device video
       │
       ▼
PHASE 4
Web UI
       │
       ▼
5 DEVICES
       │
       ▼
PHASE 5
20–30 devices
       │
       ▼
PHASE 6
sync correctness
       │
       ▼
PHASE 7
failure injection
       │
       ▼
50 DEVICES
       │
       ▼
100 DEVICES
       │
       ▼
MOSAIC / 300+
```

Không:

```text
build 300-device architecture
before
1-device vertical slice works
```

---

# XX. FIRST VERTICAL SLICE — CODE SƯỜN PHẢI XÂY ĐẦU TIÊN

**Trạng thái:** ⚪ TODO

```text
Browser
   │
   │ pointerdown
   ▼
CoordinateMapper
   │
   │ protobuf command
   ▼
Go Control Gateway
   │
   ▼
Android ControlClient
   │
   ▼
CommandQueue
   │
   ▼
AccessibilityExecutor
   │
   ▼
Android screen
   │
   │ MediaProjection
   ▼
WebRTC
   │
   ▼
Browser Viewer
```

Đây phải là first end-to-end milestone.

---

# XXI. FIRST FILES TO CREATE

## 1. Android

```text
DeviceIdentity.kt
DeviceCapabilities.kt
ControlClient.kt
CommandQueue.kt
CommandScheduler.kt
InputExecutor.kt
FamerProAccessibilityService.kt
CaptureController.kt
RtcPublisher.kt
StreamProfileManager.kt
TelemetryCollector.kt
```

## 2. Backend

```text
cmd/server/main.go

internal/device/session.go
internal/device/registry.go

internal/control/protocol.go
internal/control/hub.go
internal/control/coordinator.go
internal/control/group.go
internal/control/clock.go

internal/signaling/service.go
internal/media/service.go
```

## 3. Web

```text
App.tsx

features/device-grid/DeviceGrid.tsx
features/device-grid/DeviceTile.tsx

features/viewer/ActiveViewer.tsx

features/control/PointerController.ts
features/control/CoordinateMapper.ts

features/sync/SyncPanel.tsx

stores/deviceStore.ts
stores/syncStore.ts
stores/layoutStore.ts
```

---

# XXII. DEFINITION OF “MƯỢT”

Không dùng cảm nhận đơn thuần.

Một build chỉ được gọi là **Smooth Candidate** nếu có measurement.

[Inference] Initial thresholds:

```text
CONTROL
input → APK dispatch:
P95 <= 30 ms LAN

GROUP CONTROL
30-phone dispatch skew:
P95 <= 15 ms

SELECTED VIDEO
glass-to-glass:
P95 <= 120 ms

THUMBNAIL
15 FPS baseline:
>= 95% expected frames over 10 min

WEB
normal interaction:
no recurring >50ms main-thread long task

MEMORY
no monotonic growth over 4h

NETWORK
initial 30-phone configuration:
target comfortably <50 Mbps
```

Nếu một metric fail:

```text
status = 🟡
```

không phải 🟢.

---

# XXIII. PHASE STATUS AT BLUEPRINT CREATION

| Phase | Status | Meaning |
|---|---|---|
| Source review: SocMTool | 🟢 | inspected |
| Source review: Solumate | 🟢 | inspected |
| Source review: OpenDroid | 🟢 | inspected |
| UI/UX rules reference | 🟢 | inspected |
| Architecture selection | 🟦 | locked proposal |
| Repository skeleton | ⚪ | not created |
| Android Agent | ⚪ | not implemented |
| Control Plane | ⚪ | not implemented |
| Media Plane | ⚪ | not implemented |
| React Console | ⚪ | not implemented |
| 5-device E2E | ⚪ | not tested |
| 20–30 device test | ⚪ | not tested |
| Sync benchmark | ⚪ | not tested |
| Failure injection | ⚪ | not tested |
| 50-device scale | ⚪ | future |
| 100+ scale | ⚪ | future |
| Mosaic 100–300+ | ⚪ | future |

---

# XXIV. FINAL ARCHITECTURAL RULE

FamerPro không phải:

```text
SocMTool
+ nicer UI
```

và cũng không phải:

```text
stream-phonefarm-solumate
- ADB
+ APK
```

FamerPro phải là:

```text
       SocMTool concept
 APK-managed cloud phone
             +
 Solumate interaction UX
 grid / viewer / sync
             +
 OpenDroid Android structure
 lifecycle / DI / tests
             +
 new realtime architecture
 WebRTC + Go control plane
             =
          FamerPro
```

Target đầu tiên:

```text
20–30 PHONES
│
├── persistent APK connection
├── perceptually instant control
├── 1 → 20–30 synchronized control
├── 10–25 FPS configurable thumbnails
├── selected 30 FPS baseline
├── selected 60 FPS where validated
├── configurable view size
├── configurable encoded stream size
└── network-aware adaptive profiles
```

Chỉ sau khi gate này 🟢 mới mở thiết kế vận hành 50–300+ phone.


```
yêu cầu ban đầu:

Mục tiêu
50 devices
├── thumbnail: 15-25 Fps
├── selected: 30–60 FPS
├── control broadcast: 1 → 20-50 thiết bị đồng bộ
└── bandwidth target: <50 Mbps
Có thể điều chỉnh kích thước màn hình điều khiển và màn hình thumbnail 
Cho tôi đề xuất để có thể tối ưu mượt mà về hiệu năng có thể vận hành lên tới vài trăm phone
Dựa vào source git Msoctool , và view hiển thị + control tương tự git này : https://github.com/tcandt/stream-phonefarm-solumate phát triển lên apk mới phù hợp với hệ thống từ Android 8 -> Android 10 cho Android room gốc và Room mod stock không sử dụng root
Chỉ vận hành nội bộ không kinh doanh hay public
Cho tôi codegragh và mapping chi tiết lộ trình triển khai
Lưu ý stream-phonefarm-solumate -> sử dụng adb/usb cho ios / android
Socmtool sử dụng cloud có cài apk nên cả 2 khác biệt
Tôi muốn sử dụng khung view của stream-phonefarm-solumate và ý tưởng apk của socmtool để tuỳ biến lại app apk trong dự án mới này
Dự án có tên : FamerPro

git app apk tham khảo : https://github.com/nmt28tik-gif/SocMTool

Viết cho tôi plan blueprint từng phần chi tiết từng phần/phase cụ thể , từng mục I , 1 , a chi tiết
Yêu cầu phải viết mapping codegrapgh cụ thể từng phase , phần nào xong đánh màu xanh để phân biệt 
Mục tiêu sẽ là 20 - 30 Phone cho ban đầu với mượt mà nhất với độ trễ trên thiết bị gần như bằng 0 , và sẽ thiết lập thêm số lượng lớn phone hiển thị dạng thumble fps từ 10-25 Fps về sau
Ngôn ngữ sử dụng cho frontend / backend : go / rust / typescript / reactjs / nodejs / python / Vue ,… tuỳ chọn nếu phù hợp với dự án
Khung sườn và apk mẫu tham khảo đã có , cần dựng khung mẫu và code sườn mẫu hướng dẫn trong plan blueprint 
Thêm các rules yêu cầu về thiết kế frontend / backend chuẩn chỉnh / tránh lan man sai lệch
Frontend : https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Với skill thiết kế apk có github : https://github.com/yashab-cyber/opendroid cần tham khảo thêm git này
```
