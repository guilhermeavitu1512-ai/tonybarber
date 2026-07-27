import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, writeBatch, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Scissors, Users, CalendarDays, Loader2, Database, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { Service, Barber, Appointment, Product } from '../../types';
import { motion } from 'motion/react';
import { releaseProductsForAppointment, commitProductSale } from '../../lib/inventoryLogic';
import { normalizePhoneForWhatsApp, formatWhatsAppMessage } from '../../lib/whatsapp';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
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
  

  
  const filteredAppointments = React.useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    if (timeFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeFilter === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return appointments.filter(a => new Date(a.startTime) >= startDate);
  }, [appointments, timeFilter]);

  React.useEffect(() => {
    let expectedRevenue = 0;
    let realizedRevenue = 0;
    let completedPaidCount = 0;
    let noShowCount = 0;
    let totalFinished = 0;
    let upsellRevenue = 0;

    filteredAppointments.forEach(app => {
      const isPaid = app.paymentStatus === 'paid';
      const isConfirmed = app.status === 'confirmed';
      const isCompleted = app.status === 'completed';
      const isNoShow = app.status === 'no_show';
      const total = app.totalPrice || 0;

      if (isCompleted || isNoShow) totalFinished++;
      if (isNoShow) noShowCount++;

      // Receita Prevista
      if (isConfirmed) {
        expectedRevenue += total;
      }

      // Receita Realizada
      if (isPaid && (isCompleted || isNoShow)) {
        realizedRevenue += total;
        completedPaidCount++;
        
        // Upsell
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

    setStats({
      services: services.length,
      barbers: barbers.length,
      appointments: filteredAppointments.length,
      expectedRevenue,
      realizedRevenue,
      avgTicket: completedPaidCount > 0 ? realizedRevenue / completedPaidCount : 0,
      missingRate: totalFinished > 0 ? (noShowCount / totalFinished) * 100 : 0,
      upsellRevenue
    });
  }, [filteredAppointments, products, barbers, services]);

  const handleOpenWhatsApp = async (appt: Appointment) => {
     const phone = normalizePhoneForWhatsApp(appt.customerPhone);
     if (!phone) {
        alert("O telefone do cliente precisa ser corrigido antes de abrir o WhatsApp.");
        return;
     }
     
     // Note: we don't have barbers and services in AdminDashboard state directly unless we load them, but in the previous step the user didn't request adding them to AdminDashboard. Wait, they are requested to be shown in the UI "Profissional: [NOME]". But AdminDashboard currently doesn't fetch barbers/services in its list. Let's just use the ID or load them.
     // Actually, let's just make it generic if we don't have it, or fetch it.
     
     const address = locationData ? `${locationData.name}\n${locationData.street}, nº ${locationData.number} — ${locationData.reference}\n${locationData.city} — ${locationData.stateCode}\nCEP ${locationData.postalCode}` : 'Endereço não configurado';
     
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
     const address = locationData ? `${locationData.name}\n${locationData.street}, nº ${locationData.number} — ${locationData.reference}\n${locationData.city} — ${locationData.stateCode}\nCEP ${locationData.postalCode}` : 'Endereço não configurado';
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
      await updateDoc(doc(db, 'appointments', id), { paymentStatus: newPaymentStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, paymentStatus: newPaymentStatus as any } : a));
    } catch (err) {
      alert("Erro ao atualizar pagamento.");
    }
  }

  async function seedDatabase() {
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const tonyRef = doc(collection(db, 'barbers'));
      const emersonRef = doc(collection(db, 'barbers'));
      const tiagoRef = doc(collection(db, 'barbers'));

      // Seed Services
      const svc1Ref = doc(collection(db, 'services'));
      batch.set(svc1Ref, {
        name: 'Corte Clássico',
        durationMinutes: 45,
        price: 60,
        barberIds: [tonyRef.id, emersonRef.id, tiagoRef.id], 
        isActive: true
      });
      
      const svc2Ref = doc(collection(db, 'services'));
      batch.set(svc2Ref, {
        name: 'Barba Terapia',
        durationMinutes: 30,
        price: 40,
        barberIds: [tonyRef.id, emersonRef.id],
        isActive: true
      });

      const schedule = {
        0: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        1: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        2: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        3: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        4: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        5: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
        6: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      };

      batch.set(tonyRef, {
        name: 'Tony Barber',
        specialties: ['Corte Clássico', 'Barba Terapia'],
        schedule,
        isActive: true,
        photoUrl: ''
      });
      batch.set(emersonRef, {
        name: 'Emerson Barber',
        specialties: ['Corte Clássico', 'Barba Terapia'],
        schedule,
        isActive: true,
        photoUrl: ''
      });
      batch.set(tiagoRef, {
        name: 'Tiago Gonçalves',
        specialties: ['Corte Clássico'],
        schedule,
        isActive: true,
        photoUrl: ''
      });

      await batch.commit();
      await loadData();
      alert('Dados de exemplo inseridos com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao inserir dados.');
    } finally {
      setSeeding(false);
    }
  }

  // --- Gráficos (Computados dinamicamente) ---
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('pt-BR');
  }).reverse();

  const revenueData = last7Days.map(dateStr => {
    const dayAppts = filteredAppointments.filter(a => 
      a.paymentStatus === 'paid' && (a.status === 'completed' || a.status === 'no_show') &&
      new Date(a.startTime).toLocaleDateString('pt-BR') === dateStr
    );
    const total = dayAppts.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    return { date: dateStr.substring(0, 5), value: total };
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          <button onClick={() => setTimeFilter('today')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'today' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Hoje</button>
          <button onClick={() => setTimeFilter('week')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'week' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>7 Dias</button>
          <button onClick={() => setTimeFilter('month')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'month' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Este Mês</button>
          <button onClick={() => setTimeFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeFilter === 'all' ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'}`}>Tudo</button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium text-sm">Receita Prevista</p>
              </div>
              <h2 className="text-2xl font-bold text-neutral-300">R$ {stats.expectedRevenue.toFixed(2)}</h2>
              <p className="text-xs text-neutral-500 mt-2">Agendamentos confirmados</p>
            </div>
            
            <div className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium text-sm">Receita Realizada</p>
              </div>
              <h2 className="text-2xl font-bold text-green-400">R$ {stats.realizedRevenue.toFixed(2)}</h2>
              <p className="text-xs text-neutral-500 mt-2">Inclui R$ {stats.upsellRevenue.toFixed(2)} de upsell (produtos)</p>
            </div>
            
            <div className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium text-sm">Ticket Médio (Realizado)</p>
              </div>
              <h2 className="text-2xl font-bold">R$ {stats.avgTicket.toFixed(2)}</h2>
              <p className="text-xs text-neutral-500 mt-2">Por atendimento concluído e pago</p>
            </div>
            
            <div className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium">Taxa de Faltas</p>
              </div>
              <h2 className="text-3xl font-bold">{stats.missingRate.toFixed(1)}%</h2>
            </div>

            <div className="bg-[#111] border border-neutral-800 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <p className="text-neutral-400 font-medium">Agendamentos</p>
              </div>
              <h2 className="text-3xl font-bold">{stats.appointments}</h2>
            </div>
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
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
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
