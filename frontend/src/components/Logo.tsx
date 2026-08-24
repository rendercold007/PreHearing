import { Link } from "react-router-dom";

function LogoMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v17" />
      <path d="M6 21h12" />
      <path d="M4 7h16" />
      <path d="M4 7 2 12a2.5 2.5 0 0 0 5 0z" />
      <path d="M20 7l-2 5a2.5 2.5 0 0 0 5 0z" />
      <circle cx="12" cy="3.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="logo">
      <LogoMark />
      <span className="logo-text">PreHearing</span>
    </Link>
  );
}
