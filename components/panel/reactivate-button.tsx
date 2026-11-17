"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { setSold } from "@/app/panel/product-actions";

export function ReactivateButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reactivate() {
    setError(null);
    startTransition(async () => {
      const result = await setSold(id, false);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={reactivate} disabled={pending} className="btn btn-secondary w-full">
        <Undo2 aria-hidden="true" />
        {pending ? "Poniéndola en venta…" : "Volver a ponerla en venta"}
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-error-bg p-3 text-lg font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
