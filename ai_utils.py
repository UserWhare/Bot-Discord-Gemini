import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Carregue a chave da API do Google
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("API Key do Google Gemini não encontrada no .env. Por favor, adicione GOOGLE_API_KEY.")

# Modelos disponíveis e modelo padrão
AVAILABLE_MODELS = {
    "pro": "gemini-1.5-pro-latest",
    "flash": "gemini-1.5-flash-latest",
}
current_model = AVAILABLE_MODELS["flash"] # 'flash' como padrão por ser mais rápido e econômico

def set_active_model(model_key: str):
    """Define o modelo do Gemini a ser usado, com base em uma chave (ex: 'pro' ou 'flash')."""
    global current_model
    model_name = AVAILABLE_MODELS.get(model_key.lower())
    if model_name:
        current_model = model_name
        return True, f"Modelo alterado para: {model_name}"
    return False, f"Modelo '{model_key}' inválido. Use um dos seguintes: {', '.join(AVAILABLE_MODELS.keys())}"

def get_active_model():
    """Retorna o nome do modelo atualmente em uso."""
    return current_model

async def buscar_historico_canal(canal, limit=15):
    """
    Busca o histórico de mensagens e formata para o Gemini.
    O Gemini espera uma alternância entre 'user' e 'model'.
    """
    messages_list = []
    async for message in canal.history(limit=limit):
        if len(message.content) > 1000: # Ignora mensagens muito longas
            continue

        # Alterna entre 'user' para mensagens de humanos e 'model' para respostas do bot
        role = "model" if message.author.bot else "user"
        
        # Garante que não haja duas mensagens seguidas do mesmo 'role'
        if messages_list and messages_list[-1]['role'] == role:
            # Concatena mensagens do mesmo autor para manter o fluxo do chat
            messages_list[-1]['parts'][-1] += f"\n{message.content}"
        else:
            messages_list.append({
                "role": role,
                "parts": [message.content]
            })

    messages_list.reverse()
    return messages_list

def ask_gemini(mensagens):
    """Envia o histórico de mensagens para a API do Gemini e retorna a resposta."""
    if not GEMINI_API_KEY:
        return "⚠️ A API Key do Google Gemini não foi configurada. Verifique o arquivo .env."

    try:
        # Inicializa o modelo generativo com o modelo ativo
        model = genai.GenerativeModel(
            get_active_model(),
            system_instruction="Você é um assistente virtual dentro de um servidor Discord. Seja claro, útil e amigável."
        )
        
        # O histórico já formatado é passado para iniciar o chat
        chat = model.start_chat(history=mensagens[:-1]) # Inicia o chat com todo o histórico, exceto a última mensagem
        
        # Envia a última mensagem do usuário para obter uma resposta
        response = chat.send_message(mensagens[-1]['parts'])
        
        return response.text
    except Exception as e:
        print(f"[Gemini ERRO] {e}")
        return "⚠️ Houve um erro ao gerar a resposta com o Gemini. Tente novamente mais tarde."