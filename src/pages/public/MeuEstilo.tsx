import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { ClientProfile, Appointment, Barber, Service } from '../../types';
import { User, Clock, Scissors, Image as ImageIcon, ChevronRight, LogOut, CheckCircle, Loader2, Star } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../../components/Logo';


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
  pending_confirmation: 'text-yellow-500',
  confirmed: 'text-green-400',
  cancellation_requested: 'text-red-400',
  on_the_way: 'text-blue-400',
  completed: 'text-neutral-500',
  cancelled: 'text-red-500',
  no_show: 'text-neutral-600'
};

export function MeuEstilo() {
  const { user, loginMock, logout } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  

    const [reviewingAppt, setReviewingAppt] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [prefBarberName, setPrefBarberName] = useState('Não definido');
  const [prefServiceName, setPrefServiceName] = useState('Não definido');
  
  const submitReview = async () => {
    if (!reviewingAppt) return;
    setLoading(true);
    try {
       await addDoc(collection(db, 'reviews'), {
         appointmentId: reviewingAppt.id,
         barberId: reviewingAppt.barberId,
         customerName: reviewingAppt.customerName,
         rating: reviewRating,
         comment: reviewComment,
         createdAt: new Date().toISOString()
       });
       await updateDoc(doc(db, 'appointments', reviewingAppt.id), { reviewed: true });
       setAppointments(prev => prev.map(a => a.id === reviewingAppt.id ? { ...a, reviewed: true } : a));
       setReviewingAppt(null);
       setReviewRating(5);
       setReviewComment('');
    } catch (e) {
       console.error(e);
       alert("Erro ao enviar avaliação.");
    } finally {
       setLoading(false);
    }
  };

  const updateAppointmentStatus = async (apptId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'appointments', apptId), { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus as any } : a));
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar o agendamento.');
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProfile(user.uid, user.email || '');
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadProfile(uid: string, userEmail: string) {
    try {
      const q = query(collection(db, 'client_profiles'), where('authUserId', '==', uid));
      const snap = await getDocs(q);
      
      let currentProfile: ClientProfile;
      if (snap.empty) {
        // Look for appointments with this email to pre-fill
        const apptsQuery = query(collection(db, 'appointments'), where('customerEmail', '==', userEmail));
        const apptsSnap = await getDocs(apptsQuery);
        let name = 'Cliente';
        let phone = '';
        if (!apptsSnap.empty) {
          name = apptsSnap.docs[0].data().customerName;
          phone = apptsSnap.docs[0].data().customerPhone;
        }

        const newProfile: ClientProfile = {
          id: doc(collection(db, 'client_profiles')).id,
          authUserId: uid,
          fullName: name,
          email: userEmail,
          phone: phone,
          marketingConsent: false,
          reminderConsent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'client_profiles', newProfile.id), newProfile);
        currentProfile = newProfile;
      } else {
        currentProfile = { id: snap.docs[0].id, ...snap.docs[0].data() } as ClientProfile;
      }
      setProfile(currentProfile);

      let bId = currentProfile.preferredBarberId;
      let sId = currentProfile.preferredServiceId;

      if (bId) {
         const bDoc = await getDoc(doc(db, 'barbers', bId));
         if (bDoc.exists()) setPrefBarberName(bDoc.data().name);
      }
      if (sId) {
         const sDoc = await getDoc(doc(db, 'services', sId));
         if (sDoc.exists()) setPrefServiceName(sDoc.data().name);
      }

      // Load history
      const apptQ = query(collection(db, 'appointments'), where('customerEmail', '==', userEmail));
      const apptSnap = await getDocs(apptQ);
      setAppointments(apptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      window.localStorage.setItem('emailForSignIn', email);
      loginMock(email);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111] p-8 rounded-3xl border border-neutral-800 shadow-xl text-center">
          <Logo className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Meu Estilo</h1>
          <p className="text-neutral-400 mb-8">
            Acesse seu histórico, barbeiro preferido e agende seu corte habitual rapidamente.
          </p>
          
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Seu Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Meu Estilo'}
              </button>
            </form>
          
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <Link to="/agendar" className="text-neutral-500 hover:text-white transition-colors text-sm">
              Voltar para Agendamento Comum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lastAppointment = appointments[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {reviewingAppt && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] p-6 rounded-2xl border border-neutral-800 w-full max-w-md">
               <h3 className="text-xl font-bold mb-4">Avalie seu atendimento</h3>
               <p className="text-neutral-400 mb-6">Como foi sua experiência no dia {new Date(reviewingAppt.startTime).toLocaleDateString('pt-BR')}?</p>
               
               <div className="flex gap-2 justify-center mb-6">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'text-orange-500 fill-orange-500' : 'text-neutral-600'}`} />
                    </button>
                  ))}
               </div>

               <textarea 
                 value={reviewComment}
                 onChange={(e) => setReviewComment(e.target.value)}
                 className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white mb-4 outline-none focus:border-orange-500 resize-none h-32"
                 placeholder="Deixe um comentário (opcional)"
               />

               <div className="flex gap-2">
                 <button onClick={() => setReviewingAppt(null)} className="flex-1 px-4 py-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors">Cancelar</button>
                 <button onClick={submitReview} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-medium transition-colors">Enviar</button>
               </div>
            </div>
         </div>
      )}
      <header className="border-b border-neutral-800 sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg hidden sm:inline">Meu Estilo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/agendar" className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors">
              Novo Agendamento
            </Link>
            <button onClick={logout} className="text-neutral-500 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-900/80 to-neutral-900/40 p-6 sm:p-8 rounded-3xl border border-neutral-800">
          <div>
            <h1 className="text-3xl font-bold mb-2">Olá, {profile.fullName.split(' ')[0]}</h1>
            <p className="text-neutral-400">Seja bem-vindo de volta ao seu espaço pessoal.</p>
          </div>
          <Link 
            to={`/agendar?repeat=true`} 
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 text-center"
          >
            Agendar meu corte de sempre
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Histórico
              </h2>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="bg-[#111] p-6 rounded-2xl border border-neutral-800 text-center text-neutral-500">
                    Você ainda não tem agendamentos.
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div key={appt.id} className="bg-[#111] p-5 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-lg mb-1">{new Date(appt.startTime).toLocaleDateString('pt-BR')} às {new Date(appt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-neutral-400 text-sm">Status: <span className={statusColors[appt.status]}>{statusLabels[appt.status]}</span></div>
                        </div>
                        <div className="text-right font-bold text-orange-500">
                          R$ {appt.totalPrice?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-neutral-800 rounded-lg text-sm text-neutral-300">Serviço escolhido</span>
                      </div>
                      <Link 
                        to={`/agendar?repeat=${appt.id}`}
                        className="w-full block text-center py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-medium transition-colors"
                      >
                        Repetir este atendimento
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-[#111] p-6 rounded-2xl border border-neutral-800">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Preferências
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Barbeiro Preferido</div>
                  <div className="font-medium bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">{prefBarberName}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Serviço Frequente</div>
                  <div className="font-medium bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">{prefServiceName}</div>
                </div>
              </div>
            </section>

            <section className="bg-[#111] p-6 rounded-2xl border border-neutral-800">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                Fotos de Referência
              </h2>
              <div className="text-center text-sm text-neutral-500 py-4">
                Em breve você poderá salvar suas referências aqui.
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
