import { normalizePointerPoint, type NormalizedPoint } from "./CoordinateMapper";
import type React from "react";

export type PointerCommandType = "DOWN" | "MOVE" | "UP";

export type PointerCommand = {
  commandId: string;
  deviceId: string;
  type: PointerCommandType;
  point: NormalizedPoint;
  createdAt: number;
};

let sequence = 0;

export function createPointerCommand(
  type: PointerCommandType,
  deviceId: string,
  event: React.PointerEvent<HTMLElement>,
): PointerCommand {
  return {
    commandId: `ui-${Date.now()}-${sequence++}`,
    deviceId,
    type,
    point: normalizePointerPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()),
    createdAt: performance.now(),
  };
}
