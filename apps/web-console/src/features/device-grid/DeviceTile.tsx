import { Eye, Loader2, MousePointer2, RotateCw, Signal, WifiOff } from "lucide-react";
import type React from "react";
import { AndroidNav } from "./AndroidNav";
import { controlTransport } from "../control/ControlTransport";
import { createPointerCommand } from "../control/PointerController";
import { DeviceLiveScreen } from "../viewer/ActiveViewer";
import { getConnectionLabel, type Device } from "../../stores/deviceStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { useSyncStore } from "../../stores/syncStore";

export function DeviceTile({
  device,
  isViewing,
  onViewDevice,
}: {
  device: Device;
  isViewing: boolean;
  onViewDevice: (deviceId: string) => void;
}) {
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const selectDevice = useDeviceStore((state) => state.selectDevice);
  const masterDeviceId = useSyncStore((state) => state.masterDeviceId);
  const followerIds = useSyncStore((state) => state.followerIds);
  const syncEnabled = useSyncStore((state) => state.enabled);
  const selected = selectedDeviceId === device.id;
  const isMaster = masterDeviceId === device.id;
  const isFollower = followerIds.includes(device.id);

  const getTargets = () => {
    if (!syncEnabled || device.id !== masterDeviceId) {
      return [device.id];
    }
    return Array.from(new Set([device.id, ...followerIds]));
  };

  const sendPointer = (type: "DOWN" | "MOVE" | "UP", event: React.PointerEvent<HTMLElement>) => {
    if (isViewing) return;
    selectDevice(device.id);
    const command = createPointerCommand(type, device.id, event);
    controlTransport.sendPointer(command, {
      groupId: syncEnabled && device.id === masterDeviceId ? "sync-group" : undefined,
      targetDeviceIds: getTargets(),
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    sendPointer("DOWN", event);
  };

  return (
    <article className={`device-tile ${selected ? "selected" : ""} ${isMaster ? "master" : ""} ${isViewing ? "viewing" : ""}`}>
      <header className="tile-header">
        <div className="tile-identity">
          <span className="device-number">{String(device.index).padStart(2, "0")}</span>
          <span className="transport-badge">{device.transport}</span>
          {isMaster && <span className="role-badge">Main</span>}
          {isFollower && !isMaster && <span className="role-badge follower">Sync</span>}
        </div>
        <div className={`tile-telemetry ${device.connection}`}>
          <Signal size={13} />
          <span>{getConnectionLabel(device.connection)}</span>
          <strong>{device.fps}<em> fps</em></strong>
        </div>
        <div className="tile-actions">
          <button
            type="button"
            aria-label={`Open large viewer for ${device.name}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onViewDevice(device.id);
            }}
          >
            <Eye size={16} />
          </button>
          <button type="button" aria-label={`Restart stream for ${device.name}`}>
            <RotateCw size={16} />
          </button>
        </div>
      </header>

      <section
        className="tile-screen-wrap"
        onPointerDown={handlePointerDown}
        onPointerMove={(event) => {
          if (event.buttons > 0) sendPointer("MOVE", event);
        }}
        onPointerUp={(event) => {
          sendPointer("UP", event);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          sendPointer("UP", event);
        }}
      >
        {isViewing ? (
          <div className="tile-viewing-overlay">
            <MousePointer2 size={34} />
            <strong>Showing in viewer</strong>
            <span>Large control window is active</span>
          </div>
        ) : device.connection === "waiting" ? (
          <div className="waiting-screen">
            <Loader2 size={38} />
            <strong>Waiting for response</strong>
            <span>Agent reconnect handshake pending</span>
          </div>
        ) : device.connection === "offline" ? (
          <div className="waiting-screen offline">
            <WifiOff size={38} />
            <strong>Offline</strong>
            <span>Last heartbeat expired</span>
          </div>
        ) : (
          <DeviceLiveScreen device={device} />
        )}
      </section>

      <footer className="tile-footer">
        <AndroidNav />
      </footer>
    </article>
  );
}
