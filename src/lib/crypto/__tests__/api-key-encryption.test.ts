import { describe, it, expect, beforeEach } from "vitest";
import { randomBytes } from "node:crypto";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from "../api-key-encryption";

const VALID_KEY = randomBytes(32).toString("hex");
const OTHER_KEY = randomBytes(32).toString("hex");

beforeEach(() => {
  process.env.APP_ENCRYPTION_KEY = VALID_KEY;
});

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trips a value", () => {
    const plaintext = "key_abc123_runway_secret";
    const encrypted = encryptApiKey(plaintext);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces a different ciphertext on each call (random IV)", () => {
    const a = encryptApiKey("same-input");
    const b = encryptApiKey("same-input");
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("rejects ciphertext that has been tampered with", () => {
    const encrypted = encryptApiKey("important-value");
    const flipped = Buffer.from(encrypted.ciphertext, "base64");
    flipped[0] ^= 0x01;
    const tampered = { ...encrypted, ciphertext: flipped.toString("base64") };
    expect(() => decryptApiKey(tampered)).toThrow();
  });

  it("rejects decryption with the wrong master key", () => {
    const encrypted = encryptApiKey("important-value");
    process.env.APP_ENCRYPTION_KEY = OTHER_KEY;
    expect(() => decryptApiKey(encrypted)).toThrow();
  });

  it("throws when APP_ENCRYPTION_KEY is missing", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    expect(() => encryptApiKey("anything")).toThrow(/APP_ENCRYPTION_KEY/);
  });

  it("throws when APP_ENCRYPTION_KEY is the wrong length", () => {
    process.env.APP_ENCRYPTION_KEY = "deadbeef";
    expect(() => encryptApiKey("anything")).toThrow(/32 bytes/);
  });
});

describe("maskApiKey", () => {
  it("masks middle chars for long keys", () => {
    const masked = maskApiKey("key_abcdefghijklmnopqrstuvwxyz1234");
    expect(masked.startsWith("key_")).toBe(true);
    expect(masked.endsWith("1234")).toBe(true);
    expect(masked).toContain("•");
  });

  it("fully masks short values", () => {
    expect(maskApiKey("short")).toBe("•••••");
  });
});
