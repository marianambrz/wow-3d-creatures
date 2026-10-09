import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowLeft, CalendarDays, Heart, PawPrint, Pill, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { petAge, readPets, SPECIES_NAMES, writePets, type Pet, type PetRecord } from "@/lib/pets";

export const Route = createFileRoute("/pets/$petId")({ component: PetDashboard });

type RecordGroup = "activities" | "observations" | "veterinaryVisits" | "medications" | "vaccinations";
const inputClass = "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
const panelClass = "rounded-2xl border border-border bg-card p-5 sm:p-6";
const emptyRecords: Record<RecordGroup, PetRecord[]> = {
  activities: [], observations: [], veterinaryVisits: [], medications: [], vaccinations: [],
};

function PetDashboard() {
  const { petId } = Route.useParams();
  const [pets, setPets] = useState<Pet[]>([]);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => setPets(readPets()), []);
  const pet = pets.find((item) => item.id === petId);

  const updatePet = (update: (current: Pet) => Pet) => {
    const storedPets = readPets();
    const sourcePets = storedPets.some((item) => item.id === petId) ? storedPets : pets;
    const currentPet = sourcePets.find((item) => item.id === petId);
    if (!currentPet) {
      setNotice("N\u00e3o foi poss\u00edvel salvar: pet n\u00e3o encontrado.");
      return;
    }
    const next = sourcePets.map((item) => item.id === petId ? update(currentPet) : item);
    try {
      writePets(next);
      setPets(next);
      setNotice("Altera\u00e7\u00f5es salvas neste dispositivo.");
    } catch {
      setNotice("N\u00e3o foi poss\u00edvel salvar. Verifique o espa\u00e7o dispon\u00edvel no navegador e tente novamente.");
    }
  };

  const addRecord = (group: RecordGroup, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const record: PetRecord = {
      id: crypto.randomUUID(),
      title: String(values.get("title") ?? "").trim(),
      details: [values.get("dose"), values.get("details")].map((value) => String(value ?? "").trim()).filter(Boolean).join(" · "),
      date: String(values.get("date") ?? new Date().toISOString().slice(0, 10)),
      createdAt: new Date().toISOString(),
      ...(values.get("nextDose") ? { nextDose: String(values.get("nextDose")) } : {}),
      ...(values.get("mood") ? { mood: String(values.get("mood")) as PetRecord["mood"] } : {}),
      ...(values.get("severity") ? { severity: Number(values.get("severity")) } : {}),
    };
    if (!record.title) return;
    updatePet((current) => ({ ...current, [group]: [record, ...(current[group] ?? [])] }));
    form.reset();
  };

  const deleteRecord = (group: RecordGroup, id: string) => {
    if (!window.confirm("Excluir este registro?")) return;
    updatePet((current) => ({ ...current, [group]: (current[group] ?? []).filter((item) => item.id !== id) }));
  };

  const observations = pet?.observations ?? emptyRecords.observations;
  const chartData = useMemo(() => observations.slice(0, 14).reverse().map((item) => ({
    label: new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    score: Math.max(0, Math.min(100, item.mood === "positive" ? 82 : item.mood === "concern" ? 30 : 58) - ((item.severity ?? 1) - 1) * 8),
  })), [observations]);
  const chartPoints = chartData.map((point, index) => `${chartData.length <= 1 ? 350 : 20 + index * (660 / (chartData.length - 1))},${130 - point.score}`).join(" ");
  const askAssistant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || !pet || assistantBusy) return;
    setAssistantBusy(true);
    setAnswer("");
    try {
      const response = await fetch("/api/animal-assistant", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          species: SPECIES_NAMES[pet.species] ?? pet.species,
          observations: observations.slice(0, 10),
        }),
      });
      const result = await response.json() as { answer?: string; error?: string };
      setAnswer(result.answer ?? result.error ?? "N\u00e3o foi poss\u00edvel obter uma resposta.");
    } catch {
      setAnswer("N\u00e3o foi poss\u00edvel conectar ao assistente. Confira a conex\u00e3o e tente novamente.");
    } finally {
      setAssistantBusy(false);
    }
  };

  if (!pet) return <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground"><section className="max-w-md text-center"><PawPrint className="mx-auto h-12 w-12 text-primary"/><h1 className="mt-5 font-display text-2xl font-semibold">Pet n\u00e3o encontrado</h1><p className="mt-2 text-sm text-muted-foreground">Esse perfil n\u00e3o est\u00e1 salvo neste dispositivo.</p><Link to="/pets/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><ArrowLeft className="h-4 w-4"/>Voltar para meus pets</Link></section></main>;

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto max-w-6xl space-y-6 px-5 py-7 sm:px-8 lg:py-10">
    <header className="flex flex-wrap items-center justify-between gap-4"><Link to="/pets/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>Meus pets</Link><Link to="/adocao/" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary">Ver ado\u00e7\u00f5es</Link></header>
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary text-primary">{pet.photo ? <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover"/> : <PawPrint className="h-10 w-10"/>}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Prontu\u00e1rio e bem-estar</p><h1 className="mt-2 font-display text-3xl font-semibold">{pet.name}</h1><p className="mt-1 text-sm text-muted-foreground">{SPECIES_NAMES[pet.species] ?? pet.species}{pet.breed ? ` · ${pet.breed}` : ""} · {petAge(pet.birthDate)}</p></div><button type="button" onClick={() => { setAnalysisOpen(true); setAnswer(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"><Sparkles className="h-4 w-4"/>Assistente de sinais</button></section>
    {notice && <p role="status" className="text-sm text-primary">{notice}</p>}

    <section className={panelClass}><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/><div><h2 className="font-display text-xl font-semibold">Comportamento, sinais e sintomas</h2><p className="text-xs text-muted-foreground">Registre o que observou para acompanhar mudan\u00e7as ao longo do tempo.</p></div></div>
      <form onSubmit={(event) => addRecord("observations", event)} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><label className="text-xs font-medium">Comportamento ou sinal<input name="title" required maxLength={100} placeholder="Ex.: apetite reduzido" className={inputClass}/></label><label className="text-xs font-medium">Data<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass}/></label><label className="text-xs font-medium">Como parece<select name="mood" className={inputClass}><option value="neutral">Sem mudan\u00e7a clara</option><option value="positive">Bem disposto</option><option value="concern">Precisa de aten\u00e7\u00e3o</option></select></label><label className="text-xs font-medium">Intensidade (1 a 5)<select name="severity" className={inputClass}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label><label className="text-xs font-medium sm:col-span-2 lg:col-span-1">Detalhes<textarea name="details" maxLength={500} rows={1} placeholder="Contexto, dura\u00e7\u00e3o..." className={inputClass}/></label><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2 lg:col-span-5"><Plus className="h-4 w-4"/>Registrar observa\u00e7\u00e3o</button></form>
      <div className="mt-6 rounded-xl border border-border bg-background/50 p-4"><h3 className="text-sm font-semibold">Tend\u00eancia das observa\u00e7\u00f5es</h3>{chartData.length ? <><svg viewBox="0 0 700 150" className="mt-3 h-44 w-full" role="img" aria-label="Gr\u00e1fico de tend\u00eancia de bem-estar"><path d="M20 30H680 M20 75H680 M20 120H680" stroke="currentColor" strokeOpacity=".12"/><polyline points={chartPoints} fill="none" stroke="#3fd69a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{chartData.map((point, index) => <circle key={`${point.label}-${index}`} cx={chartData.length <= 1 ? 350 : 20 + index * (660 / (chartData.length - 1))} cy={130 - point.score} r="5" fill="#3fd69a"><title>{point.label}: {point.score}/100</title></circle>)}</svg><div className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">{chartData.map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}</div></> : <p className="mt-2 text-sm text-muted-foreground">O gr\u00e1fico aparece quando voc\u00ea registrar observa\u00e7\u00f5es.</p>}</div>
      <RecordList records={observations} onDelete={(id) => deleteRecord("observations", id)} empty="Nenhuma observa\u00e7\u00e3o registrada."/>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"/>O gr\u00e1fico organiza relatos e n\u00e3o mede a sa\u00fade. N\u00e3o substitui exame nem diagn\u00f3stico veterin\u00e1rio.</p>
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <RecordSection title="Cuidados Veterinários" icon={<Heart className="h-5 w-5 text-primary"/>} records={pet.veterinaryVisits ?? emptyRecords.veterinaryVisits} onAdd={(event) => addRecord("veterinaryVisits", event)} onDelete={(id) => deleteRecord("veterinaryVisits", id)} fields="care"/>
      <RecordSection title="Medicações" icon={<Pill className="h-5 w-5 text-primary"/>} records={pet.medications ?? emptyRecords.medications} onAdd={(event) => addRecord("medications", event)} onDelete={(id) => deleteRecord("medications", id)} fields="medication"/>
      <RecordSection title="Carteira de Vacinação" icon={<CalendarDays className="h-5 w-5 text-primary"/>} records={pet.vaccinations ?? emptyRecords.vaccinations} onAdd={(event) => addRecord("vaccinations", event)} onDelete={(id) => deleteRecord("vaccinations", id)} fields="vaccine"/>
      <RecordSection title="Diário de Atividades" icon={<Activity className="h-5 w-5 text-primary"/>} records={pet.activities ?? emptyRecords.activities} onAdd={(event) => addRecord("activities", event)} onDelete={(id) => deleteRecord("activities", id)} fields="diary"/>
    </div>

    <section className={panelClass}><h2 className="font-display text-xl font-semibold">Dados do pet</h2><form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updatePet((current) => ({ ...current, name: String(values.get("name")).trim(), tutorName: String(values.get("tutorName") ?? "").trim(), species: String(values.get("species")), breed: String(values.get("breed")).trim(), birthDate: String(values.get("birthDate")) })); }}><label className="text-xs font-medium">Nome do pet<input name="name" required defaultValue={pet.name} className={inputClass}/></label><label className="text-xs font-medium">Nome do tutor<input name="tutorName" maxLength={100} defaultValue={pet.tutorName ?? ""} className={inputClass}/></label><label className="text-xs font-medium">Esp\u00e9cie<select name="species" defaultValue={pet.species} className={inputClass}>{Object.entries(SPECIES_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label className="text-xs font-medium">Ra\u00e7a<input name="breed" defaultValue={pet.breed} className={inputClass}/></label><label className="text-xs font-medium">Nascimento<input name="birthDate" type="date" defaultValue={pet.birthDate} className={inputClass}/></label><button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2 lg:col-span-4">Salvar dados do pet</button></form></section>

    <section className={panelClass}><h2 className="font-display text-xl font-semibold">Ado\u00e7\u00e3o</h2><p className="mt-1 text-sm text-muted-foreground">Publique ou retire este perfil da lista p\u00fablica de ado\u00e7\u00e3o.</p><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updatePet((current) => ({ ...current, adoptionAvailable: values.get("available") === "on", size: String(values.get("size")), city: String(values.get("city")).trim(), description: String(values.get("description")).trim() })); }}><label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input name="available" type="checkbox" defaultChecked={pet.adoptionAvailable} className="h-4 w-4 accent-emerald-400"/>Dispon\u00edvel para ado\u00e7\u00e3o</label><label className="text-xs font-medium">Porte<input name="size" defaultValue={pet.size} className={inputClass}/></label><label className="text-xs font-medium">Cidade<input name="city" defaultValue={pet.city} className={inputClass}/></label><label className="text-xs font-medium sm:col-span-2">Descri\u00e7\u00e3o<textarea name="description" defaultValue={pet.description} maxLength={1000} rows={3} className={inputClass}/></label><button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:col-span-2">Salvar perfil do pet</button></form></section>
  </div>
  {analysisOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setAnalysisOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="assistant-title" className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl"><div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-primary"/><h2 id="assistant-title" className="font-display text-2xl font-semibold">Assistente de bem-estar com IA</h2></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Pergunte sobre comportamento ou sinais. Sua pergunta, a esp\u00e9cie e at\u00e9 10 observa\u00e7\u00f5es recentes ser\u00e3o enviadas ao servi\u00e7o de IA para gerar a resposta. N\u00e3o inclua dados pessoais.</p><form onSubmit={askAssistant} className="mt-5 space-y-3"><label className="sr-only" htmlFor="pet-question">Sua d\u00favida</label><textarea id="pet-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={1200} placeholder="Conte o sinal ou comportamento que observou..." className={inputClass}/><button disabled={assistantBusy || !question.trim()} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{assistantBusy ? "Consultando..." : "Consultar assistente"}</button></form>{answer && <p role="status" className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">{answer}</p>}<button type="button" onClick={() => setAnalysisOpen(false)} className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary">Fechar</button></section></div>}
  </main>;
}

function RecordSection({ title, icon, records, onAdd, onDelete, fields }: { title: string; icon: ReactNode; records: PetRecord[]; onAdd: (event: FormEvent<HTMLFormElement>) => void; onDelete: (id: string) => void; fields: "care" | "medication" | "vaccine" | "diary" }) {
  const medication = fields === "medication";
  const vaccine = fields === "vaccine";
  const diary = fields === "diary";
  return <section className={panelClass}>
    <div className="flex items-center gap-2">{icon}<h2 className="font-display text-lg font-semibold">{title}</h2></div>
    <form onSubmit={onAdd} className="mt-4 space-y-3">
      <label className="block text-xs font-medium">{diary ? "Atividade" : medication ? "Medicamento" : vaccine ? "Vacina" : "Consulta ou cuidado"}<input name="title" required maxLength={120} placeholder={diary ? "Ex.: passeio e apetite" : "Nome ou motivo"} className={inputClass}/></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium">{vaccine ? "Data aplicada" : medication ? "In\u00edcio" : "Data"}<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass}/></label>
        {medication && <label className="text-xs font-medium">Dose e frequ\u00eancia<input name="dose" placeholder="Conforme receita" className={inputClass}/></label>}
        {vaccine && <label className="text-xs font-medium">Pr\u00f3xima dose<input name="nextDose" type="date" className={inputClass}/></label>}
      </div>
      <label className="block text-xs font-medium">{vaccine ? "Observa\u00e7\u00f5es" : medication ? "Orienta\u00e7\u00e3o / fim do tratamento" : diary ? "Detalhes" : "Profissional e observa\u00e7\u00f5es"}<textarea name="details" maxLength={600} rows={2} className={inputClass}/></label>
      <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4"/>Adicionar</button>
    </form>
    <RecordList records={records} onDelete={onDelete} empty="Nenhum registro cadastrado."/>
  </section>;
}

function RecordList({ records, onDelete, empty }: { records: PetRecord[]; onDelete: (id: string) => void; empty: string }) {
  return <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">{records.length === 0 && <li className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">{empty}</li>}{records.map((record) => <li key={record.id} className="flex items-start gap-2 rounded-lg border border-border bg-background/60 p-3"><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{record.title}</p><p className="text-[11px] text-muted-foreground">{record.date ? new Date(`${record.date}T12:00:00`).toLocaleDateString("pt-BR") : "Data n\u00e3o informada"}{record.severity ? ` · intensidade ${record.severity}/5` : ""}</p>{record.nextDose && <p className="mt-1 text-xs text-muted-foreground">Proxima dose: {new Date(record.nextDose + "T12:00:00").toLocaleDateString("pt-BR")}</p>}{record.details && <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{record.details}</p>}</div><button type="button" onClick={() => onDelete(record.id)} aria-label={`Excluir ${record.title}`} title="Excluir registro" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4"/></button></li>)}</ul>;
}
