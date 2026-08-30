import { Link } from "react-router-dom";
import logoMark from "../assets/logo-badge.png";

export function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-[0.6rem] text-fg no-underline transition-colors hover:text-accent"
    >
      <img
        src={logoMark}
        alt=""
        aria-hidden="true"
        className="h-[26px] w-[26px] rounded-[6px] object-contain ring-1 ring-white/12"
      />
      <span className="text-[1.1rem] font-semibold tracking-[0.02em]">Casper</span>
    </Link>
  );
}
