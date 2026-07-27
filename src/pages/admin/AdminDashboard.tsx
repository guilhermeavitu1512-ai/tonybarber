import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, writeBatch, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Scissors, Users, CalendarDays, Loader2, Database, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { Service, Barber, Appointment, Product } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { Skeleton } from '../../components/ui/Skeleton';
import { releaseProductsForAppointment, commitProductSale } from '../../lib/inventoryLogic';
import { normalizePhoneForWhatsApp, formatWhatsAppMessage } from '../../lib/whatsapp';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { LineWaves } from '../../components/ui/LineWaves';
const statusLabels: Record<string, string> = {
  pending_confirmation: 'Aguardando',
  confirmed: 'Confirmado',
  cancellation_requested: 'Cancel. Solicitado',
  on_the_way: 'A Caminho',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu'
};

const statusColors: Record<string, string> = {
  pending_confirmation: 'text-yellow-500 bg-yellow-500/10',
  confirmed: 'text-green-400 bg-green-400/10',
  cancellation_requested: 'text-red-400 bg-red-400/10',
  on_the_way: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-600 bg-green-600/10',
  cancelled: 'text-red-500 bg-red-500/10',
  no_show: 'text-neutral-500 bg-neutral-500/10'
};

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  timePeriod: string;
  preferredDate: string;
  status: string;
  createdAt?: any;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({ services: 0, barbers: 0, appointments: 0, expectedRevenue: 0, realizedRevenue: 0, avgTicket: 0, missingRate: 0, upsellRevenue: 0 });
  const [prevStats, setPrevStats] = useState({ services: 0, barbers: 0, appointments: 0, expectedRevenue: 0, realizedRevenue: 0, avgTicket: 0, missingRate: 0, upsellRevenue: 0 });
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [servicesSnap, barbersSnap, apptsSnap, waitlistSnap, productsSnap] = await Promise.all([
        getDocs(collection(db, 'services')),
        getDocs(collection(db, 'barbers')),
        getDocs(query(collection(db, 'appointments'))),
        getDocs(query(collection(db, 'waitlist_entries'))),
        getDocs(collection(db, 'products'))
      ]);
      
      const appts = apptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      appts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      const loadedProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(loadedProducts);
      
      setAppointments(appts);
      setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
      setBarbers(barbersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber)));
      
      const waitlistEntries = waitlistSnap.docs.map(d => ({ id: d.id, ...d.data() } as WaitlistEntry));
      waitlistEntries.sort((a, b) => {
         const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
         const db = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
         return db - da;
      });
      setWaitlist(waitlistEntries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  

  
  const { filteredAppointments, prevFilteredAppointments } = React.useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    let prevStartDate = new Date(0);
    let prevEndDate = new Date(now.getFullYear() + 10, 0, 1);

    if (timeFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      prevEndDate = startDate;
    } else if (timeFilter === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      prevEndDate = startDate;
    } else if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = startDate;
    }

    const filtered = appointments.filter(a => new Date(a.startTime) >= startDate);
    const prevFiltered = appointments.filter(a => {
       const d = new Date(a.startTime);
       return d >= prevStartDate && d < prevEndDate;
    });

    return { filteredAppointments: filtered, prevFilteredAppointments: prevFiltered };
  }, [appointments, timeFilter]);

  React.useEffect(() => {
    function calcStats(appts: Appointment[]) {
       let expectedRevenue = 0;
       let realizedRevenue = 0;
       let completedPaidCount = 0;
       let noShowCount = 0;
       let totalFinished = 0;
       let upsellRevenue = 0;

       appts.forEach(app => {
         const isPaid = app.paymentStatus === 'paid';
         const isConfirmed = app.status === 'confirmed';
         const isCompleted = app.status === 'completed';
         const isNoShow = app.status === 'no_show';
         const total = app.totalPrice || 0;

         if (isCompleted || isNoShow) totalFinished++;
         if (isNoShow) noShowCount++;

         if (isConfirmed) expectedRevenue += total;
         if (isPaid && (isCompleted || isNoShow)) {
           realizedRevenue += total;
           completedPaidCount++;
           if (app.productIds && app.productIds.length > 0) {
             let pPrice = 0;
             app.productIds.forEach(pid => {
               const p = products.find(prod => prod.id === pid);
               if (p) pPrice += p.price;
             });
             upsellRevenue += pPrice;
           }
         }
       });

       return {
         services: services.length,
         barbers: barbers.length,
         appointments: appts.length,
         expectedRevenue,
         realizedRevenue,
         avgTicket: completedPaidCount > 0 ? realizedRevenue / completedPaidCount : 0,
         missingRate: totalFinished > 0 ? (noShowCount / totalFinished) * 100 : 0,
         upsellRevenue
       };
    }

    setStats(calcStats(filteredAppointments));
    setPrevStats(calcStats(prevFilteredAppointments));
  }, [filteredAppointments, prevFilteredAppointments, products, barbers, services]);

  function TrendIndicator({ current, prev, isInverse = false }: { current: number, prev: number, isInverse?: boolean }) {
     if (timeFilter === 'all' || prev === 0) return null;
     const diff = current - prev;
     if (diff === 0) return null;
     const percent = (diff / prev) * 100;
     const isPositive = diff > 0;
     const isGood = isInverse ? !isPositive : isPositive;
     const color = isGood ? 'text-green-500' : 'text-red-500';
     const Icon = isPositive ? ArrowUp : ArrowDown;

     return (
       <div className={`flex items-center text-xs font-medium ${color} mt-2`}>
         <Icon className="w-3 h-3 mr-1" />
         <AnimatedNumber value={Math.abs(percent)} decimals={1} suffix="%" /> 
         <span className="text-neutral-500 ml-1 font-normal">vs ant.</span>
       </div>
     );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } }
  };

  const handleOpenWhatsApp = async (appt: Appointment) => {
     const phone = normalizePhoneForWhatsApp(appt.customerPhone);
     if (!phone) {
        alert("O telefone do cliente precisa ser corrigido antes de abrir o WhatsApp.");
        return;
     }
     
     // Note: we don't have barbers and services in AdminDashboard state directly unless we load them, but in the previous step the user didn't request adding them to AdminDashboard. Wait, they are requested to be shown in the UI "Profissional: [NOME]". But AdminDashboard currently doesn't fetch barbers/services in its list. Let's just use the ID or load them.
     // Actually, let's just make it generic if we don't have it, or fetch it.
     
     const address = locationData ? `${locationData.name}\n${locationData.street}, nº ${locationData.number} — ${locationData.reference}\n${locationData.city} — ${locationData.stateCode}\nCEP ${locationData.postalCode}` : 'Endereço não configurado';
     
     const baseUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
     const link = `${baseUrl}/agendamento/gerenciar/${appt.id}`;
     
     const startDate = new Date(appt.startTime);
     const endDate = new Date(appt.endTime);
     
          const barber = barbers.find(b => b.id === appt.barberId);
     const service = services.find(s => s.id === appt.serviceId);
     
     let productsText = "Nenhum produto adicional";
     if (appt.productIds && appt.productIds.length > 0) {
        productsText = "Produtos selecionados (" + appt.productIds.length + ")";
     }
     
     const msg = formatWhatsAppMessage(
        appt.customerName,
        appt.id.substring(0,6).toUpperCase(),
        barber?.name || 'Barbeiro',
        service?.name || 'Serviço',
        startDate.toLocaleDateString('pt-BR'),
        startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        productsText,
        "R$ " + (appt.totalPrice || 0).toFixed(2).replace('.', ','),
        address,
        link
     );
     
     const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
     window.open(url, '_blank');
     
     try {
        await updateDoc(doc(db, 'appointments', appt.id), {
           whatsapp_confirmation_status: 'opened'
        });
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, whatsapp_confirmation_status: 'opened' } : a));
     } catch (e) {
        console.error("Erro ao atualizar status", e);
     }
  };

  const handleMarkSent = async (appt: Appointment) => {
     try {
        await updateDoc(doc(db, 'appointments', appt.id), {
           whatsapp_confirmation_status: 'sent_manually'
        });
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, whatsapp_confirmation_status: 'sent_manually' } : a));
     } catch (e) {
        alert("Erro ao marcar.");
     }
  };
  
  const handleCopyMessage = (appt: Appointment) => {
     const address = locationData ? `${locationData.name}\n${locationData.street}, nº ${locationData.number} — ${locationData.reference}\n${locationData.city} — ${locationData.stateCode}\nCEP ${locationData.postalCode}` : 'Endereço não configurado';
     const baseUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
     const link = `${baseUrl}/agendamento/gerenciar/${appt.id}`;
     
     const startDate = new Date(appt.startTime);
     const endDate = new Date(appt.endTime);
     
     const barber = barbers.find(b => b.id === appt.barberId);
     const service = services.find(s => s.id === appt.serviceId);
     
     let productsText = "Nenhum produto adicional";
     if (appt.productIds && appt.productIds.length > 0) {
        productsText = "Produtos selecionados (" + appt.productIds.length + ")";
     }

     const msg = formatWhatsAppMessage(
        appt.customerName,
        appt.id.substring(0,6).toUpperCase(),
        barber?.name || 'Barbeiro',
        service?.name || 'Serviço',
        startDate.toLocaleDateString('pt-BR'),
        startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        productsText,
        "R$ " + (appt.totalPrice || 0).toFixed(2).replace('.', ','),
        address,
        link
     );
     
     navigator.clipboard.writeText(msg);
     alert("Mensagem copiada!");
  };

  async function updateStatus(id: string, newStatus: string) {
    try {
      const appt = appointments.find(a => a.id === id);
      if (appt && appt.productIds && appt.productIds.length > 0) {
        if (newStatus === 'completed') {
          await commitProductSale(appt.productIds, id, 'admin');
        } else if (newStatus === 'cancelled' || newStatus === 'no_show') {
          await releaseProductsForAppointment(appt.productIds, id, 'admin', `Status alterado para ${newStatus}`);
        }
      }
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  }

  
  async function updatePaymentStatus(id: string, newPaymentStatus: string) {
    try {
      const appt = appointments.find(a => a.id === id);
      const updates: any = { paymentStatus: newPaymentStatus };
      let newStatus = appt?.status;

      // Se marcou como pago, e ainda estava pendente ou confirmado, avança para concluído
      if (newPaymentStatus === 'paid' && appt && (appt.status === 'pending_confirmation' || appt.status === 'confirmed')) {
        updates.status = 'completed';
        newStatus = 'completed';
      }

      await updateDoc(doc(db, 'appointments', id), updates);
      
      setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, paymentStatus: newPaymentStatus as any, status: newStatus as any } : a
      ));
    } catch (err) {
      alert("Erro ao atualizar pagamento.");
    }
  }

  async function seedDatabase() {
    setSeeding(true);
    const PROJECT = 'gen-lang-client-0254140623';
    const DATABASE = 'ai-studio-5c2ed8fc-bae9-41d8-81c1-1806d0f17a5a';
    const API_KEY = 'AIzaSyC0r3tXwA0G61IYyEOOGzOQuBqqLdwpjSE';
    const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABASE}/documents`;

    const mkId = () => Math.random().toString(36).substring(2, 15);

    function toDoc(fields: Record<string, any>) {
      const convert = (v: any): any => {
        if (typeof v === 'string') return { stringValue: v };
        if (typeof v === 'number') return { doubleValue: v };
        if (typeof v === 'boolean') return { booleanValue: v };
        if (Array.isArray(v)) return { arrayValue: { values: v.map(convert) } };
        if (v && typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, val]) => [k, convert(val)])) } };
        return { nullValue: null };
      };
      return { fields: Object.fromEntries(Object.entries(fields).map(([k, val]) => [k, convert(val)])) };
    }

    async function create(col: string, id: string, data: Record<string, any>) {
      const res = await fetch(`${BASE}/${col}?documentId=${id}&key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toDoc(data))
      });
      if (!res.ok) {
        const e = await res.text();
        throw new Error(`Falha ao criar ${col}/${id}: ${e}`);
      }
    }

    try {
      const tonyId = mkId(), emersonId = mkId(), tiagoId = mkId();
      const svc1Id = mkId(), svc2Id = mkId();

      const schedule: Record<string, any> = {
        0: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        1: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        2: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        3: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        4: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        5: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
        6: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      };

      await create('barbers', tonyId, { name: 'Tony Barber', specialties: ['Corte Clássico', 'Barba Terapia'], schedule, isActive: true, photoUrl: '' });
      await create('barbers', emersonId, { name: 'Emerson Barber', specialties: ['Corte Clássico', 'Barba Terapia'], schedule, isActive: true, photoUrl: '' });
      await create('barbers', tiagoId, { name: 'Tiago Gonçalves', specialties: ['Corte Clássico'], schedule, isActive: true, photoUrl: '' });
      await create('services', svc1Id, { name: 'Corte Clássico', durationMinutes: 45, price: 60, barberIds: [tonyId, emersonId, tiagoId], isActive: true });
      await create('services', svc2Id, { name: 'Barba Terapia', durationMinutes: 30, price: 40, barberIds: [tonyId, emersonId], isActive: true });

      await loadData();
      alert('Dados de exemplo inseridos com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao inserir dados: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSeeding(false);
    }
  }



  // --- Gráficos (Computados dinamicamente) ---
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
       day: d.getDate(),
       month: d.getMonth(),
       year: d.getFullYear(),
       label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    };
  }).reverse();

  const revenueData = last7Days.map(dayObj => {
    const dayAppts = appointments.filter(a => {
      if (!(a.paymentStatus === 'paid' && (a.status === 'completed' || a.status === 'no_show'))) return false;
      const ad = new Date(a.startTime);
      return ad.getDate() === dayObj.day && ad.getMonth() === dayObj.month && ad.getFullYear() === dayObj.year;
    });
    const total = dayAppts.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    return { date: dayObj.label, value: total };
  });

  const serviceRevenueRecord: Record<string, number> = {};
  const barberRevenueRecord: Record<string, number> = {};

  filteredAppointments.forEach(a => {
     if(a.paymentStatus === 'paid' && (a.status === 'completed' || a.status === 'no_show')) {
        serviceRevenueRecord[a.serviceId] = (serviceRevenueRecord[a.serviceId] || 0) + (a.totalPrice || 0);
        barberRevenueRecord[a.barberId] = (barberRevenueRecord[a.barberId] || 0) + (a.totalPrice || 0);
     }
  });

  const pieColors = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];
  const revenueByServiceData = Object.keys(serviceRevenueRecord).map((id, index) => {
     const s = services.find(srv => srv.id === id);
     return { name: s?.name || 'Desconhecido', value: serviceRevenueRecord[id], color: pieColors[index % pieColors.length] };
  }).sort((a,b) => b.value - a.value).slice(0, 5);

  const revenueByBarberData = Object.keys(barberRevenueRecord).map((id, index) => {
     const b = barbers.find(barb => barb.id === id);
     return { name: b?.name || 'Desconhecido', value: barberRevenueRecord[id], color: pieColors[index % pieColors.length] };
  }).sort((a,b) => b.value - a.value);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="relative overflow-hidden rounded-2xl mb-8 p-6 md:p-8 bg-[#0f0f0f] border border-neutral-800/60">
        {/* Ultra-subtle LineWaves behind the header */}
        <LineWaves
          speed={0.10}
          innerLineCount={16}
          outerLineCount={18}
          warpIntensity={0.4}
          rotation={-10}
          edgeFadeWidth={0.3}
          colorCycleSpeed={0.25}
          brightness={0.045}
          color1="#ff5a00"
          color2="#ff7a00"
          color3="#ff9a3c"
          enableMouseInteraction
          mouseInfluence={0.8}
          style={{ opacity: 0.35 }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          <button onClick={() => setTimeFilter('today')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'today' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Hoje</button>
          <button onClick={() => setTimeFilter('week')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'week' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>7 Dias</button>
          <button onClick={() => setTimeFilter('month')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'month' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Este Mês</button>
          <button onClick={() => setTimeFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'all' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Tudo</button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 mt-4">
             {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
             <Skeleton className="h-64 w-full" />
             <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, borderColor: '#f97316', boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.1)' }} className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium text-sm">Receita Prevista</p>
              </div>
              <h2 className="text-2xl font-bold text-neutral-300"><AnimatedNumber value={stats.expectedRevenue} decimals={2} prefix="R$ " /></h2>
              <TrendIndicator current={stats.expectedRevenue} prev={prevStats.expectedRevenue} />
              <p className="text-xs text-neutral-500 mt-2">Agendamentos confirmados</p>
            </motion.div>
            
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, borderColor: '#f97316', boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.1)' }} className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium text-sm">Receita Realizada</p>
              </div>
              <h2 className="text-2xl font-bold text-green-400"><AnimatedNumber value={stats.realizedRevenue} decimals={2} prefix="R$ " /></h2>
              <TrendIndicator current={stats.realizedRevenue} prev={prevStats.realizedRevenue} />
              <p className="text-xs text-neutral-500 mt-2">Inclui R$ {stats.upsellRevenue.toFixed(2)} de upsell (produtos)</p>
            </motion.div>
            
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, borderColor: '#f97316', boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.1)' }} className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium text-sm">Ticket Médio (Realizado)</p>
              </div>
              <h2 className="text-2xl font-bold"><AnimatedNumber value={stats.avgTicket} decimals={2} prefix="R$ " /></h2>
              <TrendIndicator current={stats.avgTicket} prev={prevStats.avgTicket} />
              <p className="text-xs text-neutral-500 mt-2">Por atendimento concluído e pago</p>
            </motion.div>
            
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, borderColor: '#f97316', boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.1)' }} className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium">Taxa de Faltas</p>
              </div>
              <h2 className="text-3xl font-bold"><AnimatedNumber value={stats.missingRate} decimals={1} suffix="%" /></h2>
              <TrendIndicator current={stats.missingRate} prev={prevStats.missingRate} isInverse={true} />
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, borderColor: '#f97316', boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.1)' }} className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm transition-colors duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium">Agendamentos</p>
              </div>
              <h2 className="text-3xl font-bold"><AnimatedNumber value={stats.appointments} /></h2>
              <TrendIndicator current={stats.appointments} prev={prevStats.appointments} />
            </motion.div>
          </motion.div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Faturamento Últimos 7 dias */}
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neutral-400" />
                Faturamento (Últimos 7 dias)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                    <Tooltip 
                      cursor={{fill: '#222'}} 
                      contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}}
                      formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Faturamento']}
                    />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Serviços mais populares */}
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-neutral-400" />
                Top Serviços
              </h2>
              <div className="h-64 w-full flex items-center justify-center">
                {revenueByServiceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByServiceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {revenueByServiceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-neutral-500 text-sm">Nenhum dado suficiente.</div>
                )}
                        </div>
            </div>

            {/* Faturamento por Barbeiro */}
            <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-400" />
                Faturamento por Profissional (Realizado)
              </h2>
              <div className="h-64 w-full">
                {revenueByBarberData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByBarberData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R${val}`} />
                      <Tooltip 
                        cursor={{fill: '#222'}} 
                        contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}}
                        formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Faturamento']}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-500 text-sm">Nenhum dado suficiente.</div>
                )}
              </div>
            </div>
          </div>
          
          {appointments.filter(a => !a.whatsapp_confirmation_status || a.whatsapp_confirmation_status === 'not_sent').length > 0 && (
          <>
             <h2 className="text-xl font-bold mb-4 text-orange-500">Confirmações pendentes (WhatsApp)</h2>
             <div className="bg-[#111] border border-orange-500/30 rounded-2xl overflow-hidden mb-8 p-4">
                <div className="flex flex-col gap-3">
                   {appointments.filter(a => !a.whatsapp_confirmation_status || a.whatsapp_confirmation_status === 'not_sent').map(appt => (
                      <div key={appt.id} className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                         <div>
                            <div className="font-bold text-white">{appt.customerName}</div>
                            <div className="text-sm text-neutral-400">{appt.customerPhone}</div>
                         </div>
                         <div>
                            <div className="text-sm text-neutral-300">{new Date(appt.startTime).toLocaleDateString('pt-BR')} às {new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-xs text-neutral-500">{services.find(s => s.id === appt.serviceId)?.name} com {barbers.find(b => b.id === appt.barberId)?.name}</div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => handleOpenWhatsApp(appt)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                               Enviar WhatsApp
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </>
          )}
          <h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden mb-12">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-neutral-900 border-b border-neutral-800">
                     <tr>
                        <th className="px-6 py-4 font-medium text-neutral-400">Data e Hora</th>
                        <th className="px-6 py-4 font-medium text-neutral-400">Cliente</th>
                        <th className="px-6 py-4 font-medium text-neutral-400">Status</th>
                        <th className="px-6 py-4 font-medium text-neutral-400">Total</th>
                        <th className="px-6 py-4 font-medium text-neutral-400 text-center">Pagamento</th>
                        <th className="px-6 py-4 font-medium text-neutral-400 text-right">Status do Atendimento</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                     {filteredAppointments.map(appt => (
                        <tr key={appt.id} className="hover:bg-neutral-900/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="font-medium text-white">{new Date(appt.startTime).toLocaleDateString('pt-BR')}</div>
                              <div className="text-sm text-neutral-500">{new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="font-medium">{appt.customerName}</div>
                              <div className="text-sm text-neutral-500">{appt.customerPhone}</div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColors[appt.status]}`}>
                                 {statusLabels[appt.status]}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-orange-500 font-bold">
                              R$ {appt.totalPrice?.toFixed(2) || '0.00'}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <select 
                                className={`text-sm rounded-lg px-3 py-1.5 font-medium outline-none transition-colors border ${appt.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}
                                value={appt.paymentStatus || 'pending'}
                                onChange={(e) => updatePaymentStatus(appt.id, e.target.value)}
                              >
                                <option value="pending" className="bg-neutral-900 text-white">Pendente</option>
                                <option value="paid" className="bg-neutral-900 text-white">Pago</option>
                              </select>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <select 
                                className="bg-neutral-800 border border-neutral-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
                                value={appt.status}
                                onChange={(e) => updateStatus(appt.id, e.target.value)}
                              >
                                {Object.keys(statusLabels).map(k => (
                                   <option key={k} value={k}>{statusLabels[k]}</option>
                                ))}
                              </select>
                           </td>
                        </tr>
                     ))}
                     {appointments.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">Nenhum agendamento encontrado.</td>
                        </tr>
                     )}
                  </tbody>
                </table>
             </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Lista de Encaixe (Waitlist)</h2>
          <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden mb-12">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-neutral-900 border-b border-neutral-800">
                     <tr>
                        <th className="px-6 py-4 font-medium text-neutral-400">Data</th>
                        <th className="px-6 py-4 font-medium text-neutral-400">Cliente</th>
                        <th className="px-6 py-4 font-medium text-neutral-400">Preferência de Horário</th>
                        <th className="px-6 py-4 font-medium text-neutral-400">Status</th>
                        <th className="px-6 py-4 font-medium text-neutral-400 text-right">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                     {waitlist.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Nenhum cliente na lista de encaixe.</td>
                        </tr>
                     ) : (
                       waitlist.map(entry => (
                          <tr key={entry.id} className="hover:bg-neutral-900/50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="font-medium text-white">{new Date(entry.preferredDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="font-medium">{entry.customerName}</div>
                                <div className="text-sm text-neutral-500">
                                   <a href={`https://wa.me/55${entry.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">
                                     {entry.customerPhone}
                                   </a>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-neutral-300">
                                {entry.timePeriod}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${entry.status === 'waiting' ? 'text-yellow-500 bg-yellow-500/10' : 'text-green-500 bg-green-500/10'}`}>
                                   {entry.status === 'waiting' ? 'Aguardando' : 'Atendido'}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                {entry.status === 'waiting' && (
                                   <div className="flex justify-end gap-3">
                                      <button 
                                         onClick={async () => {
                                            if(confirm('Marcar como atendido?')) {
                                               await updateDoc(doc(db, 'waitlist_entries', entry.id), { status: 'fulfilled' });
                                               loadData();
                                            }
                                         }} 
                                         className="text-sm font-medium text-green-500 hover:text-green-400"
                                      >
                                         Atendido
                                      </button>
                                      <button 
                                         onClick={async () => {
                                            if(confirm('Cancelar esta solicitação?')) {
                                               await updateDoc(doc(db, 'waitlist_entries', entry.id), { status: 'cancelled' });
                                               loadData();
                                            }
                                         }} 
                                         className="text-sm font-medium text-red-500 hover:text-red-400"
                                      >
                                         Cancelar
                                      </button>
                                   </div>
                                )}
                             </td>
                          </tr>
                       ))
                     )}
                  </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {/* Seeder Action */}
      <div className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-neutral-400" />
          Configuração Inicial
        </h2>
        <p className="text-neutral-500 mb-6 max-w-2xl">
          Se o sistema estiver vazio, você pode popular o banco de dados com alguns dados de exemplo (serviços e barbeiros) para testar o fluxo de agendamento no site.
        </p>
        <button
          onClick={seedDatabase}
          disabled={seeding}
          className="bg-white text-black px-6 py-2 rounded-full font-medium transition-colors hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {seeding ? 'Inserindo dados...' : 'Gerar Dados de Exemplo'}
        </button>
      </div>
    </div>
  );
}
