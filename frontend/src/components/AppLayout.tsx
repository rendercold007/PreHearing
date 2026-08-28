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
    <div className="min-h-screen">
      {/* Kept mounted so it can animate out; visibility:hidden takes it out of the tab
          order while closed, delayed so the slide-out finishes first. */}
      <aside
        className={`fixed top-0 left-0 z-30 flex h-screen w-[236px] flex-col gap-7 overflow-hidden border-r border-line bg-base px-4 py-6 motion-reduce:!transition-none ${
          open
            ? "visible translate-x-0 [transition:transform_0.24s_ease,visibility_0s]"
            : "invisible -translate-x-full [transition:transform_0.24s_ease,visibility_0s_linear_0.24s]"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <button
            type="button"
            className="grid h-[1.9rem] w-[1.9rem] shrink-0 cursor-pointer place-items-center rounded-lg border border-line bg-transparent text-[0.95rem] leading-none text-muted transition-colors hover:border-line-hover hover:bg-surface-hover hover:text-accent"
            aria-label="Close sidebar"
            title="Close sidebar"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                `flex items-center gap-[0.7rem] rounded-[10px] px-3 py-[0.6rem] text-[0.94rem] font-medium no-underline transition-colors ${
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-hover hover:text-fg"
                }`
              }
            >
              <span className="w-[1.1rem] text-center text-[0.95rem]" aria-hidden="true">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main
        className={`min-w-0 pt-5 pr-6 pb-16 transition-[padding-left] duration-[240ms] motion-reduce:transition-none ${
          open ? "pl-[260px] max-[860px]:pl-6" : "pl-6"
        }`}
      >
        <div className={`mb-3 flex min-h-[2.5rem] items-center ${open ? "justify-end" : "justify-between"}`}>
          {!open && (
            <button
              type="button"
              className="grid h-[2.2rem] w-[2.2rem] cursor-pointer place-items-center rounded-lg border border-line bg-transparent text-base leading-none text-muted transition-colors hover:border-line-hover hover:bg-surface-hover hover:text-accent"
              aria-label="Open sidebar"
              title="Open sidebar"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
          )}
          <UserMenu />
        </div>
        <div className="mx-auto max-w-[960px]">{children}</div>
      </main>
    </div>
  );
}
