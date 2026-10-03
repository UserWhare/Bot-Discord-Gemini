import { describe, expect, it } from "vitest";
import { isMeaningfulForNaturalMode, splitDiscordMessage } from "./utils.js";

describe("splitDiscordMessage", () => {
  it("mantém mensagens pequenas", () => {
    expect(splitDiscordMessage("olá")).toEqual(["olá"]);
  });

  it("divide mensagens sem ultrapassar o limite", () => {
    const chunks = splitDiscordMessage("uma frase longa. ".repeat(100), 120);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 120)).toBe(true);
  });
});

describe("isMeaningfulForNaturalMode", () => {
  it("ignora reações curtas", () => {
    expect(isMeaningfulForNaturalMode("kkkk")).toBe(false);
    expect(isMeaningfulForNaturalMode("ok")).toBe(false);
  });

  it("aceita mensagens com conteúdo", () => {
    expect(isMeaningfulForNaturalMode("vocês acham que isso faz sentido?")).toBe(true);
  });
});
