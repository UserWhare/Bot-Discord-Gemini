<div align="center">

# Gemini Discord Bot

**Bot para Discord integrado ao Google Gemini, com respostas contextuais, memória opcional e participação natural em canais.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge)

</div>

---

O Gemini Discord Bot acompanha o contexto recente da conversa e responde diretamente no Discord usando a Gemini API.

## Recursos

- Respostas contextuais com histórico recente do canal
- Resposta por menção, nome ou reply
- Modo natural opcional por canal
- Memórias explícitas e privadas por usuário
- Personalidade configurável por servidor
- Cooldown e fila de respostas por canal
- Banco local SQLite para configurações e memórias
- Comandos slash para administração
- Bloqueio de menções automáticas

## Instalação

Clone o projeto:

```bash
git clone https://github.com/UserWhare/Bot-Discord-Gemini.git
cd Bot-Discord-Gemini
```

Instale as dependências:

```bash
npm install
```

Crie o `.env` a partir do exemplo:

```env
DISCORD_TOKEN=SEU_TOKEN_DO_DISCORD
GEMINI_API_KEY=SUA_CHAVE_DO_GEMINI
GEMINI_MODEL=gemini-3.5-flash-lite
```

Compile e inicie:

```bash
npm run build
npm start
```

Para desenvolvimento:

```bash
npm run dev
```

## Comandos

| Comando | Função |
| --- | --- |
| `/gemini ajuda` | Mostra o guia rápido |
| `/gemini status` | Exibe estado, modelo e estatísticas |
| `/gemini canal-ativar` | Ativa o modo natural no canal |
| `/gemini canal-desativar` | Desativa o modo natural |
| `/gemini lembrar` | Salva uma memória pessoal |
| `/gemini memorias` | Lista suas memórias |
| `/gemini esquecer` | Apaga uma memória |
| `/gemini pausar` | Pausa ou retoma o bot |
| `/gemini personalidade-definir` | Ajusta a personalidade do servidor |
| `/gemini personalidade-resetar` | Restaura a personalidade padrão |

Os comandos administrativos exigem **Gerenciar Servidor** ou um ID configurado em `OWNER_IDS`.

## Estrutura

```text
Bot-Discord-Gemini/
├── config/
│   └── personality.md
├── src/
│   ├── ai.ts
│   ├── commands.ts
│   ├── config.ts
│   ├── database.ts
│   ├── index.ts
│   └── utils.ts
├── .env.example
├── discloud.config
├── package.json
├── tsconfig.json
└── README.md
```

## Privacidade

O histórico completo do Discord não é armazenado. Apenas mensagens recentes necessárias para gerar a resposta são enviadas à Gemini API com `store: false`.

As memórias só são criadas quando o próprio usuário solicita e são isoladas por usuário e servidor. Tokens, banco local e logs ficam fora do Git através do `.gitignore`.

## Discloud

O projeto inclui `discloud.config` com build automático do TypeScript. Configure `DISCORD_TOKEN` e `GEMINI_API_KEY` como variáveis de ambiente da aplicação antes de iniciar o bot.

## Licença

Distribuído sob a [Licença MIT](LICENSE).

---

<div align="center">

Feito por [UserWhare](https://github.com/UserWhare)

</div>
