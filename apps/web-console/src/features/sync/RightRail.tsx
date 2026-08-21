import {
  ArrowLeft,
  Camera,
  Check,
  Home,
  Menu,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Power,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type React from "react";
import { useDeviceStore } from "../../stores/deviceStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { useSyncStore } from "../../stores/syncStore";

export function RightRail({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const devices = useDeviceStore((state) => state.devices);
  const filter = useDeviceStore((state) => state.filter);
  const setFilter = useDeviceStore((state) => state.setFilter);
  const tileWidth = useLayoutStore((state) => state.tileWidth);
  const tileHeight = useLayoutStore((state) => state.tileHeight);
  const fps = useLayoutStore((state) => state.fps);
  const bitrateKbps = useLayoutStore((state) => state.bitrateKbps);
  const streamWidth = useLayoutStore((state) => state.streamWidth);
  const setTileWidth = useLayoutStore((state) => state.setTileWidth);
  const setFps = useLayoutStore((state) => state.setFps);
  const setBitrateKbps = useLayoutStore((state) => state.setBitrateKbps);
  const setStreamWidth = useLayoutStore((state) => state.setStreamWidth);
  const reset = useLayoutStore((state) => state.reset);
  const syncEnabled = useSyncStore((state) => state.enabled);
  const setSyncEnabled = useSyncStore((state) => state.setEnabled);
  const followerIds = useSyncStore((state) => state.followerIds);
  const toggleFollower = useSyncStore((state) => state.toggleFollower);
  const selectFollowers = useSyncStore((state) => state.selectFollowers);

  return (
    <aside className={`right-rail ${collapsed ? "collapsed" : ""}`} aria-label="Console controls">
      <button
        className="collapse-button"
        type="button"
        aria-label={collapsed ? "Expand controls" : "Collapse controls"}
        title={collapsed ? "Expand controls" : "Collapse controls"}
        onClick={onToggleCollapsed}
      >
        {collapsed ? <PanelRightOpen size={18} strokeWidth={1.8} /> : <PanelRightClose size={18} strokeWidth={1.8} />}
      </button>

      {collapsed ? (
        <div className="rail-mini-actions" aria-label="Collapsed quick controls">
          <QuickButton label="Power" icon={<Power size={17} strokeWidth={1.8} />} />
          <QuickButton label="Back" icon={<ArrowLeft size={17} strokeWidth={1.8} />} />
          <QuickButton label="Home" icon={<Home size={17} strokeWidth={1.8} />} />
          <QuickButton label="Mute" icon={<VolumeX size={17} strokeWidth={1.8} />} />
          <span className="rail-mini-count">{followerIds.length}</span>
        </div>
      ) : null}

      <Panel title="Tile size">
        <SliderRow label="Large size" value={tileWidth} min={150} max={420} step={5} unit="px" onChange={setTileWidth} />
        <strong className="tile-height-label">Tile height: {tileHeight}px (auto from width)</strong>
      </Panel>

      <Panel title="Stream config">
        <SliderRow label="Bitrate" value={bitrateKbps} min={160} max={2500} step={64} unit="kbps" onChange={setBitrateKbps} />
        <SliderRow label="FPS" value={fps} min={10} max={60} step={5} unit="fps" onChange={setFps} />
        <SliderRow label="Stream width" value={streamWidth} min={288} max={1080} step={24} unit="px" onChange={setStreamWidth} />
        <label className="select-row">
          <span>Rotation lock</span>
          <select defaultValue="auto" aria-label="Rotation lock">
            <option value="auto">Auto</option>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
      </Panel>

      <Panel
        title="Quick controls"
        action={
          <button className="panel-action" type="button" onClick={reset}>
            Reset to default
          </button>
        }
      >
        <div className="quick-grid">
          <QuickButton label="Power" icon={<Power size={18} />} />
          <QuickButton label="Volume up" icon={<Volume2 size={18} />} />
          <QuickButton label="Volume down" icon={<Volume1 size={18} />} />
          <QuickButton label="Mute" icon={<VolumeX size={18} />} />
          <QuickButton label="Back" icon={<ArrowLeft size={18} />} />
          <QuickButton label="Home" icon={<Home size={18} />} />
          <QuickButton label="Recent apps" icon={<Menu size={18} />} />
          <QuickButton label="Screenshot" icon={<Camera size={18} />} />
        </div>
      </Panel>

      <Panel title="Sync devices">
        <div className="sync-row">
          <span>{syncEnabled ? "Sync on" : "Sync off"}</span>
          <button className={`tiny-toggle ${syncEnabled ? "on" : ""}`} type="button" onClick={() => setSyncEnabled(!syncEnabled)}>
            {syncEnabled ? "On" : "Off"}
          </button>
        </div>
        <p className="panel-note">
          {syncEnabled ? `${followerIds.length} followers selected for group command fanout` : "Turn on sync to select devices"}
        </p>
      </Panel>

      <Panel title="Device tags">
        <div className="segmented">
          {(["all", "apk", "usb", "wifi"] as const).map((item) => (
            <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className="select-all"
          type="button"
          onClick={() => selectFollowers(devices.filter((device) => device.connection === "online").map((device) => device.id))}
        >
          <Check size={16} />
          Select online ({devices.filter((device) => device.connection === "online").length})
        </button>
        <div className="device-list device-number-list">
          {[...devices].sort((left, right) => left.index - right.index).map((device) => {
            const checked = followerIds.includes(device.id);
            return (
              <button
                key={device.id}
                className={`device-row device-number-row ${checked ? "checked" : ""}`}
                type="button"
                aria-label={`${checked ? "Deselect" : "Select"} device ${String(device.index).padStart(2, "0")} ${device.name}`}
                title={device.name}
                onClick={() => toggleFollower(device.id)}
              >
                <span>{String(device.index).padStart(2, "0")}</span>
                {checked && <Check size={13} />}
              </button>
            );
          })}
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rail-panel">
      <div className="rail-panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-row">
      <span>{label}</span>
      <button
        className="step-button"
        type="button"
        aria-label={`Decrease ${label}`}
        title={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus size={13} strokeWidth={2} />
      </button>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <button
        className="step-button"
        type="button"
        aria-label={`Increase ${label}`}
        title={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus size={13} strokeWidth={2} />
      </button>
      <strong>{value.toLocaleString()} {unit}</strong>
    </label>
  );
}

function QuickButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label}>
      {icon}
    </button>
  );
}
