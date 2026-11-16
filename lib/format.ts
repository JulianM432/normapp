const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return ars.format(value);
}

export function formatPhone(phone: string) {
  const local = phone.replace(/^549/, "");
  if (local.length !== 10) return local;
  const areaLength = local.startsWith("11") ? 2 : 3;
  const area = local.slice(0, areaLength);
  const rest = local.slice(areaLength);
  return `${area} ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
}

export function whatsappUrl(phone: string) {
  return `https://wa.me/${phone}`;
}
