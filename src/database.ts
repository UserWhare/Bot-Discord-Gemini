import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type GuildSettings = {
  guildId: string;
  naturalChannels: Set<string>;
  paused: boolean;
  personalityAddition: string;
};

export type Memory = {
  id: number;
  guildId: string;
  userId: string;
  content: string;
  createdAt: string;
};

export type UsageStats = {
  responses: number;
  inputTokens: number;
  outputTokens: number;
};

function parseChannels(raw: string): Set<string> {
  try {
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export class GeminiDatabase {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        natural_channels TEXT NOT NULL DEFAULT '[]',
        paused INTEGER NOT NULL DEFAULT 0,
        personality_addition TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_memories_owner
        ON memories(guild_id, user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS usage_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        responses INTEGER NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0
      );

      INSERT OR IGNORE INTO usage_stats(id) VALUES (1);
    `);
  }

  getSettings(guildId: string): GuildSettings {
    const row = this.db
      .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
      .get(guildId) as Record<string, unknown> | undefined;

    if (!row) {
      this.db.prepare("INSERT INTO guild_settings(guild_id) VALUES (?)").run(guildId);
      return { guildId, naturalChannels: new Set(), paused: false, personalityAddition: "" };
    }

    return {
      guildId,
      naturalChannels: parseChannels(String(row.natural_channels)),
      paused: Boolean(row.paused),
      personalityAddition: String(row.personality_addition ?? ""),
    };
  }

  setChannelNatural(guildId: string, channelId: string, active: boolean): void {
    const settings = this.getSettings(guildId);
    if (active) settings.naturalChannels.add(channelId);
    else settings.naturalChannels.delete(channelId);

    this.db
      .prepare("UPDATE guild_settings SET natural_channels = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?")
      .run(JSON.stringify([...settings.naturalChannels]), guildId);
  }

  setPaused(guildId: string, paused: boolean): void {
    this.getSettings(guildId);
    this.db
      .prepare("UPDATE guild_settings SET paused = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?")
      .run(paused ? 1 : 0, guildId);
  }

  setPersonalityAddition(guildId: string, text: string): void {
    this.getSettings(guildId);
    this.db
      .prepare("UPDATE guild_settings SET personality_addition = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?")
      .run(text, guildId);
  }

  addMemory(guildId: string, userId: string, content: string): number {
    const result = this.db
      .prepare("INSERT INTO memories(guild_id, user_id, content) VALUES (?, ?, ?)")
      .run(guildId, userId, content);
    return Number(result.lastInsertRowid);
  }

  listMemories(guildId: string, userId: string, limit = 20): Memory[] {
    return this.db
      .prepare(`
        SELECT id, guild_id AS guildId, user_id AS userId, content, created_at AS createdAt
        FROM memories
        WHERE guild_id = ? AND user_id = ?
        ORDER BY id DESC
        LIMIT ?
      `)
      .all(guildId, userId, limit) as Memory[];
  }

  deleteMemory(guildId: string, userId: string, id: number): boolean {
    return this.db
      .prepare("DELETE FROM memories WHERE id = ? AND guild_id = ? AND user_id = ?")
      .run(id, guildId, userId).changes > 0;
  }

  recordUsage(inputTokens = 0, outputTokens = 0): void {
    this.db
      .prepare(`
        UPDATE usage_stats
        SET responses = responses + 1,
            input_tokens = input_tokens + ?,
            output_tokens = output_tokens + ?
        WHERE id = 1
      `)
      .run(inputTokens, outputTokens);
  }

  getUsage(): UsageStats {
    return this.db
      .prepare("SELECT responses, input_tokens AS inputTokens, output_tokens AS outputTokens FROM usage_stats WHERE id = 1")
      .get() as UsageStats;
  }

  close(): void {
    this.db.close();
  }
}
