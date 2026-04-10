"""
Agente con bucle manual — control total sobre cada tool call.
Útil cuando necesitas: logging, aprobación humana, lógica condicional.
"""

import json
import anthropic

client = anthropic.Anthropic()

# --- Definición de herramientas (schema JSON) ---
HERRAMIENTAS = [
    {
        "name": "buscar_producto",
        "description": "Busca un producto en la base de datos por nombre.",
        "input_schema": {
            "type": "object",
            "properties": {
                "nombre": {
                    "type": "string",
                    "description": "Nombre del producto a buscar"
                }
            },
            "required": ["nombre"]
        }
    },
    {
        "name": "obtener_precio",
        "description": "Obtiene el precio actual de un producto por su ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "producto_id": {
                    "type": "string",
                    "description": "ID único del producto"
                }
            },
            "required": ["producto_id"]
        }
    }
]

# --- Implementación de las herramientas ---
def buscar_producto(nombre: str) -> dict:
    """Simula búsqueda en base de datos."""
    catalogo = {
        "laptop": {"id": "P001", "nombre": "Laptop Pro 15", "stock": 5},
        "teclado": {"id": "P002", "nombre": "Teclado Mecánico RGB", "stock": 12},
        "mouse": {"id": "P003", "nombre": "Mouse Inalámbrico", "stock": 0},
    }
    for clave, producto in catalogo.items():
        if clave in nombre.lower():
            return producto
    return {"error": f"Producto '{nombre}' no encontrado"}


def obtener_precio(producto_id: str) -> dict:
    """Simula consulta de precios."""
    precios = {
        "P001": {"precio": 1299.99, "moneda": "USD"},
        "P002": {"precio": 89.99, "moneda": "USD"},
        "P003": {"precio": 45.00, "moneda": "USD"},
    }
    return precios.get(producto_id, {"error": f"ID {producto_id} no encontrado"})


def ejecutar_herramienta(nombre: str, argumentos: dict) -> str:
    """Despachador: ejecuta la herramienta correcta y devuelve el resultado."""
    print(f"  [TOOL] Ejecutando '{nombre}' con: {argumentos}")

    if nombre == "buscar_producto":
        resultado = buscar_producto(**argumentos)
    elif nombre == "obtener_precio":
        resultado = obtener_precio(**argumentos)
    else:
        resultado = {"error": f"Herramienta '{nombre}' desconocida"}

    return json.dumps(resultado, ensure_ascii=False)


# --- Bucle del agente ---
def ejecutar_agente(pregunta: str) -> str:
    """
    Bucle agentico manual:
    1. Llama a Claude
    2. Si usa herramientas → las ejecuta y continúa
    3. Si termina → devuelve la respuesta final
    """
    mensajes = [{"role": "user", "content": pregunta}]

    print(f"Usuario: {pregunta}\n")

    while True:
        respuesta = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            tools=HERRAMIENTAS,
            messages=mensajes,
        )

        print(f"[stop_reason: {respuesta.stop_reason}]")

        # Claude terminó → devolver respuesta
        if respuesta.stop_reason == "end_turn":
            texto_final = next(
                (b.text for b in respuesta.content if b.type == "text"), ""
            )
            return texto_final

        # Claude quiere usar herramientas
        if respuesta.stop_reason == "tool_use":
            # Agregar la respuesta del asistente al historial
            mensajes.append({"role": "assistant", "content": respuesta.content})

            # Ejecutar todas las herramientas solicitadas
            resultados_tools = []
            for bloque in respuesta.content:
                if bloque.type == "tool_use":
                    resultado = ejecutar_herramienta(bloque.name, bloque.input)
                    resultados_tools.append({
                        "type": "tool_result",
                        "tool_use_id": bloque.id,
                        "content": resultado
                    })

            # Devolver resultados a Claude
            mensajes.append({"role": "user", "content": resultados_tools})
            # → el bucle continúa


# --- Ejecutar ---
if __name__ == "__main__":
    respuesta = ejecutar_agente(
        "¿Tienen laptops disponibles? Si hay, ¿cuál es el precio?"
    )
    print(f"\nAgente: {respuesta}")
