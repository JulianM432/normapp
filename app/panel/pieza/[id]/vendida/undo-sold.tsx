"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { setSold } from "@/app/panel/product-actions";

export function UndoSold({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function undo() {
    setError(null);
    startTransition(async () => {
      const result = await setSold(id, false);
      if (result.ok) router.replace("/panel");
      else setError(result.error);
    });
  }

  return (
    <>
      <button type="button" onClick={undo} disabled={pending} className="btn btn-secondary w-full">
        <Undo2 aria-hidden="true" />
        {pending ? "Volviendo a ponerla en venta…" : "Me equivoqué, no se vendió"}
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-error-bg p-3 text-lg font-semibold text-error">
          {error}
        </p>
      )}
    </>
  );
}
