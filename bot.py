import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

from ai_utils import buscar_historico_canal, ask_gemini, set_active_model, get_active_model
from logger import log_interaction
from spam_control import pode_enviar_resposta, registrar_envio

load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"{bot.user.name} está online!")
    await bot.change_presence(activity=discord.Game(name="Converse comigo!"))

def dividir_texto(texto, limite=1024):
    partes = []
    while len(texto) > limite:
        corte = texto.rfind('\n', 0, limite)
        if corte == -1:
            corte = limite
        parte = texto[:corte]
        partes.append(parte)
        texto = texto[corte:]
    partes.append(texto)
    return partes

@bot.command()
@commands.has_permissions(administrator=True)
async def setmodel(ctx, model_key: str):
    success, message = set_active_model(model_key)
    if success:
        await ctx.send(f"✅ {message}")
    else:
        await ctx.send(f"❌ {message}")

@setmodel.error
async def setmodel_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send("❌ Você precisa especificar o modelo. Use `!setmodel pro` ou `!setmodel flash`.")
    elif isinstance(error, commands.CheckFailure):
        await ctx.send("❌ Você não tem permissão para usar este comando.")
    else:
        await ctx.send("❌ Ocorreu um erro ao processar o comando.")

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    
    if message.content.startswith(bot.command_prefix):
        await bot.process_commands(message)
        return

    if not pode_enviar_resposta(message.channel.id):
        try:
            await message.add_reaction("⏳")
        except discord.Forbidden:
            pass
        return

    log_interaction("mensagem", message)

    async with message.channel.typing():
        mensagens = await buscar_historico_canal(message.channel)
        if not mensagens:
            return
            
        resposta = ask_gemini(mensagens)

        log_interaction("resposta", message, resposta)
        registrar_envio(message.channel.id)

        embed = discord.Embed(
            title="💬 Resposta do Gemini",
            color=discord.Color.from_rgb(74, 144, 226)
        )

        partes = dividir_texto(resposta, limite=1024)
        for i, parte in enumerate(partes):
            nome_campo = "Resposta" if i == 0 else f"Continuação ({i+1})"
            embed.add_field(name=nome_campo, value=parte, inline=False)

        embed.set_footer(text=f"Modelo: {get_active_model()} | Pedido por: {message.author.display_name}", icon_url=message.author.avatar.url if message.author.avatar else None)

        await message.reply(embed=embed, mention_author=False)

if TOKEN:
    bot.run(TOKEN)
else:
    print("Token do bot não encontrado no .env.")
