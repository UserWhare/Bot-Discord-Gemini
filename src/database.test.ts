import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GeminiDatabase } from "./database.js";

describe("GeminiDatabase", () => {
  let file: string;
  let database: GeminiDatabase;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `gemini-test-${crypto.randomUUID()}.db`);
    database = new GeminiDatabase(file);
  });

  afterEach(() => {
    database.close();
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(`${file}${suffix}`, { force: true });
  });

  it("salva configurações de canal", () => {
    database.setChannelNatural("guild-1", "channel-1", true);
    expect(database.getSettings("guild-1").naturalChannels.has("channel-1")).toBe(true);
    database.setChannelNatural("guild-1", "channel-1", false);
    expect(database.getSettings("guild-1").naturalChannels.has("channel-1")).toBe(false);
  });

  it("isola memórias por usuário", () => {
    const id = database.addMemory("guild-1", "user-1", "gosto de astronomia");
    expect(database.listMemories("guild-1", "user-1")[0]?.id).toBe(id);
    expect(database.listMemories("guild-1", "user-2")).toEqual([]);
    expect(database.deleteMemory("guild-1", "user-2", id)).toBe(false);
    expect(database.deleteMemory("guild-1", "user-1", id)).toBe(true);
  });

  it("acumula estatísticas de uso", () => {
    database.recordUsage(120, 30);
    database.recordUsage(80, 20);
    expect(database.getUsage()).toEqual({ responses: 2, inputTokens: 200, outputTokens: 50 });
  });
});
