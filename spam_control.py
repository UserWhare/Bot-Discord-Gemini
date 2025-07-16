import time

cooldown_por_canal = {}

COOLDOWN_TEMPO = 10  # segundos

def pode_enviar_resposta(channel_id):
    agora = time.time()
    ultimo_uso = cooldown_por_canal.get(channel_id, 0)
    return (agora - ultimo_uso) >= COOLDOWN_TEMPO

def registrar_envio(channel_id):
    cooldown_por_canal[channel_id] = time.time()
