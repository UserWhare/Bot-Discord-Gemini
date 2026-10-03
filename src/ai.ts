import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import type { AppConfig } from "./config.js";
import type { GeminiDatabase, Memory } from "./database.js";

export type ContextMessage = {
  authorId: string;
  authorName: string;
  content: string;
  isBot: boolean;
};

export class GeminiAI {
  private readonly client: GoogleGenAI;
  private readonly personality: string;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly database: GeminiDatabase,
  ) {
    this.client = new GoogleGenAI({ apiKey: appConfig.geminiApiKey });
    this.personality = fs.readFileSync(appConfig.personalityPath, "utf8").trim();
  }

  async respond(input: {
    context: ContextMessage[];
    memories: Memory[];
    personalityAddition: string;
    naturalMode: boolean;
  }): Promise<string | null> {
    const memories = input.memories.length
      ? input.memories.map((memory) => `- ${memory.content}`).join("\n")
      : "Nenhuma memória explícita foi salva por esta pessoa.";

    const transcript = input.context
      .map((message) => `${message.isBot ? "Gemini" : message.authorName}: ${message.content}`)
      .join("\n");

    const customPersonality = input.personalityAddition.trim()
      ? `\n\nOrientação adicional deste servidor:\n${input.personalityAddition.trim()}`
      : "";

    const response = await this.client.interactions.create({
      model: this.appConfig.geminiModel,
      system_instruction: `${this.personality}${customPersonality}`,
      input: [
        input.naturalMode
          ? "MODO NATURAL: você não foi chamado diretamente."
          : "MODO DIRETO: responda à pessoa que chamou você.",
        "",
        "Memórias explícitas da pessoa que originou a resposta:",
        memories,
        "",
        "Conversa recente, da mais antiga para a mais nova:",
        transcript,
      ].join("\n"),
      store: false,
      generation_config: {
        max_output_tokens: this.appConfig.maxOutputTokens,
        thinking_level: "minimal",
      },
    });

    this.database.recordUsage(response.usage?.total_input_tokens, response.usage?.total_output_tokens);

    const text = response.output_text?.trim() ?? "";
    if (!text || /^<SILENCIO>[.!]?$/i.test(text)) return null;
    return text;
  }
}
