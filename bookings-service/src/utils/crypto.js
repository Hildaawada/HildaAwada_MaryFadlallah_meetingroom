// AES-256-CBC 
require("dotenv").config();
const crypto = require("crypto");

// Load key 
const KEY = process.env.ENCRYPTION_KEY;
if (!KEY) {
  console.error(" key is missing from .env");
  throw new Error("key not found");
}

const HASH_KEY = crypto.createHash("sha256").update(KEY).digest();

// Encrypt
function encrypt(text) {
  const x = crypto.randomBytes(16);
  const c = crypto.createCipheriv("aes-256-cbc", HASH_KEY, x);

  let encrypted = c.update(text, "utf8", "hex");
  encrypted += c.final("hex");

  return x.toString("hex") + ":" + encrypted;
}

// Decrypt
function decrypt(encrypted) {
  if (!encrypted || typeof encrypted !== "string" || !encrypted.includes(":")) {
    return encrypted; // return as-is if not encrypted
  }
  const [ivHex, data] = encrypted.split(":");
  const i = Buffer.from(ivHex, "hex");

  const d = crypto.createDecipheriv("aes-256-cbc", HASH_KEY, i);

  let decrypted = d.update(data, "hex", "utf8");
  decrypted += d.final("utf8");

  return decrypted;
}

module.exports = { encrypt, decrypt };