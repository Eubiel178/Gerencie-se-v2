import Image from "next/image";

import styles from "./styles.module.css";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const classNames = [styles.avatar, styles[size], className ?? ""]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <span className={classNames}>
        <Image src={src} alt={name} className={styles.image} fill sizes="56px" />
      </span>
    );
  }

  return (
    <span className={classNames} role="img" aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
