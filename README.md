# 🤖 Gemini Discord Bot

Bot para Discord com IA **Google Gemini**, que entende o contexto da conversa e responde direto no canal.

---

## ✨ Destaques

- **🧠 Gemini Integrado**: Usa os modelos `gemini-1.5-pro` e `flash`.
- **🗣️ Contextual**: Lê as últimas 15 mensagens para manter o sentido.
- **⚡ Troca de Modelo**: Comando simples para mudar entre `pro` e `flash`.
- **⏳ Anti-Spam**: Cooldown de 10s por canal.
- **📄 Respostas em Embed**: Visual limpo e organizado.
- **📝 Logs**: Registra tudo em `bot_interacoes.log`.

---

## ⚙️ Instalação

**1. Clone o projeto**
```bash
git clone https://github.com/UserWhare/Bot-Discord-Gemini.git
cd Bot-Discord-Gemini
```

**2. Instale as dependências**
```bash
pip install -r requirements.txt
```

**3. Configure o `.env`**
```env
DISCORD_BOT_TOKEN=SEU_TOKEN
GOOGLE_API_KEY=SUA_API_KEY
```

- Obtenha o token no [Discord Developer Portal](https://discord.com/developers/applications)  
- Pegue a API Key no [Google AI Studio](https://aistudio.google.com/app/apikey)

**4. Inicie o bot**
```bash
python bot.py
```

---

## ✅ Comando

| Comando              | Função                           | Permissão      |
|---------------------|----------------------------------|----------------|
| `!setmodel <nome>`  | Troca entre `pro` e `flash`      | Administrador  |

---

## 🚀 Como Usar

- Basta mandar mensagem onde o bot tenha permissão.  
- Ele responde com base no histórico recente.  
- Se for cedo demais, ele reage com ⏳.

---

## 📂 Estrutura

```
📦 gemini-discord-bot/
┣ 📜 bot.py              # Principal
┣ 📜 ai_utils.py         # Conexão com Gemini
┣ 📜 spam_control.py     # Cooldown
┣ 📜 logger.py           # Logs
┣ 📜 requirements.txt    # Dependências
┣ 📜 .env                # Configurações
┗ 📜 bot_interacoes.log  # Histórico gerado
```

---

## 💻 Autor

Feito por [Yusuke](https://github.com/UserWhare)
