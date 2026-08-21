import { MonitorPlay, RotateCcw, Signal, Smartphone, Zap } from "lucide-react";
import type React from "react";
import { AndroidNav } from "../device-grid/AndroidNav";
import { createPointerCommand } from "../control/PointerController";
import type { Device } from "../../stores/deviceStore";

export function ActiveViewer({ device }: { device: Device }) {
  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    console.debug("normalized-control", createPointerCommand("DOWN", device.id, event));
  };

  return (
    <section className="active-viewer" aria-label="Selected device viewer">
      <div className="active-copy">
        <span className="section-kicker">Selected device</span>
        <h1>{String(device.index).padStart(2, "0")} - {device.name}</h1>
        <div className="viewer-metrics">
          <Metric icon={<Signal size={16} />} label="Profile" value={device.streamProfile} />
          <Metric icon={<Zap size={16} />} label="Control" value={`${device.latencyMs} ms`} />
          <Metric icon={<MonitorPlay size={16} />} label="Stream" value={`${device.fps} fps`} />
          <Metric icon={<Smartphone size={16} />} label="Android" value={`API ${device.androidApi}`} />
        </div>
      </div>

      <div className="selected-phone">
        <div className="phone-toolbar">
          <span className="device-number">{String(device.index).padStart(2, "0")}</span>
          <span className="transport-badge">{device.transport}</span>
          <button className="icon-button compact" type="button" aria-label="Restart stream">
            <RotateCcw size={16} />
          </button>
        </div>
        <article className="phone-screen active" onPointerDown={handlePointerDown}>
          <DeviceLiveScreen device={device} />
        </article>
        <AndroidNav />
      </div>
    </section>
  );
}

export function DeviceLiveScreen({ device }: { device: Device }) {
  if (device.index % 4 === 0) {
    return <DeviceHomeScreen device={device} />;
  }

  return <DeviceStatusScreen device={device} />;
}

export function DeviceStatusScreen({ device }: { device: Device }) {
  return (
    <div className="agent-screen">
      <div className="android-status">
        <span>10:47</span>
        <span>LTE Wi-Fi Battery</span>
      </div>
      <div className="agent-content">
        <header>
          <div>
            <h2>{device.model}</h2>
            <p>FamerPro Agent / Android {device.androidApi}</p>
          </div>
          <span className={`state-chip ${device.connection}`}>{device.connection}</span>
        </header>

        <section className="agent-card">
          <h3>Connection and identity</h3>
          <p>Agent ID: agt_{device.id.replace("device-", "")}b57</p>
          <p>Device ID: {device.id}</p>
          <p className="ok-line">WebSocket / Connected to Go gateway</p>
          <p className="ok-line">Heartbeat / HTTP 200 OK</p>
        </section>

        <section className="agent-card">
          <h3>Required for live view</h3>
          <div className="row">
            <span>MediaProjection</span>
            <strong>{device.capture ? "Ready" : "Inactive"}</strong>
          </div>
          <button className="agent-action" type="button">Start stream always ready</button>
          <p>Foreground Service: {device.capture ? "Running" : "Stopped"}</p>
        </section>

        <section className="agent-card">
          <h3>Required for remote control</h3>
          <div className="row">
            <span>Accessibility Service</span>
            <strong>{device.accessibility ? "Enabled" : "Needs setup"}</strong>
          </div>
          <div className="row">
            <span>FamerPro IME</span>
            <strong>{device.accessibility ? "Active" : "Inactive"}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}

function DeviceHomeScreen({ device }: { device: Device }) {
  const apps = ["Gmail", "YouTube", "Play Store", "Photos", "Calendar", "Camera", "Chrome", "Clock", "Contacts", "Drive", "Files", "Maps"];

  return (
    <div className="home-screen">
      <div className="android-status translucent">
        <span>11:31</span>
        <span>LTE Wi-Fi Battery</span>
      </div>
      <div className="home-wallpaper">
        <span className="home-date">Fri, Aug 21</span>
        <div className="home-grid">
          {apps.map((app, index) => (
            <div className="home-app" key={app}>
              <span style={{ ["--app-hue" as string]: `${(device.index * 31 + index * 24) % 360}deg` }} />
              <strong>{app}</strong>
            </div>
          ))}
        </div>
        <div className="search-pill">Google</div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
