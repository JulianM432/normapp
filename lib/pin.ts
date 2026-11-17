import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type BinaryLike } from "node:crypto";

const KEY_LENGTH = 64;
const PREFIX = "scrypt";

export const PIN_PATTERN = /^\d{6}$/;

function scrypt(pin: BinaryLike, salt: BinaryLike) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(pin, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pin, salt);
  return [PREFIX, salt.toString("base64url"), key.toString("base64url")].join(":");
}

export async function verifyPin(pin: string, stored: string) {
  const [prefix, salt, hash] = stored.split(":");
  if (prefix !== PREFIX || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(pin, Buffer.from(salt, "base64url"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
