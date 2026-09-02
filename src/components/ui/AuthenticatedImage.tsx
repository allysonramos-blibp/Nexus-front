import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * O backend exige JWT até para servir a imagem do treino (ownership checado no
 * endpoint) — uma tag <img src="..."> comum não consegue mandar o header
 * Authorization, então buscamos com fetch() e trocamos por um object URL local.
 */
export function AuthenticatedImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let currentUrl: string | null = null;
    let cancelled = false;

    setFailed(false);
    setObjectUrl(null);

    const token = getAuthToken();
    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [src]);

  if (failed) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-raised text-xs text-muted-foreground", className)}>
        Falha ao carregar
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-raised", className)}>
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
