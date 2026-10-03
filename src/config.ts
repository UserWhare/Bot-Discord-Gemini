import "dotenv/config";
import path from "node:path";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || /^(SEU_|SUA_|YOUR_)/i.test(value)) {
    throw new Error(`A variável ${name} não foi configurada.`);
  }
  return value;
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, raw));
}

function idSet(name: string): Set<string> {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export const config = {
  discordToken: required("DISCORD_TOKEN"),
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite",
  ownerIds: idSet("OWNER_IDS"),
  allowedGuildIds: idSet("ALLOWED_GUILD_IDS"),
  databasePath: path.resolve(process.env.DATABASE_PATH?.trim() || "./data/gemini.db"),
  personalityPath: path.resolve("config/personality.md"),
  contextMessages: integer("CONTEXT_MESSAGES", 18, 6, 40),
  maxOutputTokens: integer("MAX_OUTPUT_TOKENS", 900, 200, 4000),
  naturalMinMessages: integer("NATURAL_MIN_MESSAGES", 3, 2, 12),
  naturalCooldownMs: integer("NATURAL_COOLDOWN_SECONDS", 75, 20, 900) * 1000,
  userCooldownMs: integer("USER_COOLDOWN_SECONDS", 5, 1, 60) * 1000,
  logLevel: process.env.LOG_LEVEL?.trim() || "info",
};

export type AppConfig = typeof config;
