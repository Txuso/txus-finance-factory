import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildFinancialContext } from "@/lib/data/ai-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// claude-3-haiku-20240307: confirmed working with this API key
const MODEL = "claude-3-haiku-20240307";

const SYSTEM_INSTRUCTION = `Eres el Consultor Financiero Personal de Txus Finance Factory.
Tu función es analizar los datos financieros reales del usuario y dar asesoramiento personalizado y PRECISO.

DEFINICIONES CRÍTICAS (debes usarlas SIEMPRE de forma consistente):
- AHORRO = Ingresos del mes - Gastos fijos - Gastos variables
  ⚠️ Las INVERSIONES (Indexa Capital, fondos, etc.) NO se restan del ahorro. Son riqueza acumulada, no un gasto.
- FLUJO NETO DE CAJA = Ahorro - Inversiones (la variación real del saldo bancario)
- INVERSIÓN = dinero que va a generar rentabilidad futura. Siempre es una acción POSITIVA.

REGLAS DE ANÁLISIS:
- El mes actual (indicado con ⚠️INCOMPLETO en los datos) solo tiene datos parciales. NUNCA saques conclusiones definitivas ni tasas de ahorro para ese mes. Dilo explícitamente al usuario.
- Antes de dar cifras, COMPRUEBA los datos en el contexto. Si algo no cuadra, dilo.
- Usa SIEMPRE los valores de AHORRO del contexto, no FLUJO_NETO, cuando el usuario pregunte por su tasa de ahorro.
- Si ves que un mes tiene ing=0€ probablemente es que los datos están incompletos o la nómina llegó en otro mes.

REGLAS DE COMUNICACIÓN:
- Responde SIEMPRE en español
- Sé directo, práctico y concreto con cifras reales. Cita los meses exactos.
- Usa emojis estratégicamente (no abuses)
- Máximo 300 palabras salvo que el usuario pida análisis detallado
- Termina SIEMPRE con una recomendación accionable concreta`;

export async function POST(req: NextRequest) {
    try {
        // 1. Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // 2. Parse request
        const { messages } = await req.json() as {
            messages: Array<{ role: "user" | "model"; content: string }>;
        };

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "No hay mensajes" }, { status: 400 });
        }

        // 3. Build financial context (all historical data)
        const financialContext = await buildFinancialContext(user.id);

        // 4. Convert messages to Anthropic format
        // Anthropic uses "assistant" instead of "model"
        const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.content,
        }));

        // 5. Stream response from Claude
        const stream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1024,
            system: `${SYSTEM_INSTRUCTION}\n\n${financialContext}`,
            messages: anthropicMessages,
        });

        // 6. Return ReadableStream
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        if (
                            chunk.type === "content_block_delta" &&
                            chunk.delta.type === "text_delta"
                        ) {
                            controller.enqueue(encoder.encode(chunk.delta.text));
                        }
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            }
        });

    } catch (error: any) {
        console.error("Error in /api/chat:", error);
        return NextResponse.json(
            { error: error?.message || "Error interno del servidor" },
            { status: error?.status || 500 }
        );
    }
}
