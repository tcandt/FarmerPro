import { create } from "zustand";

type SyncState = {
  enabled: boolean;
  masterDeviceId: string;
  followerIds: string[];
  setEnabled: (enabled: boolean) => void;
  setMaster: (id: string) => void;
  toggleFollower: (id: string) => void;
  selectFollowers: (ids: string[]) => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  enabled: false,
  masterDeviceId: "device-04",
  followerIds: ["device-01", "device-03", "device-05", "device-07"],
  setEnabled: (enabled) => set({ enabled }),
  setMaster: (masterDeviceId) => set({ masterDeviceId }),
  toggleFollower: (id) =>
    set((state) => ({
      followerIds: state.followerIds.includes(id)
        ? state.followerIds.filter((followerId) => followerId !== id)
        : [...state.followerIds, id],
    })),
  selectFollowers: (followerIds) => set({ followerIds }),
}));
