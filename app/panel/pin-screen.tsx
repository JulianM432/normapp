"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { Delete } from "lucide-react";
import { login } from "./actions";
import { initialLoginState, type LoginState } from "./login-state";

const PIN_LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinScreen({ initial = initialLoginState }: { initial?: LoginState }) {
  const [state, submit, pending] = useActionState(login, initial);
  const [digits, setDigits] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [shownState, setShownState] = useState(state);

  if (shownState !== state) {
    setShownState(state);
    setDigits("");
  }

  const locked = state.lockedUntil !== null && state.lockedUntil > now;
  const disabled = pending || locked;

  useEffect(() => {
    if (state.lockedUntil === null) return;
    const wait = state.lockedUntil - Date.now();
    if (wait <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), wait + 500);
    return () => clearTimeout(timer);
  }, [state.lockedUntil]);

  function press(digit: string) {
    if (disabled || digits.length >= PIN_LENGTH) return;
    const next = digits + digit;
    setDigits(next);
    if (next.length === PIN_LENGTH) {
      const formData = new FormData();
      formData.set("pin", next);
      startTransition(() => submit(formData));
    }
  }

  function erase() {
    if (disabled) return;
    setDigits((d) => d.slice(0, -1));
  }

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^\d$/.test(event.key)) press(event.key);
    else if (event.key === "Backspace") erase();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const message = locked || !state.lockedUntil ? state.error : null;

  return (
    <section className="grid gap-8">
      <header className="grid gap-2 text-center">
        <h1 className="font-display text-title text-wine">Hola, Norma</h1>
        <p className="text-xl">Escribí tu clave de 6 números</p>
      </header>

      <div className="flex justify-center gap-3" aria-hidden="true">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`size-6 rounded-full border-[3px] border-wine ${i < digits.length ? "bg-wine" : "bg-transparent"}`}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {pending ? "Revisando tu clave" : `${digits.length} de ${PIN_LENGTH} números`}
      </p>

      <div className="grid min-h-[4.5rem] place-items-center">
        {pending ? (
          <p className="text-lg font-semibold text-muted">Revisando…</p>
        ) : message ? (
          <p role="alert" className="w-full rounded-xl bg-error-bg p-3 text-center text-lg font-semibold text-error">
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <PinKey key={key} onPress={() => press(key)} disabled={disabled}>
            {key}
          </PinKey>
        ))}
        <span />
        <PinKey onPress={() => press("0")} disabled={disabled}>
          0
        </PinKey>
        <button
          type="button"
          onClick={erase}
          disabled={disabled || digits.length === 0}
          className="btn btn-quiet min-h-[4.5rem] flex-col gap-1 px-2 text-base no-underline disabled:opacity-40"
        >
          <Delete aria-hidden="true" />
          Borrar
        </button>
      </div>
    </section>
  );
}

function PinKey({ children, onPress, disabled }: { children: string; onPress: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="btn btn-secondary min-h-[4.5rem] rounded-card font-display text-title tabular-nums disabled:opacity-40"
    >
      {children}
    </button>
  );
}
