import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { releaseProductsForAppointment } from '../../lib/inventoryLogic';

import { db } from '../../lib/firebase';
import { Appointment } from '../../types';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function CancellationPage() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchAppointment() {
      if (!id) return;
      try {
        const docRef = doc(db, 'appointments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAppointment({ id: docSnap.id, ...docSnap.data() } as Appointment);
        } else {
          setError('Agendamento não encontrado.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar o agendamento.');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [id]);

  async function handleCancel() {
    if (!id || !appointment) return;
    setCancelling(true);
    try {
      const docRef = doc(db, 'appointments', id);
      if (appointment.productIds && appointment.productIds.length > 0) {
        await releaseProductsForAppointment(appointment.productIds, id, appointment.customerName, 'Cancelado pelo cliente');
      }
      await updateDoc(docRef, { status: 'cancelled' });
      setSuccess(true);
      setAppointment({ ...appointment, status: 'cancelled' });
    } catch (err) {
      console.error(err);
      setError('Erro ao cancelar agendamento.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Ops!</h1>
        <p className="text-neutral-500 mb-6">{error}</p>
        <Link to="/" className="text-orange-500 hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="bg-[#111] border border-neutral-800 p-8 rounded-3xl max-w-md w-full shadow-sm text-center">
        {success || appointment.status === 'cancelled' ? (
          <>
            <div className="w-16 h-16 bg-neutral-800 text-neutral-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Agendamento Cancelado</h1>
            <p className="text-neutral-400 mb-8">
              O horário foi liberado com sucesso.
            </p>
            <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors inline-block">
              Fazer novo agendamento
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cancelar Agendamento?</h1>
            <p className="text-neutral-400 mb-8">
              Tem certeza que deseja cancelar seu horário, {appointment.customerName}?
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                Sim, cancelar horário
              </button>
              <Link to="/" className="w-full block bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-3 rounded-xl font-medium transition-colors">
                Não, manter horário
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
