import { useEffect } from "react";
import { useDeviceStore, type DeviceSession } from "../../stores/deviceStore";

export function useDeviceSessions() {
  const mergeSessions = useDeviceStore((state) => state.mergeSessions);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`${getApiBase()}/v1/devices`);
        if (!response.ok) return;
        const sessions = (await response.json()) as DeviceSession[];
        if (!cancelled && sessions.length > 0) {
          mergeSessions(sessions);
        }
      } catch {
        // Keep mock devices available when the local core server is not running.
      }
    }

    void poll();
    const interval = window.setInterval(poll, 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [mergeSessions]);
}

function getApiBase() {
  const configured = import.meta.env.VITE_CORE_API_URL as string | undefined;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return `${window.location.protocol}//${window.location.hostname}:8080`;
}
