<div align="center">

# Gemini Discord Bot

**A lightweight Discord bot powered by Google Gemini with contextual replies, model switching and per-channel cooldown.**

![Python](https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=yellow)
![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge)

</div>

---

Gemini Discord Bot reads recent channel context and uses Google Gemini to reply directly inside Discord.

## Features

- Context-aware responses using the latest channel messages
- Switchable Gemini model profiles with `!setmodel`
- 10-second cooldown per channel
- Responses formatted as Discord embeds
- Automatic splitting for longer responses
- Local interaction logging
- Environment-based token and API key configuration

## Setup

Clone the repository:

```bash
git clone https://github.com/UserWhare/Bot-Discord-Gemini.git
cd Bot-Discord-Gemini
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create your local `.env` from the example file:

```env
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
```

Then start the bot:

```bash
python bot.py
```

## Commands

| Command | Description | Permission |
| --- | --- | --- |
| `!setmodel pro` | Switches to the configured Pro model | Administrator |
| `!setmodel flash` | Switches to the configured Flash model | Administrator |

## Project Structure

```text
Bot-Discord-Gemini/
├── bot.py
├── ai_utils.py
├── spam_control.py
├── logger.py
├── requirements.txt
├── .env.example
└── README.md
```

## Notes

The model identifiers are defined in `ai_utils.py` and may need to be updated as Google changes model availability.

Interactions are logged locally to `bot_interacoes.log`. This file is ignored by Git and should not be committed.

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

Made by [UserWhare](https://github.com/UserWhare)

</div>
