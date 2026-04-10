"""
Agente simple con el SDK de Anthropic.
Usa el tool runner (beta) para manejar el bucle automáticamente.
"""

import anthropic
from anthropic import beta_tool


client = anthropic.Anthropic()  # lee ANTHROPIC_API_KEY del entorno


# 1. Definir herramientas con el decorador @beta_tool
#    El docstring y los tipos de Python generan el schema JSON automáticamente.

@beta_tool
def obtener_clima(ciudad: str) -> str:
    """Obtiene el clima actual de una ciudad.

    Args:
        ciudad: Nombre de la ciudad, por ejemplo 'Madrid' o 'Buenos Aires'.
    """
    # En producción llamarías a una API real aquí
    climas = {
        "madrid": "22°C y soleado",
        "buenos aires": "18°C y nublado",
        "ciudad de mexico": "25°C y parcialmente nublado",
    }
    return climas.get(ciudad.lower(), f"No tengo datos del clima para {ciudad}")


@beta_tool
def sumar(a: int, b: int) -> str:
    """Suma dos números enteros.

    Args:
        a: Primer número.
        b: Segundo número.
    """
    resultado = a + b
    return f"{a} + {b} = {resultado}"


# 2. Crear el tool runner
#    Maneja automáticamente: llamada a Claude → ejecución de tools → respuesta final
runner = client.beta.messages.tool_runner(
    model="claude-opus-4-6",
    max_tokens=4096,
    tools=[obtener_clima, sumar],
    messages=[
        {"role": "user", "content": "¿Cuál es el clima en Madrid? Y de paso, ¿cuánto es 47 + 83?"}
    ],
)

# 3. Iterar sobre los mensajes del agente
print("=== Respuesta del agente ===\n")
for mensaje in runner:
    for bloque in mensaje.content:
        if bloque.type == "text":
            print(bloque.text)
