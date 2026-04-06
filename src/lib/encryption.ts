import CryptoJS from "crypto-js";

// =============================================
// تشفير وفك تشفير API Keys
// =============================================
// يستخدم AES-256 لتشفير المفاتيح الحساسة في قاعدة البيانات

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SECRET_KEY || "default-key-change-me";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
