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

export function whatsappUrl(phone: string, text?: string) {
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}
