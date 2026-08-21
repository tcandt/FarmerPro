import { create } from "zustand";

type LayoutState = {
  tileWidth: number;
  tileHeight: number;
  fps: number;
  bitrateKbps: number;
  streamWidth: number;
  setTileWidth: (value: number) => void;
  setFps: (value: number) => void;
  setBitrateKbps: (value: number) => void;
  setStreamWidth: (value: number) => void;
  reset: () => void;
};

const defaults = {
  tileWidth: 300,
  tileHeight: 600,
  fps: 20,
  bitrateKbps: 524,
  streamWidth: 500,
};

const getTileHeight = (tileWidth: number) => Math.round(tileWidth * 2);

export const useLayoutStore = create<LayoutState>((set) => ({
  ...defaults,
  setTileWidth: (tileWidth) => set({ tileWidth, tileHeight: getTileHeight(tileWidth) }),
  setFps: (fps) => set({ fps }),
  setBitrateKbps: (bitrateKbps) => set({ bitrateKbps }),
  setStreamWidth: (streamWidth) => set({ streamWidth }),
  reset: () => set(defaults),
}));
