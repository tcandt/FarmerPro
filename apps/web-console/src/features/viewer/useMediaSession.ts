import { useEffect, useState } from "react";
import type { Device } from "../../stores/deviceStore";

type MediaProfile = {
  name: string;
  width: number;
  fps: number;
  bitrateKbps: number;
  selected: boolean;
};

type SignalingSession = {
  sessionId: string;
  deviceId: string;
  profile: string;
  state: "negotiating" | "ready" | "closed";
  createdAt: string;
  expiresAt: string;
};

type MediaSessionState = {
  status: "idle" | "negotiating" | "ready" | "error";
  profile: MediaProfile | null;
  session: SignalingSession | null;
  error: string | null;
};

export function useMediaSession(device: Device, enabled: boolean) {
  const [state, setState] = useState<MediaSessionState>({
    status: "idle",
    profile: null,
    session: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setState((current) => ({ ...current, status: "negotiating", error: null }));

    async function negotiate() {
      try {
        const profile = await getJSON<MediaProfile>(
          `/v1/media?selected=true&supports60=${device.streamProfile === "ACTIVE_60"}`,
          controller.signal,
        );
        const session = await postJSON<SignalingSession>(
          "/v1/signaling",
          { deviceId: device.id, profile: profile.name },
          controller.signal,
        );
        setState({ status: session.state === "ready" ? "ready" : "negotiating", profile, session, error: null });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            profile: null,
            session: null,
            error: error instanceof Error ? error.message : "Unable to create media session",
          });
        }
      }
    }

    void negotiate();
    return () => controller.abort();
  }, [device.id, device.streamProfile, enabled]);

  return state;
}

async function getJSON<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function getApiBase() {
  const configured = import.meta.env.VITE_CORE_API_URL as string | undefined;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return `${window.location.protocol}//${window.location.hostname}:8080`;
}
