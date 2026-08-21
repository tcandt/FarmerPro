import { Search } from "lucide-react";
import type { CSSProperties } from "react";
import { DeviceTile } from "./DeviceTile";
import { useDeviceStore } from "../../stores/deviceStore";
import { useLayoutStore } from "../../stores/layoutStore";

export function DeviceGrid({
  onViewDevice,
  viewingDeviceId,
}: {
  onViewDevice: (deviceId: string) => void;
  viewingDeviceId: string | null;
}) {
  const devices = useDeviceStore((state) => state.devices);
  const filter = useDeviceStore((state) => state.filter);
  const tileWidth = useLayoutStore((state) => state.tileWidth);
  const tileHeight = useLayoutStore((state) => state.tileHeight);
  const tileScale = tileWidth / 300;

  const filteredDevices = devices.filter((device) => {
    if (filter === "all") return true;
    return device.transport.toLowerCase() === filter;
  });

  return (
    <section className="device-grid-panel" aria-label="Device grid">
      <div className="grid-header">
        <div>
          <span className="section-kicker">Device grid</span>
          <h2>{filteredDevices.length} phones visible</h2>
        </div>
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search devices, groups..." aria-label="Search devices" />
        </label>
      </div>

      <div
        className="device-grid"
        style={{
          gridTemplateColumns: `repeat(auto-fill, ${tileWidth}px)`,
          "--tile-height": `${tileHeight}px`,
          "--tile-scale": tileScale,
        } as CSSProperties & Record<"--tile-height", string> & Record<"--tile-scale", number>}
      >
        {filteredDevices.map((device) => (
          <DeviceTile
            key={device.id}
            device={device}
            isViewing={viewingDeviceId === device.id}
            onViewDevice={onViewDevice}
          />
        ))}
      </div>
    </section>
  );
}
