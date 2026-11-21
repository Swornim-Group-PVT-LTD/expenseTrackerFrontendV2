"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import BASE_URL from "@/app/urlConfig/urlConfig";

const apiOrigin = new URL(BASE_URL).origin;

function getAccountLogoUrl(logoPath?: string | null) {
  if (!logoPath?.trim()) return null;

  try {
    const url = new URL(logoPath.trim(), apiOrigin);
    const filename = url.pathname.match(
      /^\/logo_uploads\/([a-z0-9_-]+\.(?:jpe?g|png|gif|webp))$/i,
    )?.[1];

    return url.origin === apiOrigin && filename
      ? `/account-logos/${filename}`
      : null;
  } catch {
    return null;
  }
}

interface AccountLogoProps {
  alt: string;
  className: string;
  fallback?: string;
}

export default function AccountLogo({
  alt,
  className,
  fallback,
}: AccountLogoProps) {
  const { user } = useAuth();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const logoUrl = getAccountLogoUrl(user?.logo_uploads);
  const src = logoUrl && logoUrl !== failedLogo ? logoUrl : fallback;

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (src === logoUrl) setFailedLogo(logoUrl);
      }}
    />
  );
}
