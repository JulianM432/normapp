import "server-only";

const clock = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function lockedMessage(until: Date) {
  const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  const wait = minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  return `Te equivocaste varias veces. Esperá ${wait} y probá de nuevo. Podés volver a intentar a las ${clock.format(until)}.`;
}

export function wrongPinMessage(failedCount: number, maxFailures: number) {
  if (failedCount < 3) return "Esa clave no es. Probá de nuevo.";
  const left = maxFailures - failedCount;
  return left === 1 ? "Esa clave no es. Te queda 1 intento." : `Esa clave no es. Te quedan ${left} intentos.`;
}
