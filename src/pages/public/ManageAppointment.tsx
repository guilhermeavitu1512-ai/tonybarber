import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Appointment, Barber, Service } from '../../types';
import { ChevronLeft, Loader2, CheckCircle, Calendar, Clock, Scissors, User, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SpecularButton from '../../components/ui/SpecularButton';

export function ManageAppointment() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        const tokenQuery = query(collection(db, 'appointment_management_tokens'), where('token', '==', token));
        const tokenSnap = await getDocs(tokenQuery);
        
        let targetApptId = token; // default to trying to find the appointment directly
        
        if (!tokenSnap.empty) {
           targetApptId = tokenSnap.docs[0].data().appointmentId;
        }
        
        const apptDoc = await getDoc(doc(db, 'appointments', targetApptId));
        
        if (!apptDoc.exists()) {
          setError("Agendamento não encontrado.");
          setLoading(false);
          return;
        }

        const appt = { id: apptDoc.id, ...apptDoc.data() } as Appointment;
        setAppointment(appt);

        const [barberDoc, serviceDoc] = await Promise.all([
          getDoc(doc(db, 'barbers', appt.barberId)),
          getDoc(doc(db, 'services', appt.serviceId))
        ]);

        if (barberDoc.exists()) setBarber({ id: barberDoc.id, ...barberDoc.data() } as Barber);
        if (serviceDoc.exists()) setService({ id: serviceDoc.id, ...serviceDoc.data() } as Service);

      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleConfirmPresence = async () => {
    if (!appointment) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status: 'confirmed'
      });
      setAppointment(prev => prev ? { ...prev, status: 'confirmed' } : null);
      alert("Presença confirmada com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao confirmar presença.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOnTheWay = async () => {
    if (!appointment) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status: 'on_the_way'
      });
      setAppointment(prev => prev ? { ...prev, status: 'on_the_way' } : null);
      alert("Status atualizado: A caminho!");
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    if (!window.confirm("Tem certeza que deseja solicitar o cancelamento deste agendamento?")) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status: 'cancellation_requested'
      });
      setAppointment(prev => prev ? { ...prev, status: 'cancellation_requested' } : null);
      alert("Solicitação de cancelamento enviada.");
    } catch (e) {
      console.error(e);
      alert("Erro ao cancelar.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-white p-6">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ops!</h2>
        <p className="text-neutral-400 mb-8">{error}</p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">Voltar ao Início</Link>
      </div>
    );
  }

  const apptDate = new Date(appointment.startTime);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-2xl mx-auto mt-12">
        <Link to="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Gerenciar Agendamento</h1>

        <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6 md:p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                 <h2 className="text-2xl font-bold">{appointment.customerName}</h2>
                 <p className="text-neutral-400">{appointment.customerPhone}</p>
              </div>
              <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg font-medium text-sm text-neutral-300">
                 Status: <span className="text-orange-500 ml-1">{
                    appointment.status === 'pending_confirmation' ? 'Aguardando Confirmação' :
                    appointment.status === 'confirmed' ? 'Confirmado' :
                    appointment.status === 'on_the_way' ? 'A Caminho' :
                    appointment.status === 'cancellation_requested' ? 'Cancelamento Solicitado' :
                    appointment.status === 'completed' ? 'Concluído' :
                    appointment.status === 'cancelled' ? 'Cancelado' : 'Outro'
                 }</span>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                 <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-orange-500"><Calendar className="w-6 h-6" /></div>
                 <div>
                    <div className="text-sm text-neutral-500">Data e Hora</div>
                    <div className="font-bold">{format(apptDate, "dd 'de' MMMM", { locale: ptBR })} às {format(apptDate, 'HH:mm')}</div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                 <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-orange-500"><Scissors className="w-6 h-6" /></div>
                 <div>
                    <div className="text-sm text-neutral-500">Serviço</div>
                    <div className="font-bold">{service?.name || 'Serviço não encontrado'}</div>
                 </div>
              </div>

              <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                 <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-orange-500"><User className="w-6 h-6" /></div>
                 <div>
                    <div className="text-sm text-neutral-500">Profissional</div>
                    <div className="font-bold">{barber?.name || 'Não encontrado'}</div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                 <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-orange-500"><Clock className="w-6 h-6" /></div>
                 <div>
                    <div className="text-sm text-neutral-500">Duração</div>
                    <div className="font-bold">{service?.durationMinutes || 0} min</div>
                 </div>
              </div>
           </div>

           {(appointment.status === 'pending_confirmation' || appointment.status === 'confirmed') && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-neutral-800">
                <div className="flex flex-col items-center justify-center p-4">
                  <SpecularButton
                    size="sm"
                    radius={12}
                    tint="#16a34a"
                    tintOpacity={0.85}
                    textColor="#ffffff"
                    lineColor="#86efac"
                    baseColor="#14532d"
                    intensity={1.2}
                    shineSize={14}
                    shineFade={40}
                    followMouse
                    proximity={200}
                    disabled={actionLoading || appointment.status === 'confirmed'}
                    onClick={handleConfirmPresence}
                  >
                    <span className="flex flex-col items-center gap-1">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-sm font-medium">Confirmar Presença</span>
                    </span>
                  </SpecularButton>
                </div>
                
                <button 
                  onClick={handleOnTheWay}
                  disabled={actionLoading}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <User className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Estou a caminho</span>
                </button>

                <Link 
                  to={`/agendar?reschedule=${appointment.id}`}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-500 transition-colors"
                >
                  <Clock className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Reagendar</span>
                </Link>

                <button 
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <XCircle className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Cancelar</span>
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
