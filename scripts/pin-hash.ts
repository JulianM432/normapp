import { hashPin, PIN_PATTERN } from "../lib/pin";

async function main() {
  const pin = process.argv[2];
  if (!pin || !PIN_PATTERN.test(pin)) {
    console.error("Uso: pnpm pin:hash <pin de 6 números>");
    process.exit(1);
  }
  console.log(`ADMIN_PIN_HASH=${await hashPin(pin)}`);
}

main();
