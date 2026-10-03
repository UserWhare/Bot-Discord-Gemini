import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { AppConfig } from "./config.js";
import type { GeminiDatabase } from "./database.js";

export const geminiCommand = new SlashCommandBuilder()
  .setName("gemini")
  .setDescription("Converse e configure o Gemini")
  .addSubcommand((sub) => sub.setName("ajuda").setDescription("Mostra como usar o bot"))
  .addSubcommand((sub) => sub.setName("status").setDescription("Mostra o estado do bot neste servidor"))
  .addSubcommand((sub) =>
    sub.setName("canal-ativar").setDescription("Ativa a participação natural neste canal"),
  )
  .addSubcommand((sub) =>
    sub.setName("canal-desativar").setDescription("Desativa a participação natural neste canal"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("pausar")
      .setDescription("Pausa ou retoma o bot no servidor")
      .addBooleanOption((option) =>
        option.setName("estado").setDescription("Ative para pausar").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("lembrar")
      .setDescription("Salva uma informação sua neste servidor")
      .addStringOption((option) =>
        option.setName("texto").setDescription("O que deve ser lembrado").setMaxLength(500).setRequired(true),
      ),
  )
  .addSubcommand((sub) => sub.setName("memorias").setDescription("Lista suas memórias salvas"))
  .addSubcommand((sub) =>
    sub
      .setName("esquecer")
      .setDescription("Apaga uma memória sua")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("ID mostrado em /gemini memorias").setMinValue(1).setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("personalidade-ver").setDescription("Mostra o ajuste de personalidade do servidor"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("personalidade-definir")
      .setDescription("Define uma orientação adicional para este servidor")
      .addStringOption((option) =>
        option.setName("texto").setDescription("Ex.: seja mais descontraído").setMaxLength(1000).setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("personalidade-resetar").setDescription("Remove o ajuste de personalidade do servidor"),
  );

function scopeId(interaction: ChatInputCommandInteraction): string {
  return interaction.guildId ?? `dm:${interaction.user.id}`;
}

function canManage(interaction: ChatInputCommandInteraction, appConfig: AppConfig): boolean {
  if (appConfig.ownerIds.has(interaction.user.id)) return true;
  return interaction.member instanceof GuildMember && interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

async function requireManager(interaction: ChatInputCommandInteraction, appConfig: AppConfig): Promise<boolean> {
  if (canManage(interaction, appConfig)) return true;
  await interaction.reply({
    content: "Esse comando exige a permissão **Gerenciar Servidor**.",
    flags: MessageFlags.Ephemeral,
  });
  return false;
}

export async function handleGeminiCommand(
  interaction: ChatInputCommandInteraction,
  database: GeminiDatabase,
  appConfig: AppConfig,
): Promise<void> {
  const command = interaction.options.getSubcommand();
  const id = scopeId(interaction);
  const settings = database.getSettings(id);

  if (command === "ajuda") {
    const embed = new EmbedBuilder()
      .setColor(0x8e75b2)
      .setTitle("Gemini")
      .setDescription("Me mencione ou responda uma mensagem minha para conversar.")
      .addFields(
        { name: "Memória", value: "`/gemini lembrar`, `/gemini memorias` e `/gemini esquecer`" },
        { name: "Canal", value: "`/gemini canal-ativar` habilita a participação natural" },
        { name: "Privacidade", value: "O histórico completo do canal não é salvo no banco." },
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (command === "status") {
    const usage = database.getUsage();
    const natural = interaction.channelId ? settings.naturalChannels.has(interaction.channelId) : false;

    await interaction.reply({
      content: [
        `**Estado:** ${settings.paused ? "pausado" : "online"}`,
        `**Canal:** ${natural ? "modo natural ativo" : "somente quando chamado"}`,
        `**Modelo:** \`${appConfig.geminiModel}\``,
        `**Respostas:** ${usage.responses.toLocaleString("pt-BR")}`,
      ].join("\n"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (command === "lembrar") {
    const text = interaction.options.getString("texto", true).trim();
    const memoryId = database.addMemory(id, interaction.user.id, text);
    await interaction.reply({ content: `Memória **#${memoryId}** salva.`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (command === "memorias") {
    const memories = database.listMemories(id, interaction.user.id);
    const content = memories.length
      ? memories.map((memory) => `**#${memory.id}** — ${memory.content}`).join("\n")
      : "Você ainda não salvou nenhuma memória neste servidor.";

    await interaction.reply({ content: content.slice(0, 1900), flags: MessageFlags.Ephemeral });
    return;
  }

  if (command === "esquecer") {
    const memoryId = interaction.options.getInteger("id", true);
    const removed = database.deleteMemory(id, interaction.user.id, memoryId);
    await interaction.reply({
      content: removed ? `Memória **#${memoryId}** apagada.` : "Não encontrei essa memória entre as suas.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (command === "personalidade-ver") {
    await interaction.reply({
      content: settings.personalityAddition || "Este servidor usa a personalidade padrão do bot.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!(await requireManager(interaction, appConfig))) return;

  if (command === "canal-ativar" || command === "canal-desativar") {
    if (!interaction.guildId || !interaction.channelId) {
      await interaction.reply({ content: "Esse comando só funciona dentro de um servidor.", flags: MessageFlags.Ephemeral });
      return;
    }

    const active = command === "canal-ativar";
    database.setChannelNatural(interaction.guildId, interaction.channelId, active);
    await interaction.reply({
      content: active
        ? "Modo natural ativado neste canal."
        : "Modo natural desativado. Agora só responderei quando for chamado.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (command === "pausar") {
    const paused = interaction.options.getBoolean("estado", true);
    database.setPaused(id, paused);
    await interaction.reply({
      content: paused ? "Bot pausado neste servidor." : "Bot ativo novamente.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (command === "personalidade-definir") {
    const text = interaction.options.getString("texto", true).trim();
    database.setPersonalityAddition(id, text);
    await interaction.reply({ content: "Personalidade atualizada.", flags: MessageFlags.Ephemeral });
    return;
  }

  if (command === "personalidade-resetar") {
    database.setPersonalityAddition(id, "");
    await interaction.reply({ content: "Personalidade padrão restaurada.", flags: MessageFlags.Ephemeral });
  }
}
