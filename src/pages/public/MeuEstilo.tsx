import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { Service, Barber, Appointment } from '../../types';
import {
  User, Clock, Scissors, ChevronRight, Loader2, Star, Search,
  Phone, Mail, AlertCircle, CheckCircle2, TrendingUp, Award, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';


// ─── Types ───────────────────────────────────────────────────────────────────
interface StyleProfile {
  lastAppointment: Appointment;
  lastBarber: Barber | null;
  lastService: Service | null;
  preferredBarber: Barber | null;
  topServices: { service: Service; count: number }[];
  contact: string;
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────
const PROJECT  = 'gen-lang-client-0254140623';
const DATABASE = 'ai-studio-5c2ed8fc-bae9-41d8-81c1-1806d0f17a5a';
const API_KEY  = 'AIzaSyC0r3tXwA0G61IYyEOOGzOQuBqqLdwpjSE';
const FS_BASE  = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABASE}/documents`;

function fromFirestoreValue(v: any): any {
  if (!v) return null;
  if (v.stringValue  !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue  !== undefined) return Number(v.doubleValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue    !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if (v.mapValue)   return Object.fromEntries(
    Object.entries(v.mapValue.fields || {}).map(([k, val]) => [k, fromFirestoreValue(val)])
  );
  return null;
}

function docFromRest(d: any): any {
  const id = d.name.split('/').pop();
  const fields = Object.fromEntries(
    Object.entries(d.fields || {}).map(([k, v]) => [k, fromFirestoreValue(v)])
  );
  return { id, ...fields };
}

async function runQuery(collection: string, field: string, value: string): Promise<any[]> {
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: 'EQUAL',
          value: { stringValue: value }
        }
      }
    }
  };
  const res = await fetch(`${FS_BASE}:runQuery?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json: any[] = await res.json();
  return json.filter(r => r.document).map(r => docFromRest(r.document));
}

// ─── Normalization ────────────────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().+]/g, '');
}

function isEmail(input: string): boolean {
  return input.includes('@');
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const ACTIVE_STATUSES = ['completed', 'confirmed', 'pending_confirmation', 'on_the_way'];
const STATUS_PRIORITY: Record<string, number> = {
  completed: 0, confirmed: 1, pending_confirmation: 2, on_the_way: 3,
  cancellation_requested: 99, cancelled: 99, no_show: 99
};

const statusLabels: Record<string, string> = {
  pending_confirmation: 'Aguardando Confirmação',
  confirmed: 'Confirmado',
  cancellation_requested: 'Cancelamento Solicitado',
  on_the_way: 'A Caminho',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu'
};

const statusColors: Record<string, string> = {
  pending_confirmation: 'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-green-400 bg-green-400/10',
  cancellation_requested: 'text-red-400 bg-red-400/10',
  on_the_way: 'text-blue-400 bg-blue-400/10',
  completed: 'text-emerald-400 bg-emerald-400/10',
  cancelled: 'text-red-500 bg-red-500/10',
  no_show: 'text-neutral-500 bg-neutral-500/10'
};

// ─── Component ────────────────────────────────────────────────────────────────
export function MeuEstilo() {
  const navigate = useNavigate();

  // Search state
  const [contact, setContact]   = useState('');
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [profile, setProfile]   = useState<StyleProfile | null>(null);
  const [error, setError]       = useState('');

  // Data for barber/service validation
  const [barbers,  setBarbers]  = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [dataReady, setDataReady] = useState(false);

  // Load barbers and services on mount (public collections)
  useEffect(() => {
    async function load() {
      try {
        const [bSnap, sSnap] = await Promise.all([
          getDocs(query(collection(db, 'barbers'),  where('isActive', '==', true))),
          getDocs(query(collection(db, 'services'), where('isActive', '==', true)))
        ]);
        setBarbers(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber)));
        setServices(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      } catch (e) {
        console.error(e);
      } finally {
        setDataReady(true);
      }
    }
    load();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = contact.trim();
    if (!trimmed) return;

    setError('');
    setProfile(null);
    setSearchState('loading');

    try {
      let appointments: Appointment[] = [];

      if (isEmail(trimmed)) {
        const normalized = trimmed.toLowerCase();
        appointments = await runQuery('appointments', 'customerEmail', normalized) as Appointment[];
        // also try original case
        if (appointments.length === 0 && normalized !== trimmed) {
          appointments = await runQuery('appointments', 'customerEmail', trimmed) as Appointment[];
        }
      } else {
        const normalized = normalizePhone(trimmed);
        appointments = await runQuery('appointments', 'customerPhone', normalized) as Appointment[];
      }

      // Filter out cancelled
      const active = appointments.filter(a =>
        a.status !== 'cancelled' && a.status !== 'cancellation_requested'
      );

      if (active.length === 0) {
        setSearchState('not_found');
        return;
      }

      // Sort: completed first, then by date desc
      active.sort((a, b) => {
        const pA = STATUS_PRIORITY[a.status] ?? 99;
        const pB = STATUS_PRIORITY[b.status] ?? 99;
        if (pA !== pB) return pA - pB;
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });

      const best = active[0];

      // Last barber & service
      const lastBarber  = barbers.find(b  => b.id  === best.barberId)  || null;
      const lastService = services.find(s => s.id === best.serviceId) || null;

      // Preferred barber (most appearances in active appts)
      const barberCount: Record<string, number> = {};
      active.forEach(a => { barberCount[a.barberId] = (barberCount[a.barberId] || 0) + 1; });
      const topBarberId = Object.entries(barberCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const preferredBarber = barbers.find(b => b.id === topBarberId) || null;

      // Top services
      const serviceCount: Record<string, number> = {};
      active.forEach(a => { serviceCount[a.serviceId] = (serviceCount[a.serviceId] || 0) + 1; });
      const topServices = Object.entries(serviceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => ({ service: services.find(s => s.id === id)!, count }))
        .filter(x => x.service);

      setProfile({ lastAppointment: best, lastBarber, lastService, preferredBarber, topServices, contact: trimmed });
      setSearchState('found');
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar histórico. Tente novamente.');
      setSearchState('idle');
    }
  }

  function handleRepeat() {
    if (!profile) return;
    const { lastBarber, lastService, contact } = profile;

    // Validate both still active
    const barberActive  = lastBarber  && barbers.find(b  => b.id  === lastBarber.id);
    const serviceActive = lastService && services.find(s => s.id === lastService.id);

    const params = new URLSearchParams();
    if (barberActive)  params.set('barberId',  lastBarber!.id);
    if (serviceActive) params.set('serviceId', lastService!.id);
    if (isEmail(contact)) {
      params.set('email', contact.toLowerCase());
    } else {
      params.set('phone', normalizePhone(contact));
    }

    navigate(`/agendar?${params.toString()}`);
  }

  function reset() {
    setSearchState('idle');
    setProfile(null);
    setContact('');
    setError('');
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg hidden sm:inline">Meu Estilo</span>
          </div>
          <Link to="/agendar" className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors">
            Novo Agendamento
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">

          {/* ── SEARCH FORM ── */}
          {searchState === 'idle' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                <Scissors className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-center">Meu Estilo</h1>
              <p className="text-neutral-400 text-center mb-10 max-w-sm">
                Acesse seu histórico, barbeiro preferido e agende seu corte habitual com um clique.
              </p>

              <div className="w-full max-w-md bg-[#111] border border-neutral-800 rounded-3xl p-8 card-spotlight" onMouseMove={(e: any) => { const rect = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`); e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`); e.currentTarget.style.setProperty('--spotlight-color', 'rgba(255, 255, 255, 0.08)'); }}>
                <form onSubmit={handleSearch} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Seu e-mail ou telefone
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                        {isEmail(contact) ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                      <input
                        type="text"
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500 transition-colors placeholder-neutral-600"
                        placeholder="exemplo@email.com ou (11) 99999-9999"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <p className="text-xs text-neutral-600 mt-2">
                      Use o mesmo contato informado no último agendamento.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={!contact.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <Search className="w-4 h-4" />
                        Acessar Meu Estilo
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8">
                <Link to="/" className="text-neutral-600 hover:text-neutral-400 transition-colors text-sm">
                  ← Voltar para o início
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {searchState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="text-neutral-400">Buscando seu histórico…</p>
            </motion.div>
          )}

          {/* ── NOT FOUND ── */}
          {searchState === 'not_found' && (
            <motion.div
              key="not_found"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="flex flex-col items-center py-16 gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-neutral-500" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">Nenhum histórico encontrado</h2>
                <p className="text-neutral-400 max-w-sm">
                  Não encontramos nenhum agendamento ativo com o contato informado. Verifique se digitou corretamente ou agende normalmente.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={reset}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-neutral-700"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </span>
                </button>
                <Link to="/agendar" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                    <span className="flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Agendar normalmente
                    </span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── FOUND ── */}
          {searchState === 'found' && profile && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="space-y-6"
            >
              {/* Greeting */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-3xl p-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-orange-400 font-medium">Histórico encontrado</span>
                  </div>
                  <h1 className="text-2xl font-bold">
                    Olá, {profile.lastAppointment.customerName.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-neutral-400 text-sm mt-1">
                    Encontramos {profile.topServices.reduce((s, t) => s + t.count, 0)} atendimento(s) no seu histórico.
                  </p>
                </div>
                <button
                  disabled={!profile.lastBarber || !profile.lastService}
                  onClick={handleRepeat}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Agendar meu corte de sempre
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Last Appointment */}
                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 space-y-4 card-spotlight" onMouseMove={(e: any) => { const rect = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`); e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`); e.currentTarget.style.setProperty('--spotlight-color', 'rgba(255, 255, 255, 0.08)'); }}>
                  <h2 className="font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Último Atendimento
                  </h2>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Data</div>
                      <div className="font-medium">
                        {new Date(profile.lastAppointment.startTime).toLocaleDateString('pt-BR', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Status</div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColors[profile.lastAppointment.status]}`}>
                        {statusLabels[profile.lastAppointment.status]}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Serviço</div>
                      <div className="font-medium flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-orange-500" />
                        {profile.lastService?.name ?? <span className="text-neutral-500 italic">Serviço indisponível</span>}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Barbeiro</div>
                      <div className="font-medium flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-orange-500" />
                        {profile.lastBarber?.name ?? <span className="text-neutral-500 italic">Barbeiro indisponível</span>}
                      </div>
                    </div>

                    {profile.lastAppointment.totalPrice ? (
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">Valor</div>
                        <div className="font-bold text-orange-400">
                          R$ {profile.lastAppointment.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  {/* Preferred barber */}
                  <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 card-spotlight" onMouseMove={(e: any) => { const rect = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`); e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`); e.currentTarget.style.setProperty('--spotlight-color', 'rgba(255, 255, 255, 0.08)'); }}>
                    <h2 className="font-bold flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-orange-500" />
                      Barbeiro Preferido
                    </h2>
                    {profile.preferredBarber ? (
                      <div className="flex items-center gap-3 bg-neutral-900/60 rounded-xl px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-sm">
                          {profile.preferredBarber.name.charAt(0)}
                        </div>
                        <span className="font-medium">{profile.preferredBarber.name}</span>
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-sm">Não definido</p>
                    )}
                  </div>

                  {/* Top services */}
                  {profile.topServices.length > 0 && (
                    <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 card-spotlight" onMouseMove={(e: any) => { const rect = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`); e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`); e.currentTarget.style.setProperty('--spotlight-color', 'rgba(255, 255, 255, 0.08)'); }}>
                      <h2 className="font-bold flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Serviços Mais Usados
                      </h2>
                      <div className="space-y-2">
                        {profile.topServices.map(({ service, count }, i) => (
                          <div key={service.id} className="flex items-center justify-between bg-neutral-900/60 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {i === 0 && <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}
                              <span className="text-sm font-medium">{service.name}</span>
                            </div>
                            <span className="text-xs text-neutral-500">{count}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unavailability warning */}
              {(!profile.lastBarber || !profile.lastService) && (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {!profile.lastBarber && !profile.lastService
                      ? 'O barbeiro e o serviço do seu último corte não estão mais disponíveis.'
                      : !profile.lastBarber
                      ? 'O barbeiro do seu último corte não está mais disponível.'
                      : 'O serviço do seu último corte não está mais disponível.'}
                    {' '}Você pode agendar normalmente escolhendo outro.
                  </span>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={reset}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-neutral-700"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Buscar outro contato
                  </span>
                </button>
                <Link to="/agendar" className="flex-1 text-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                    <span className="flex items-center gap-2 justify-center">
                      <ChevronRight className="w-4 h-4" />
                      Novo agendamento
                    </span>
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
