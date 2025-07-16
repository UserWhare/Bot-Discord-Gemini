import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("bot_interacoes.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

def log_interaction(tipo, message, resposta=None):
    if tipo == "mensagem":
        logging.info(f"[MSG] {message.author} ({message.channel}): \"{message.content}\"")
    elif tipo == "resposta" and resposta:
        logging.info(f"[RESPOSTA] Para {message.author}: \"{resposta}\"")
