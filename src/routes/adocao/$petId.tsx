import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckCircle2, Heart, MapPin, PawPrint, Ruler, Send } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { petAge, readPets, registerAdoptionInterest, SPECIES_NAMES, type Pet } from "@/lib/pets";

export const Route = createFileRoute("/adocao/$petId")({ component: AdoptionPetPage });

function AdoptionPetPage() {
  const { petId } = Route.useParams();
  const [pets, setPets] = useState<Pet[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setPets(readPets()), []);
  const pet = pets.find((item) => item.id === petId && item.adoptionAvailable);

  const submitInterest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pet) return;
    const form = new FormData(event.currentTarget);
    try {
      registerAdoptionInterest({ petId, name: String(form.get("name")).trim(), email: String(form.get("email")).trim(), phone: String(form.get("phone")).trim(), message: String(form.get("message")).trim() });
      setSubmitted(true); setError("");
    } catch {
      setError("Não foi possível registrar seu interesse neste navegador. Tente novamente.");
    }
  };

  if (!pet) return <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground"><section className="max-w-md text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><PawPrint className="h-7 w-7"/></span><h1 className="mt-5 font-display text-2xl font-semibold">Perfil indisponível</h1><p className="mt-2 text-sm text-muted-foreground">Este pet não está mais disponível ou o link não é válido.</p><Link to="/adocao/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><ArrowLeft className="h-4 w-4"/>Ver pets para adoção</Link></section></main>;

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-10"><header className="mb-7 flex items-center justify-between"><Link to="/adocao/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>Todos os pets</Link><span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"><Heart className="h-3.5 w-3.5"/>Disponível para adoção</span></header>
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="overflow-hidden rounded-3xl border border-border bg-card"><div className="relative h-72 bg-gradient-to-br from-emerald-950 to-slate-800 sm:h-[440px]">{pet.photo ? <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-primary/80"><PawPrint className="h-20 w-20"/></div>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Conheça meu perfil</p><h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">{pet.name}</h1></div></div><div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:p-7"><Info icon={<PawPrint className="h-4 w-4"/>} label="Espécie" value={SPECIES_NAMES[pet.species] ?? pet.species}/><Info icon={<CalendarDays className="h-4 w-4"/>} label="Idade" value={petAge(pet.birthDate)}/><Info icon={<Ruler className="h-4 w-4"/>} label="Porte" value={pet.size || "Não informado"}/><Info icon={<Heart className="h-4 w-4"/>} label="Raça" value={pet.breed || "Sem raça definida"}/><Info icon={<MapPin className="h-4 w-4"/>} label="Cidade" value={pet.city || "Não informada"}/></div><div className="border-t border-border p-5 sm:p-7"><h2 className="font-display text-xl font-semibold">Sobre {pet.name}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{pet.description || "O tutor ainda não adicionou uma descrição."}</p></div></div>
      <aside className="h-fit rounded-3xl border border-border bg-card p-6 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Heart className="h-6 w-6"/></span><h2 className="mt-5 font-display text-2xl font-semibold">{submitted ? "Interesse registrado!" : `Quer conhecer ${pet.name}?`}</h2>{submitted ? <div role="status" className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5"><CheckCircle2 className="h-6 w-6 text-primary"/><p className="mt-3 text-sm font-semibold">Obrigado por abrir seu coração.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Seu interesse foi salvo neste dispositivo. O tutor poderá entrar em contato usando os dados informados.</p><p className="mt-3 text-xs text-muted-foreground">Este protótipo registra a solicitação localmente; o envio de notificações ainda não está conectado.</p></div> : <><p className="mt-2 text-sm leading-6 text-muted-foreground">Conte um pouco sobre você e por que gostaria de adotar. O tutor receberá sua manifestação de interesse.</p><form onSubmit={submitInterest} className="mt-6 space-y-4"><label className="block text-sm font-medium">Seu nome<input name="name" required maxLength={100} autoComplete="name" placeholder="Nome completo" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label><label className="block text-sm font-medium">E-mail<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="voce@exemplo.com" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label><label className="block text-sm font-medium">Telefone<input name="phone" required type="tel" maxLength={30} autoComplete="tel" placeholder="(11) 99999-9999" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label><label className="block text-sm font-medium">Mensagem<textarea name="message" required minLength={10} maxLength={1500} rows={4} placeholder={`Conte por que você gostaria de adotar ${pet.name}...`} className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"><Send className="h-4 w-4"/>Quero adotar {pet.name}</button></form></>}</aside>
    </section><p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Adoção responsável pede diálogo e planejamento. Combine os próximos passos com o tutor e tire suas dúvidas antes de decidir.</p>
  </div></main>;
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/60 p-3"><p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon}{label}</p><p className="mt-1.5 text-sm font-semibold">{value}</p></div>;
}
