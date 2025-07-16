# 🤖 Gemini Discord Bot

Um bot para Discord que integra a poderosa IA **Google Gemini** para gerar respostas inteligentes e contextuais diretamente no seu servidor. O bot lê o histórico recente do canal para entender a conversa e fornecer respostas coesas.

---

## ✨ Funcionalidades

- **🧠 Integração com Google Gemini**: Utiliza os modelos `gemini-1.5-pro` e `gemini-1.5-flash` para gerar respostas.
- **🗣️ Consciente do Contexto**: Analisa as últimas 15 mensagens do canal para manter o fluxo da conversa.
- **⚡ Seleção de Modelo**: Administradores podem alternar entre o modelo `pro` (mais poderoso) e `flash` (mais rápido e econômico) com um simples comando.
- **⏳ Controle de Spam**: Possui um cooldown de 10 segundos por canal para evitar o uso excessivo e custos inesperados com a API.
- **📄 Respostas Formatadas**: Envia as respostas da IA em um *embed* do Discord, tornando a leitura mais limpa e agradável.
- **📝 Log de Interações**: Registra todas as perguntas e respostas em um arquivo `bot_interacoes.log` para fácil depuração e monitoramento.

---

## ⚙️ Instalação e Configuração

**1. Clone o Repositório**
```bash
# Clone este repositório para sua máquina local
git clone https://github.com/UserWhare/Bot-Discord-Gemini.git
cd Bot-Discord-Gemini
```

**2. Instale as Dependências**
O projeto usa Python. Instale todas as bibliotecas necessárias com o `pip`:
```bash
# Instala as dependências listadas no requirements.txt
pip install -r requirements.txt
```
As dependências são: `discord.py`, `google-generativeai`, e `python-dotenv`.

**3. Configure as Variáveis de Ambiente**
Crie um arquivo chamado `.env` na pasta raiz do projeto. Este arquivo guardará suas chaves de API secretas. Adicione as seguintes linhas a ele:

```env
# Token de autenticação do seu bot no Discord
DISCORD_BOT_TOKEN=SEU_TOKEN_DO_DISCORD_AQUI

# Chave de API para acessar o Google Gemini
GOOGLE_API_KEY=SUA_API_KEY_DO_GEMINI_AQUI
```
- Você pode obter o `DISCORD_BOT_TOKEN` no [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications).
- Você pode obter a `GOOGLE_API_KEY` no [Google AI Studio](https://aistudio.google.com/app/apikey).

**4. Execute o Bot**
Com tudo configurado, inicie o bot com o seguinte comando:
```bash
python bot.py
```
Se tudo estiver correto, você verá a mensagem `SeuBot#1234 está online!` no seu terminal.

---

## ✅ Comandos Disponíveis

| Comando | Descrição | Permissão |
| :--- | :--- | :--- |
| `!setmodel <modelo>` | Altera o modelo de IA utilizado. Modelos: `pro` ou `flash`. | `Administrador` |

---

## 🚀 Como Usar

Depois de convidar o bot para o seu servidor, ele funcionará automaticamente! Não é preciso usar nenhum comando para "chamar" o bot.

- **Para conversar**, basta enviar uma mensagem em qualquer canal onde o bot tenha permissão de leitura e escrita.
- O bot lerá o histórico recente, enviará para o Gemini e responderá à sua mensagem.
- Se alguém tentar usar o bot novamente antes do cooldown de 10 segundos acabar, o bot reagirá com um "⏳" na mensagem para indicar que está aguardando.

---

## 📂 Estrutura do Projeto

```
📦 gemini-discord-bot/
┣ 📜 bot.py              # Arquivo principal, lida com eventos e comandos do Discord
┣ 📜 ai_utils.py         # Gerencia a comunicação com a API do Google Gemini
┣ 📜 spam_control.py     # Implementa o sistema de cooldown para evitar spam
┣ 📜 logger.py           # Configura os logs de interação
┣ 📜 requirements.txt    # Lista de dependências Python
┣ 📜 .env                # (Seu arquivo local) Armazena as chaves de API
┗ 📜 bot_interacoes.log  # (Gerado na execução) Guarda o histórico de conversas
```

---

## 💻 Autor

- Feito por [Yusuke](https://github.com/UserWhare)
