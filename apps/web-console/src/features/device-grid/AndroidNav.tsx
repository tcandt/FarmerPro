import { ArrowLeft, Home, Menu } from "lucide-react";

export function AndroidNav() {
  return (
    <nav className="android-nav" aria-label="Android quick navigation">
      <button type="button" aria-label="Back">
        <ArrowLeft size={18} />
      </button>
      <button type="button" aria-label="Home">
        <Home size={18} />
      </button>
      <button type="button" aria-label="Recent apps">
        <Menu size={18} />
      </button>
    </nav>
  );
}
