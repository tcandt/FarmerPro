import {
  ArrowLeft,
  Camera,
  FileText,
  Home,
  Menu,
  Package,
  Power,
  Terminal,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Device } from "../../stores/deviceStore";
import { DeviceLiveScreen } from "./ActiveViewer";
import { useMediaSession } from "./useMediaSession";

type ViewerTab = "view" | "files" | "apps" | "shell";

export function DeviceViewerOverlay({ device, onClose }: { device: Device; onClose: () => void }) {
  const [tab, setTab] = useState<ViewerTab>("view");
  const media = useMediaSession(device, tab === "view");

  return (
    <div className="viewer-overlay" onMouseDown={onClose} role="presentation">
      <div className="viewer-panel-wrap" onMouseDown={(event) => event.stopPropagation()}>
        <section className="viewer-panel" aria-label={`Large viewer for ${device.name}`}>
          <header className="viewer-header">
            <div className="viewer-title">
              <strong>{device.name}</strong>
              <span>
                {device.connection === "online" ? "LIVE" : device.connection.toUpperCase()}
                {media.profile ? ` / ${media.profile.name} ${media.profile.fps}fps` : ""}
              </span>
            </div>
            <div className="viewer-tabs" role="tablist" aria-label="Viewer modes">
              <ViewerTabButton tab="view" active={tab === "view"} onClick={setTab} />
              <ViewerTabButton tab="files" active={tab === "files"} onClick={setTab} />
              <ViewerTabButton tab="apps" active={tab === "apps"} onClick={setTab} />
              <ViewerTabButton tab="shell" active={tab === "shell"} onClick={setTab} />
              <button className="viewer-close" type="button" aria-label="Close viewer" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className={`viewer-body ${tab === "view" ? "view-mode" : ""}`}>
            {tab === "view" ? (
              <div className="viewer-main">
                <div className="viewer-canvas-wrap">
                  <div className={`media-session-chip ${media.status}`}>
                    {media.status === "error" ? media.error : media.session?.sessionId ?? "Creating media session"}
                  </div>
                  <DeviceLiveScreen device={device} />
                </div>
                <ViewerActions />
              </div>
            ) : (
              <ViewerPlaceholder tab={tab} device={device} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ViewerTabButton({
  tab,
  active,
  onClick,
}: {
  tab: ViewerTab;
  active: boolean;
  onClick: (tab: ViewerTab) => void;
}) {
  const labels: Record<ViewerTab, string> = {
    view: "View",
    files: "Files",
    apps: "Apps",
    shell: "Shell",
  };

  return (
    <button className={`viewer-tab ${active ? "on" : ""}`} type="button" role="tab" aria-selected={active} onClick={() => onClick(tab)}>
      {labels[tab]}
    </button>
  );
}

function ViewerActions() {
  return (
    <div className="viewer-actions" aria-label="Viewer quick controls">
      <ViewerAction label="Power" icon={<Power size={20} />} />
      <ViewerAction label="Volume up" icon={<Volume2 size={20} />} />
      <ViewerAction label="Volume down" icon={<Volume1 size={20} />} />
      <ViewerAction label="Mute" icon={<VolumeX size={20} />} />
      <div className="viewer-action-sep" />
      <ViewerAction label="Back" icon={<ArrowLeft size={20} />} />
      <ViewerAction label="Home" icon={<Home size={20} />} />
      <ViewerAction label="Recent apps" icon={<Menu size={20} />} />
      <div className="viewer-action-sep" />
      <ViewerAction label="Screenshot" icon={<Camera size={20} />} />
    </div>
  );
}

function ViewerAction({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="viewer-action-btn" type="button" aria-label={label} title={label}>
      {icon}
    </button>
  );
}

function ViewerPlaceholder({ tab, device }: { tab: Exclude<ViewerTab, "view">; device: Device }) {
  const icon = tab === "files" ? <FileText size={28} /> : tab === "apps" ? <Package size={28} /> : <Terminal size={28} />;
  return (
    <div className="viewer-placeholder">
      {icon}
      <strong>{tab.toUpperCase()}</strong>
      <span>{device.name}</span>
      <p>APK transport hook placeholder for the next vertical slice.</p>
    </div>
  );
}
