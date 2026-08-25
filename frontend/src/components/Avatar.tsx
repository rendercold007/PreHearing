interface AvatarProps {
  email: string;
  name?: string;
  size?: "sm" | "lg";
}

/** "Aditi Rao" -> "AR"; falling back to the email: "john.doe@firm.in" -> "JD". */
export function initialsFor(email: string, name?: string): string {
  const source = name?.trim() ? name.trim() : (email.split("@")[0] ?? "");
  const parts = source.split(/[\s.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (source.slice(0, 2) || "?").toUpperCase();
}

export function Avatar({ email, name, size = "sm" }: AvatarProps) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {initialsFor(email, name)}
    </span>
  );
}
