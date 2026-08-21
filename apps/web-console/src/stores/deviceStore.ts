import { create } from "zustand";

export type DeviceConnection = "online" | "waiting" | "offline" | "error";
export type DeviceTransport = "APK" | "USB" | "WIFI";

export type Device = {
  id: string;
  index: number;
  name: string;
  model: string;
  androidApi: number;
  connection: DeviceConnection;
  transport: DeviceTransport;
  readiness: "v2" | "setup" | "degraded";
  streamProfile: "THUMB_STD" | "ACTIVE" | "ACTIVE_60" | "PAUSED";
  fps: number;
  bitrateKbps: number;
  accessibility: boolean;
  capture: boolean;
  latencyMs: number;
  group: string;
};

export type DeviceSession = {
  deviceId: string;
  sessionId: string;
  nodeId: string;
  protocolVersion: string;
  agentVersion: string;
  connectedAt: string;
  lastHeartbeatAt: string;
  online: boolean;
};

const statuses: DeviceConnection[] = [
  "online",
  "online",
  "waiting",
  "online",
  "online",
  "error",
  "online",
  "offline",
];

export const mockDevices: Device[] = Array.from({ length: 30 }, (_, idx) => {
  const index = idx + 1;
  const connection = statuses[idx % statuses.length];
  const active = index === 4 || index === 11;

  return {
    id: `device-${String(index).padStart(2, "0")}`,
    index,
    name: `emulator-${5552 + index * 2}`,
    model: index % 3 === 0 ? "Pixel 6" : "Google sdk_gphone16k_x86_64",
    androidApi: index % 4 === 0 ? 29 : 37,
    connection,
    transport: index % 5 === 0 ? "WIFI" : index % 2 === 0 ? "USB" : "APK",
    readiness: connection === "error" ? "degraded" : connection === "waiting" ? "setup" : "v2",
    streamProfile: active ? "ACTIVE" : connection === "offline" ? "PAUSED" : "THUMB_STD",
    fps: active ? 30 : connection === "waiting" ? 0 : 15 + (index % 4) * 2,
    bitrateKbps: active ? 2400 : 180 + (index % 5) * 40,
    accessibility: connection !== "offline" && connection !== "waiting",
    capture: connection === "online",
    latencyMs: 12 + (index % 7) * 4,
    group: index <= 10 ? "room-a" : index <= 20 ? "room-b" : "room-c",
  };
});

type DeviceState = {
  devices: Device[];
  selectedDeviceId: string;
  filter: "all" | "apk" | "usb" | "wifi";
  selectDevice: (id: string) => void;
  setFilter: (filter: DeviceState["filter"]) => void;
  mergeSessions: (sessions: DeviceSession[]) => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: mockDevices,
  selectedDeviceId: "device-04",
  filter: "all",
  selectDevice: (id) => set({ selectedDeviceId: id }),
  setFilter: (filter) => set({ filter }),
  mergeSessions: (sessions) =>
    set((state) => {
      const byId = new Map(state.devices.map((device) => [device.id, device]));
      for (const [idx, session] of sessions.entries()) {
        const existing = byId.get(session.deviceId);
        byId.set(session.deviceId, {
          id: session.deviceId,
          index: existing?.index ?? idx + 1,
          name: existing?.name ?? session.deviceId,
          model: existing?.model ?? "Android device",
          androidApi: existing?.androidApi ?? 0,
          connection: session.online ? "online" : "offline",
          transport: "APK",
          readiness: session.protocolVersion ? "v2" : "setup",
          streamProfile: existing?.streamProfile ?? "THUMB_STD",
          fps: existing?.fps ?? 15,
          bitrateKbps: existing?.bitrateKbps ?? 220,
          accessibility: existing?.accessibility ?? false,
          capture: existing?.capture ?? false,
          latencyMs: existing?.latencyMs ?? 0,
          group: existing?.group ?? "live",
        });
      }
      return { devices: Array.from(byId.values()).sort((left, right) => left.index - right.index) };
    }),
}));

export function getConnectionLabel(connection: DeviceConnection) {
  switch (connection) {
    case "online":
      return "Online";
    case "waiting":
      return "Waiting";
    case "offline":
      return "Offline";
    case "error":
      return "Error";
  }
}
