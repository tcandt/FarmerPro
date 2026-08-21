import {
  Bell,
  Globe2,
} from "lucide-react";
import { useState } from "react";
import { DeviceGrid } from "../features/device-grid/DeviceGrid";
import { DeviceViewerOverlay } from "../features/viewer/DeviceViewerOverlay";
import { RightRail } from "../features/sync/RightRail";
import { useDeviceStore } from "../stores/deviceStore";
import { useSyncStore } from "../stores/syncStore";

export function App() {
  const [viewerDeviceId, setViewerDeviceId] = useState<string | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const devices = useDeviceStore((state) => state.devices);
  const syncEnabled = useSyncStore((state) => state.enabled);
  const followerCount = useSyncStore((state) => state.followerIds.length);
  const viewerDevice = viewerDeviceId ? devices.find((device) => device.id === viewerDeviceId) : null;

  return (
    <div className={`console-shell ${railCollapsed ? "rail-collapsed" : ""}`}>
      <div className="main-stage">
        <header className="topbar">
          <div className="brand-block">
            <img src="/famerpro-logo.png" alt="FamerPro" className="brand-logo" />
            <div className="brand-copy">
              <strong>FamerPro</strong>
              <span>APK Cloud Phone Console</span>
            </div>
          </div>

          <div className="top-actions">
            <button className="sync-toggle" type="button" aria-pressed={syncEnabled}>
              Sync <strong>{syncEnabled ? "On" : "Off"}</strong>
              <span>{followerCount} followers</span>
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="language-button" type="button">
              <Globe2 size={16} />
              EN
            </button>
          </div>
        </header>

        <section className="workbench">
          <DeviceGrid onViewDevice={setViewerDeviceId} viewingDeviceId={viewerDeviceId} />
        </section>
      </div>

      <RightRail collapsed={railCollapsed} onToggleCollapsed={() => setRailCollapsed((value) => !value)} />

      {viewerDevice ? (
        <DeviceViewerOverlay device={viewerDevice} onClose={() => setViewerDeviceId(null)} />
      ) : null}
    </div>
  );
}
