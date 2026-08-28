interface AvatarProps {
  email: string;
  name?: string;
  size?: "sm" | "lg";
  /** Show a small gold star on the corner — a paid (pro/plus) subscriber. */
  paid?: boolean;
}

/** "Aditi Rao" -> "AR"; falling back to the email: "john.doe@firm.in" -> "JD". */
export function initialsFor(email: string, name?: string): string {
  const source = name?.trim() ? name.trim() : (email.split("@")[0] ?? "");
  const parts = source.split(/[\s.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (source.slice(0, 2) || "?").toUpperCase();
}

const AVATAR_SIZE = {
  sm: "w-[2.2rem] h-[2.2rem] text-[0.8rem]",
  lg: "w-[3.5rem] h-[3.5rem] text-[1.15rem]",
};

export function Avatar({ email, name, size = "sm", paid = false }: AvatarProps) {
  return (
    <span
      className={`relative inline-grid place-items-center overflow-visible rounded-full border border-line-hover bg-accent-soft font-semibold tracking-[0.02em] text-accent group-hover:bg-accent/20 ${AVATAR_SIZE[size]}`}
      aria-hidden="true"
    >
      {initialsFor(email, name)}
      {paid && (
        <span
          className="absolute -top-1 -right-1 grid h-[1.05em] w-[1.05em] place-items-center rounded-full bg-accent text-[0.6em] leading-none text-black shadow-[0_0_0_2px_var(--color-base)]"
          title="Paid plan"
        >
          ★
        </span>
      )}
    </span>
  );
}
