import type { PointerCommand } from "./PointerController";

const CONTROL_TYPE = {
  DOWN: 1,
  MOVE: 2,
  UP: 3,
  BACK: 4,
  HOME: 5,
  RECENT: 6,
  KEY: 7,
  PROFILE_CHANGE: 8,
  POWER: 9,
  VOLUME_UP: 10,
  VOLUME_DOWN: 11,
  MUTE: 12,
} as const;

type ControlPayload = {
  commandId: string;
  deviceId: string;
  targetDeviceIds?: string[];
  groupId?: string;
  type: number;
  xNorm: number;
  yNorm: number;
  pointerId: number;
  createdAtMono: number;
};

type SendOptions = {
  deviceId?: string;
  targetDeviceIds?: string[];
  groupId?: string;
};

class ControlTransport {
  private socket: WebSocket | null = null;
  private queue: string[] = [];
  private reconnectTimer: number | null = null;

  sendPointer(command: PointerCommand, options: SendOptions = {}) {
    const payload: ControlPayload = {
      commandId: command.commandId,
      deviceId: command.deviceId,
      targetDeviceIds: options.targetDeviceIds,
      groupId: options.groupId,
      type: CONTROL_TYPE[command.type],
      xNorm: command.point.xNorm,
      yNorm: command.point.yNorm,
      pointerId: command.pointerId,
      createdAtMono: Math.round(command.createdAt * 1_000_000),
    };

    this.send(JSON.stringify(payload));
  }

  sendAction(type: keyof typeof CONTROL_TYPE, options: SendOptions = {}) {
    const deviceId = options.deviceId ?? options.targetDeviceIds?.[0] ?? "";
    if (!deviceId) return;

    const payload: ControlPayload = {
      commandId: `ui-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      deviceId,
      targetDeviceIds: options.targetDeviceIds,
      groupId: options.groupId,
      type: CONTROL_TYPE[type],
      xNorm: 0,
      yNorm: 0,
      pointerId: 0,
      createdAtMono: Math.round(performance.now() * 1_000_000),
    };

    this.send(JSON.stringify(payload));
  }

  private send(payload: string) {
    const socket = this.ensureSocket();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
      return;
    }

    this.queue.push(payload);
    if (this.queue.length > 256) {
      this.queue = this.queue.slice(-256);
    }
  }

  private ensureSocket() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      return this.socket;
    }

    this.socket = new WebSocket(getControlSocketUrl());
    this.socket.binaryType = "arraybuffer";
    this.socket.addEventListener("open", () => this.flush());
    this.socket.addEventListener("close", () => this.scheduleReconnect());
    this.socket.addEventListener("error", () => this.scheduleReconnect());
    return this.socket;
  }

  private flush() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    for (const payload of this.queue.splice(0)) {
      this.socket.send(payload);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer !== null) {
      return;
    }
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.socket = null;
      if (this.queue.length > 0) {
        this.ensureSocket();
      }
    }, 800);
  }
}

export const controlTransport = new ControlTransport();

function getControlSocketUrl() {
  const configured = import.meta.env.VITE_CONTROL_WS_URL as string | undefined;
  if (configured) {
    return configured;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8080/v1/control/browser`;
}
