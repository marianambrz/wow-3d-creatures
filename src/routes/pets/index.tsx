import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Cat, Dog, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { petAge, readPets, SPECIES_NAMES, writePets, type Pet } from "@/lib/pets";

export const Route = createFileRoute("/pets/")({ component: PetsPage });

function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [photo, setPhoto] = useState("");
  const [notice, setNotice] = useState("");
  const [adoptionEnabled, setAdoptionEnabled] = useState(false);

  useEffect(() => setPets(readPets()), []);

  const filteredPets = useMemo(() => pets.filter((pet) => `${pet.name} ${pet.species} ${pet.breed}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [pets, query]);

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setNotice("Escolha um arquivo de imagem."); return; }
    if (file.size > 4 * 1024 * 1024) { setNotice("A foto deve ter até 4 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(String(reader.result)); setNotice(""); };
    reader.readAsDataURL(file);
  };

  const createPet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pet: Pet = {
      id: crypto.randomUUID(), name: String(form.get("name")).trim(), tutorName: String(form.get("tutorName") ?? "").trim(), species: String(form.get("species")),
      breed: String(form.get("breed")).trim(), birthDate: String(form.get("birthDate")), photo,
      createdAt: new Date().toISOString(),
      adoptionAvailable: form.get("adoptionAvailable") === "on",
      size: String(form.get("size") ?? ""), city: String(form.get("city") ?? "").trim(), description: String(form.get("description") ?? "").trim(),
    };
    const nextPets = [pet, ...pets];
    writePets(nextPets); setPets(nextPets); setModalOpen(false); setPhoto(""); setNotice("");
  };

  const deletePet = (pet: Pet) => {
    if (!window.confirm(`Excluir o perfil de ${pet.name} e todos os registros?`)) return;
    const nextPets = pets.filter((item) => item.id !== pet.id);
    writePets(nextPets);
    setPets(nextPets);
  };

  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold text-foreground"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Dog className="h-5 w-5" /></span><span>Animal Controller</span></Link>
        <div className="flex items-center gap-3"><Link to="/adocao/" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary/50">Ver pets para adoção</Link><span className="rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">Espaço do tutor</span></div>
      </header>
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-primary">Bem-estar, de perto</p><h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Meus pets<span className="text-primary">.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Um espaço especial para acompanhar a rotina e o bem-estar de cada companheiro.</p></div>
        <button onClick={() => { setNotice(""); setAdoptionEnabled(false); setModalOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:brightness-110"><Plus className="h-4 w-4" /> Cadastrar pet</button>
      </section>
      <section className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/70 p-4">
        <div><p className="font-display text-lg font-semibold">Sua família</p><p className="mt-1 text-xs text-muted-foreground">{pets.length} {pets.length === 1 ? "pet cadastrado" : "pets cadastrados"}</p></div>
        <label className="flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 sm:max-w-xs"><Search className="h-4 w-4 text-muted-foreground"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pet..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      </section>
      {filteredPets.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredPets.map((pet) => <article key={pet.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-black/10">
        <button type="button" onClick={() => deletePet(pet)} aria-label={`Excluir ${pet.name}`} title="Excluir pet" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur hover:bg-destructive"><Trash2 className="h-4 w-4"/></button>
        <Link to="/pets/$petId" params={{ petId: pet.id }} className="block">
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-950 to-slate-800">{pet.photo ? <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-primary/80">{pet.species === "cat" ? <Cat className="h-16 w-16"/> : <Dog className="h-16 w-16"/>}</div>}<span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">{SPECIES_NAMES[pet.species] ?? pet.species}</span>{pet.adoptionAvailable && <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Disponível para adoção</span>}</div>
        <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">{pet.name}</h2><p className="mt-1 text-sm text-muted-foreground">{pet.breed || SPECIES_NAMES[pet.species]}</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight className="h-4 w-4"/></span></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs"><span className="text-muted-foreground">Idade</span><span className="font-semibold">{petAge(pet.birthDate)}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Prontuário com cuidados veterinários, medicações, carteira de vacinação e diário de atividades.</p>{pet.adoptionAvailable && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5"/>{pet.city || "Cidade não informada"} · {pet.size || "Porte não informado"}</p>}</div>
      </Link></article>)}</div> : <div className="rounded-3xl border border-dashed border-border bg-card/40 px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Dog className="h-7 w-7"/></span><h2 className="mt-5 font-display text-xl font-semibold">{query ? "Nenhum pet encontrado" : "Seu primeiro melhor amigo começa aqui"}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{query ? "Tente buscar por outro nome ou espécie." : "Cadastre seu pet para começar a acompanhar humor, rotina e sinais importantes."}</p>{!query && <button onClick={() => { setAdoptionEnabled(false); setModalOpen(true); }} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Cadastrar meu primeiro pet</button>}</div>}
    </div>
    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="new-pet-title" className="my-6 w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl sm:p-8"><header className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Novo pet</p><h2 id="new-pet-title" className="mt-2 font-display text-2xl font-semibold">Cadastrar pet</h2><p className="mt-1 text-sm text-muted-foreground">Preencha os dados do seu companheiro.</p></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5"/></button></header>
      <form onSubmit={createPet} className="space-y-4"><label className="block text-sm font-medium">Nome do pet<input name="name" required maxLength={60} placeholder="Ex.: Amora" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label><label className="block text-sm font-medium">Nome do tutor<input name="tutorName" maxLength={100} placeholder="Ex.: Ana Silva" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Espécie<select name="species" required className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring">{Object.entries(SPECIES_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label className="block text-sm font-medium">Raça<input name="breed" maxLength={60} placeholder="Ex.: Sem raça definida" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/></label></div><label className="block text-sm font-medium">Data de nascimento<input name="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"/><span className="mt-1 block text-xs text-muted-foreground">Se não souber a data exata, deixe em branco.</span></label>
      <div><span className="block text-sm font-medium">Foto do pet</span><label className="mt-2 flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border bg-card p-3 hover:border-primary/60"><span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-muted-foreground">{photo ? <img src={photo} alt="Prévia da foto" className="h-full w-full object-cover"/> : <Camera className="h-5 w-5"/>}</span><span className="text-xs text-muted-foreground">{photo ? "Foto selecionada · clique para trocar" : "Escolher foto · JPG ou PNG, até 4 MB"}</span><input type="file" accept="image/*" className="sr-only" onChange={(event) => choosePhoto(event.target.files?.[0])}/></label></div>
      <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><input name="adoptionAvailable" type="checkbox" checked={adoptionEnabled} onChange={(event) => setAdoptionEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-400"/><span><span className="block text-sm font-semibold">Disponível para adoção</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Este perfil ficará visível na seção pública de adoção.</span></span></label>
      {adoptionEnabled && <div className="space-y-4 rounded-xl border border-border p-4"><p className="text-sm font-semibold">Dados para adoção</p><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Porte do pet<select name="size" required className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3"><option value="">Selecione</option><option>Pequeno</option><option>Médio</option><option>Grande</option></select></label><label className="block text-sm font-medium">Cidade<input name="city" required maxLength={80} placeholder="Ex.: Campinas, SP" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3"/></label></div><label className="block text-sm font-medium">Descrição para adoção<textarea name="description" required maxLength={1000} rows={3} placeholder="Conte sobre a personalidade, rotina e o lar ideal para ele..." className="mt-2 w-full resize-y rounded-xl border border-border bg-card px-4 py-3"/></label></div>}
      {notice && <p role="alert" className="text-sm text-destructive">{notice}</p>}<div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary">Cancelar</button><button type="submit" className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Salvar pet</button></div></form></section></div>}
  </main>;
}
