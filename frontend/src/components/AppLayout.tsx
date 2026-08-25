import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

const NAV = [
  { to: "/app", label: "Analyze", icon: "✎" },
  { to: "/cases", label: "Case history", icon: "🗂" },
];

const SIDEBAR_KEY = "prehearing_sidebar_open";

function storedOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "0";
  } catch {
    return true;
  }
}

/** Shell for every signed-in page: sidebar nav on the left, account menu top right. */
export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(storedOpen);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
    } catch {
      // A browser with site data blocked still gets a working sidebar, just no memory of it.
    }
  }, [open]);

  return (
    <div className={`app-shell${open ? "" : " sidebar-closed"}`}>
      {/* Kept mounted so its width can animate out; visibility:hidden takes it out of
          the tab order while closed. */}
      <aside className={`app-sidebar${open ? "" : " closed"}`} aria-hidden={!open}>
        <div className="sidebar-head">
          <Logo />
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Close sidebar"
            title="Close sidebar"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span className="sidebar-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <div className="app-topbar">
          {!open && (
            <button
              type="button"
              className="sidebar-open-button"
              aria-label="Open sidebar"
              title="Open sidebar"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
          )}
          <UserMenu />
        </div>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
