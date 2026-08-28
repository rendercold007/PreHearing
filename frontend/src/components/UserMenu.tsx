import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "./Avatar";

export function UserMenu() {
  const { email, name, isPaid, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!email) return null;

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="group cursor-pointer rounded-full border-none bg-transparent p-0 leading-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar email={email} name={name} paid={isPaid} />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 min-w-[220px] rounded-xl border border-line bg-surface p-[0.4rem] shadow-card"
          role="menu"
        >
          <div className="mb-[0.35rem] flex items-center gap-[0.6rem] border-b border-line p-[0.6rem]">
            <Avatar email={email} name={name} paid={isPaid} />
            <span className="flex min-w-0 flex-col">
              {name && <span className="truncate text-[0.9rem] font-semibold">{name}</span>}
              <span className="truncate text-[0.85rem] text-muted">{email}</span>
            </span>
          </div>
          <Link to="/pricing" className={`${DROPDOWN_ITEM} hover:bg-surface-hover`} role="menuitem" onClick={() => setOpen(false)}>
            Plans &amp; pricing
          </Link>
          <Link to="/profile" className={`${DROPDOWN_ITEM} hover:bg-surface-hover`} role="menuitem" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <button
            type="button"
            className={`${DROPDOWN_ITEM} hover:bg-danger-bg hover:text-danger`}
            role="menuitem"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const DROPDOWN_ITEM =
  "block w-full cursor-pointer rounded-lg px-[0.6rem] py-[0.55rem] text-left text-[0.9rem] font-medium text-fg no-underline transition-colors";
