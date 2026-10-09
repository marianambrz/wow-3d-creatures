import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@/server/auth";

const requestSchema = z.object({
  question: z.string().trim().min(1).max(1200),
  species: z.string().trim().min(1).max(60),
  observations: z.array(z.object({
    title: z.string().trim().max(100),
    details: z.string().trim().max(500),
    date: z.string().max(10),
    mood: z.enum(["positive", "neutral", "concern"]).optional(),
    severity: z.number().int().min(1).max(5).optional(),
  })).max(10),
});

const requestTimes = new Map<string, number[]>();

export const Route = createFileRoute("/api/animal-assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return Response.json({ error: "Entre na sua conta para usar o assistente." }, { status: 401 });

        const times = (requestTimes.get(session.user.id) ?? []).filter((time) => Date.now() - time < 60_000);
        if (times.length >= 10) return Response.json({ error: "Voc\u00ea atingiu o limite tempor\u00e1rio. Aguarde um minuto e tente novamente." }, { status: 429 });

        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Confira a pergunta e tente novamente." }, { status: 400 });

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return Response.json({ error: "O assistente de IA ainda n\u00e3o est\u00e1 configurado. Adicione OPENAI_API_KEY ao .env e reinicie o servidor." }, { status: 503 });
        requestTimes.set(session.user.id, [...times, Date.now()]);

        const { question, species, observations } = parsed.data;
        const context = JSON.stringify({ species, recentObservations: observations });
        try {
          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || "gpt-6-astra",
              instructions: "Voc\u00ea \u00e9 um assistente educativo de observa\u00e7\u00e3o do bem-estar animal. Responda em portugu\u00eas brasileiro, com empatia e clareza. Ajude a organizar comportamentos e sinais, sugira quais detalhes observar e quando conversar com um veterin\u00e1rio. N\u00e3o diagnostique, n\u00e3o prescreva medicamentos ou doses e n\u00e3o recomende interromper tratamento. Se houver relato de risco imediato ou piora intensa, recomende atendimento veterin\u00e1rio urgente. Explique que uma conversa online n\u00e3o substitui avalia\u00e7\u00e3o profissional.",
              input: `Contexto registrado do animal (dados fornecidos pelo tutor): ${context}\n\nPergunta: ${question}`,
              max_output_tokens: 500,
              store: false,
            }),
            signal: AbortSignal.timeout(25_000),
          });
          if (!response.ok) {
            console.error("Animal assistant provider returned status", response.status);
            return Response.json({ error: "O servi\u00e7o de IA n\u00e3o respondeu. Tente novamente em instantes." }, { status: 502 });
          }
          const result = await response.json() as { output?: { content?: { type?: string; text?: string }[] }[] };
          const answer = result.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
          if (!answer) return Response.json({ error: "N\u00e3o consegui gerar uma resposta agora. Tente reformular a pergunta." }, { status: 502 });
          return Response.json({ answer });
        } catch {
          return Response.json({ error: "N\u00e3o foi poss\u00edvel conectar ao servi\u00e7o de IA. Confira a conex\u00e3o e tente novamente." }, { status: 502 });
        }
      },
    },
  },
});
