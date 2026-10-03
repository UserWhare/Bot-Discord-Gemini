import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  type InteractionReplyOptions,
  type Message,
  MessageFlags,
  Partials,
} from "discord.js";
import pino from "pino";
import { GeminiAI, type ContextMessage } from "./ai.js";
import { geminiCommand, handleGeminiCommand } from "./commands.js";
import { config } from "./config.js";
import { GeminiDatabase } from "./database.js";
import { isMeaningfulForNaturalMode, normalizeContent, splitDiscordMessage } from "./utils.js";

const logger = pino({
  level: config.logLevel,
  transport: process.stdout.isTTY
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined,
});

const database = new GeminiDatabase(config.databasePath);
const ai = new GeminiAI(config, database);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const naturalCounters = new Map<string, number>();
const lastNaturalReply = new Map<string, number>();
const lastUserRequest = new Map<string, number>();
const channelQueues = new Map<string, Promise<void>>();

function friendlyAIError(error: unknown): string {
  const details = error as { status?: number; message?: string };
  const message = details?.message?.toLowerCase() ?? "";

  if (details?.status === 429 || message.includes("quota") || message.includes("resource_exhausted")) {
    return "A cota do Gemini foi atingida. Tente novamente mais tarde.";
  }

  if (details?.status === 401 || details?.status === 403 || message.includes("api key")) {
    return "A chave do Gemini não foi aceita. Um administrador precisa revisar a configuração.";
  }

  return "Não consegui responder agora. Tente novamente em alguns segundos.";
}

function guildAllowed(guildId: string | null): boolean {
  return !guildId || config.allowedGuildIds.size === 0 || config.allowedGuildIds.has(guildId);
}

function enqueue(channelId: string, work: () => Promise<void>): void {
  const previous = channelQueues.get(channelId) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(work)
    .finally(() => {
      if (channelQueues.get(channelId) === next) channelQueues.delete(channelId);
    });

  channelQueues.set(channelId, next);
}

async function isDirectCall(message: Message): Promise<boolean> {
  if (!message.guildId) return true;
  if (client.user && message.mentions.has(client.user)) return true;
  if (/\bgemini\b/i.test(message.content)) return true;
  if (!message.reference?.messageId) return false;

  try {
    const referenced = await message.channel.messages.fetch(message.reference.messageId);
    return referenced.author.id === client.user?.id;
  } catch {
    return false;
  }
}

function naturalCandidate(message: Message): boolean {
  if (!isMeaningfulForNaturalMode(message.content)) return false;
  if (Date.now() - (lastNaturalReply.get(message.channelId) ?? 0) < config.naturalCooldownMs) return false;

  const count = (naturalCounters.get(message.channelId) ?? 0) + 1;
  naturalCounters.set(message.channelId, count);

  const threshold = message.content.includes("?")
    ? Math.max(2, config.naturalMinMessages - 1)
    : config.naturalMinMessages;

  if (count < threshold) return false;
  naturalCounters.set(message.channelId, 0);
  return true;
}

function displayName(message: Message): string {
  return message.member?.displayName || message.author.globalName || message.author.username;
}

async function buildContext(message: Message): Promise<ContextMessage[]> {
  const collection = await message.channel.messages.fetch({ limit: config.contextMessages });

  return [...collection.values()]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .filter((item) => !item.author.bot || item.author.id === client.user?.id)
    .map((item) => {
      const attachments = [...item.attachments.values()].map((file) => `[anexo: ${file.name}]`).join(" ");
      const content = [normalizeContent(item.content, client.user?.id ?? ""), attachments].filter(Boolean).join(" ");
      const isBot = item.author.id === client.user?.id;

      return {
        authorId: item.author.id,
        authorName: isBot ? "Gemini" : displayName(item),
        content: content || "[mensagem sem texto]",
        isBot,
      };
    });
}

async function sendGeminiReply(message: Message, naturalMode: boolean): Promise<void> {
  const typing = async () => {
    if ("sendTyping" in message.channel) await message.channel.sendTyping().catch(() => undefined);
  };

  if (!naturalMode) await typing();
  const typingTimer = !naturalMode ? setInterval(() => void typing(), 7_000) : undefined;

  try {
    const context = await buildContext(message);
    const id = message.guildId ?? `dm:${message.author.id}`;
    const settings = database.getSettings(id);
    const memories = database.listMemories(id, message.author.id);
    const response = await ai.respond({
      context,
      memories,
      personalityAddition: settings.personalityAddition,
      naturalMode,
    });

    if (!response) return;
    if (naturalMode) await typing();

    const chunks = splitDiscordMessage(response);
    for (let index = 0; index < chunks.length; index += 1) {
      const content = chunks[index];
      if (index === 0) {
        await message.reply({ content, allowedMentions: { parse: [], repliedUser: false } });
      } else if (message.channel.isSendable()) {
        await message.channel.send({ content, allowedMentions: { parse: [] } });
      }
    }

    if (naturalMode) lastNaturalReply.set(message.channelId, Date.now());
  } catch (error) {
    logger.error({ err: error, channelId: message.channelId }, "Falha ao gerar resposta");
    if (!naturalMode && message.channel.isSendable()) {
      await message
        .reply({ content: friendlyAIError(error), allowedMentions: { parse: [], repliedUser: false } })
        .catch(() => undefined);
    }
  } finally {
    if (typingTimer) clearInterval(typingTimer);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  logger.info({ user: readyClient.user.tag, guilds: readyClient.guilds.cache.size }, "Bot conectado");

  for (const guild of readyClient.guilds.cache.values()) {
    if (!guildAllowed(guild.id)) continue;

    try {
      await guild.commands.set([geminiCommand.toJSON()]);
      logger.info({ guild: guild.name }, "Comandos registrados");
    } catch (error) {
      logger.error({ err: error, guild: guild.id }, "Falha ao registrar comandos");
    }
  }
});

client.on(Events.GuildCreate, async (guild) => {
  if (!guildAllowed(guild.id)) return;
  await guild.commands
    .set([geminiCommand.toJSON()])
    .catch((error) => logger.error({ err: error, guild: guild.id }, "Falha ao registrar comandos"));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "gemini") return;

  if (!guildAllowed(interaction.guildId)) {
    await interaction.reply({ content: "Este servidor não está autorizado.", flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await handleGeminiCommand(interaction, database, config);
  } catch (error) {
    logger.error({ err: error, command: interaction.options.getSubcommand(false) }, "Falha em comando");
    const payload = {
      content: "Não consegui executar esse comando agora.",
      flags: MessageFlags.Ephemeral,
    } satisfies InteractionReplyOptions;

    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => undefined);
    else await interaction.reply(payload).catch(() => undefined);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || message.webhookId || !guildAllowed(message.guildId)) return;
  if (message.channel.type === ChannelType.AnnouncementThread) return;

  const id = message.guildId ?? `dm:${message.author.id}`;
  const settings = database.getSettings(id);
  if (settings.paused) return;

  const direct = await isDirectCall(message);
  const natural = !direct && !!message.guildId && settings.naturalChannels.has(message.channelId)
    ? naturalCandidate(message)
    : false;

  if (!direct && !natural) return;

  if (direct) {
    const previous = lastUserRequest.get(message.author.id) ?? 0;
    if (Date.now() - previous < config.userCooldownMs) return;
    lastUserRequest.set(message.author.id, Date.now());
  }

  enqueue(message.channelId, () => sendGeminiReply(message, natural));
});

process.on("unhandledRejection", (error) => logger.error({ err: error }, "Promise rejeitada"));
process.on("uncaughtException", (error) => logger.fatal({ err: error }, "Erro fatal"));

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Encerrando bot");
  client.destroy();
  database.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

logger.info("Iniciando Gemini Discord Bot...");
await client.login(config.discordToken);
