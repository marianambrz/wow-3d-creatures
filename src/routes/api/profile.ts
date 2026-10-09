import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@/server/auth";
import { readProfile, saveProfile } from "@/server/services/profile-service";

const profileSchema = z.object({
  tutorName: z.string().max(160),
  animalName: z.string().max(160),
  animalAge: z.string().max(80),
  species: z.enum(["dog", "cat", "bird", "rabbit", "guinea-pig", "horse", "hamster"]),
  diary: z.array(z.object({ id: z.string().min(1).max(100), activity: z.string().trim().min(1).max(2000), createdAt: z.string().datetime() })).max(1000),
  vaccinations: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(160), date: z.string().date(), nextDose: z.union([z.string().date(), z.literal("")]) })).max(500),
});

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
        try { return Response.json(await readProfile(session.user.id)); }
        catch { return Response.json({ error: "Não foi possível carregar o perfil." }, { status: 500 }); }
      },
      PUT: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
        const parsed = profileSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Dados de perfil inválidos." }, { status: 400 });
        try { return Response.json(await saveProfile(session.user.id, parsed.data)); }
        catch { return Response.json({ error: "Não foi possível salvar o perfil." }, { status: 500 }); }
      },
    },
  },
});
