import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getSmartUpsellProducts } from '../../lib/upsellLogic';


import { auth } from '../../lib/firebase';
import { reserveProductsForAppointment } from '../../lib/inventoryLogic';

import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Scissors, Calendar as CalendarIcon, Clock, User, CheckCircle, MapPin, Navigation2, Copy, MessageCircle } from 'lucide-react';
import { useSettings } from '../../lib/useSettings';
import { collection, getDocs, query, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Service, Barber, Appointment, Block } from '../../types';
import { generateAvailableSlots } from '../../lib/booking';
import { format, addDays, startOfToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, isAfter, getDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';




function MonthCalendar({ currentMonth, setCurrentMonth, selectedDate, setSelectedDate, monthAvailability }: any) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startDayOfWeek = getDay(start); 
  
  const BOOKING_MAX_DATE = new Date("2026-12-31T23:59:59-03:00");
  const canGoNext = isBefore(currentMonth, startOfMonth(BOOKING_MAX_DATE));
  const canGoPrev = isAfter(currentMonth, startOfMonth(startOfToday()));
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => canGoPrev && setCurrentMonth(subMonths(currentMonth, 1))} 
          disabled={!canGoPrev}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="font-bold text-lg capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</div>
        <button 
          onClick={() => canGoNext && setCurrentMonth(addMonths(currentMonth, 1))} 
          disabled={!canGoNext}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={'empty-'+i} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDate);
          const availability = monthAvailability[dateStr];
          
          let className = "p-2 rounded-xl flex flex-col items-center justify-center h-12 text-sm transition-colors border outline-none ";
          
          if (!availability) {
            className += "opacity-50 cursor-not-allowed border-transparent";
            return <div key={dateStr} className={className}>{format(day, 'd')}</div>;
          }
          
          if (availability.status === 'available') {
            className += "cursor-pointer hover:border-orange-500 ";
            if (isSelected) {
               className += "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20";
            } else {
               className += "bg-neutral-900 border-neutral-800";
            }
          } else {
            // Un-available day
            className += "opacity-[0.35] cursor-not-allowed border-transparent hover:bg-neutral-800 ";
            if (isSelected) {
               className += " border-neutral-600 bg-neutral-800";
            }
          }
          
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(day)}
              className={className}
              aria-disabled={availability.status !== 'available'}
              aria-label={availability.status === 'available' ? 'Data disponível' : 'Data indisponível'}
            >
              <span className="font-medium">{format(day, 'd')}</span>
              {availability.status === 'available' && <div className="w-1 h-1 rounded-full bg-orange-500 mt-1 absolute bottom-1"></div>}
            </button>
          );
        })}
      </div>
      
      <div className="flex gap-4 mt-6 text-xs text-neutral-400 justify-center flex-wrap bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Disponível</div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm border border-neutral-600 bg-neutral-800 opacity-50"></div> Indisponível</div>
      </div>
    </div>
  );
}

export function BookingFlow() {
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError(false);
      const [productsSnap, recommendationsSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'service_product_recommendations'))
      ]);
      setDbProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      setRecommendations(recommendationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    } catch(err) {
      setProductsError(true);
    } finally {
      setLoadingProducts(false);
    }
  };
  const upsellRef = useRef<HTMLElement>(null);
  const continueBtnRef = useRef<HTMLButtonElement>(null);
  const handleSelectService = (service: Service) => {
    if (selectedService?.id !== service.id) {
      setSelectedService(service);
      setSelectedProducts([]);
      setTimeout(() => {
        upsellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } else {
      setTimeout(() => {
        upsellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  };


  const { location: BARBERSHOP_LOCATION } = useSettings();
  // removed duplicate user
  
  // Find Appointment States
  const [showFindAppt, setShowFindAppt] = useState(false);
  const [findApptInput, setFindApptInput] = useState('');
  const [findApptStatus, setFindApptStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [foundAppts, setFoundAppts] = useState<Appointment[]>([]);
  const [searchParams] = useSearchParams();
  const repeatApptId = searchParams.get('repeat');
  const rescheduleApptId = searchParams.get('reschedule');
  const queryBarber = searchParams.get('barber');
  const [rescheduleOldId, setRescheduleOldId] = useState<string | null>(rescheduleApptId);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(startOfToday()));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  
  const [barberAppointments, setBarberAppointments] = useState<Appointment[]>([]);
  const [barberBlocks, setBarberBlocks] = useState<Block[]>([]);
  
  // A mapping from YYYY-MM-DD to its status
  const [monthAvailability, setMonthAvailability] = useState<Record<string, { status: string, slots: Date[] }>>({});

  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistTimePref, setWaitlistTimePref] = useState('Qualquer horário');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Available Slots Data
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setLoadingProducts(true);
        setProductsError(false);

        const [
          servicesSnap,
          barbersSnap,
          recsSnap,
          locSnap,
          productsSnap
        ] = await Promise.all([
          getDocs(query(collection(db, 'services'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'barbers'), where('isActive', '==', true))),
          getDocs(collection(db, 'service_product_recommendations')),
          getDocs(collection(db, 'settings')),
          getDocs(collection(db, 'products'))
        ]);

        const locDoc = locSnap.docs.find(d => d.id === 'location');
        if (locDoc) setLocationData(locDoc.data());
        
        const loadedServices = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
        const loadedBarbers = barbersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber));
        
        setServices(loadedServices);
        setBarbers(loadedBarbers);
        setRecommendations(recsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const allProds = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setDbProducts(allProds);
        setProducts(allProds.filter(p => p.isActive));

        // Handle repeat query param (legacy: ?repeat=apptId)
        const params = new URLSearchParams(location.search);
        const repeatVal = params.get('repeat');
        
        // Handle new MeuEstilo direct params: ?barberId=X&serviceId=Y&email=Z&phone=W
        const directBarberId  = params.get('barberId');
        const directServiceId = params.get('serviceId');
        const directEmail     = params.get('email');
        const directPhone     = params.get('phone');

        if (directBarberId || directServiceId) {
          let foundBarber  = directBarberId  || null;
          let foundService = directServiceId ? (loadedServices.find(s => s.id === directServiceId) || null) : null;

          // Validate barber still active
          if (foundBarber && !loadedBarbers.find(b => b.id === foundBarber)) foundBarber = null;

          if (foundBarber)  setSelectedBarberId(foundBarber);
          if (foundService) setSelectedService(foundService);

          // Pre-fill customer contact info
          if (directEmail || directPhone) {
            setCustomer(prev => ({
              ...prev,
              email: directEmail || prev.email,
              phone: directPhone || prev.phone,
            }));
          }

          if (foundBarber && foundService) setStep(3);
        } else if (repeatVal) {
          let foundBarber = null;
          let foundService = null;
          
          if (repeatVal !== "true") {
             try {
                const apptDoc = await getDoc(doc(db, 'appointments', repeatVal));
                if (apptDoc.exists()) {
                   const appt = apptDoc.data();
                   foundBarber = appt.barberId;
                   foundService = loadedServices.find(s => s.id === appt.serviceId) || null;
                }
             } catch (e) {
                console.error("Error fetching repeat appointment", e);
             }
          }

          if (!foundBarber || !foundService) {
             if (user) {
               const profileSnap = await getDocs(query(collection(db, 'client_profiles'), where('authUserId', '==', user.uid)));
               if (!profileSnap.empty) {
                 const profile = profileSnap.docs[0].data();
                 if (profile.preferredBarberId) foundBarber = profile.preferredBarberId;
                 if (profile.preferredServiceId) foundService = loadedServices.find(s => s.id === profile.preferredServiceId) || null;
               }
             }
          }
          
          if (foundBarber) setSelectedBarberId(foundBarber);
          if (foundService) setSelectedService(foundService);
          
          if (foundBarber && foundService) {
             setStep(3);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setProductsError(true);
      } finally {
        setLoading(false);
        setLoadingProducts(false);
      }
    }
    loadInitialData();
  }, [location.search, user]);

  const BOOKING_MAX_DATE = new Date("2026-12-31T23:59:59-03:00");

  useEffect(() => {
    if (step === 3 && selectedService && selectedBarberId) {
      loadBarberData();
    }
  }, [step, selectedBarberId, selectedService, currentMonth, barbers]);

  useEffect(() => {
    if (step === 3 && selectedService && selectedBarberId && barberAppointments && barberBlocks) {
      calculateMonthAvailability();
    }
  }, [selectedBarberId, selectedService, currentMonth, barberAppointments, barberBlocks, barbers]);

  useEffect(() => {
     if (monthAvailability) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        setAvailableSlots(monthAvailability[dateStr]?.slots || []);
     }
  }, [selectedDate, monthAvailability]);

  async function loadBarberData() {
    if (!selectedService || !selectedBarberId) return;
    setLoadingSlots(true);
    try {
      const targetBarberId = selectedBarberId;
      const barber = barbers.find(b => b.id === targetBarberId);
      if (!barber) {
        setAvailableSlots([]);
        return;
      }

      const { getDocs, query, collection, where } = await import('firebase/firestore');
      // Fetch all appointments for the barber. 
      const apptsSnap = await getDocs(query(collection(db, 'appointments'), where('barberId', '==', barber.id)));
      const blocksSnap = await getDocs(query(collection(db, 'blocks'), where('barberId', '==', barber.id)));
      
      const appts = apptsSnap.docs.map(d => d.data() as Appointment);
      const blocks = blocksSnap.docs.map(d => d.data() as Block);
      
      setBarberAppointments(appts);
      setBarberBlocks(blocks);
    } catch (err) {
      console.error("Error loading barber data:", err);
    } finally {
      setLoadingSlots(false);
    }
  }

  function calculateMonthAvailability() {
     if (!selectedService || !selectedBarberId) return;
     const barber = barbers.find(b => b.id === selectedBarberId);
     if (!barber) return;
     
     const start = startOfMonth(currentMonth);
     const end = endOfMonth(currentMonth);
     
     const days = eachDayOfInterval({ start, end });
     const availability: Record<string, { status: string, slots: Date[] }> = {};
     
     const today = startOfToday();
     
     days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = getDay(day);
        
        if (isBefore(day, today)) {
           availability[dateStr] = { status: 'past', slots: [] };
           return;
        }
        
        if (isAfter(day, BOOKING_MAX_DATE) || isSameDay(day, BOOKING_MAX_DATE) === false && day > BOOKING_MAX_DATE) {
           // wait, we can just use isAfter(startOfDay(day), startOfDay(BOOKING_MAX_DATE))
           if (isAfter(startOfDay(day), startOfDay(BOOKING_MAX_DATE))) {
              availability[dateStr] = { status: 'outside_booking_range', slots: [] };
              return;
           }
        }
        
        // check working schedule
        if (!barber.schedule[dayOfWeek]?.isOpen) {
           availability[dateStr] = { status: 'barber_day_off', slots: [] };
           return;
        }
        
        // Let's generate slots
        const slots = generateAvailableSlots(day, barber, selectedService, barberAppointments, barberBlocks);
        
        if (slots.length > 0) {
           availability[dateStr] = { status: 'available', slots };
        } else {
           // We need to differentiate fully_booked, blocked, outside_working_schedule
           // Actually, if workingHours is active but slots = 0, could be fully booked or blocked
           // We can just call it fully_booked for now since generateAvailableSlots handles the rest, but the prompt says:
           // "fully_booked" : Está dentro do expediente, mas todos os horários válidos já estão ocupados.
           // "blocked" : O dia inteiro possui bloqueio administrativo.
           
           // A quick check for full block
           const dayBlocks = barberBlocks.filter(b => b.date === dateStr);
           const isFullyBlocked = dayBlocks.some(b => b.startTime === '00:00' && b.endTime === '23:59');
           
           if (isFullyBlocked) {
              availability[dateStr] = { status: 'blocked', slots: [] };
           } else {
              availability[dateStr] = { status: 'fully_booked', slots: [] };
           }
        }
     });
     
     setMonthAvailability(availability);
  }


  async function handleConfirm() {
    if (!selectedService || !selectedBarberId || !selectedSlot) {
       alert("Preencha todos os dados antes de confirmar.");
       return;
    }
    if (!customer.name || !customer.phone) {
       alert("Preencha seu nome e telefone.");
       return;
    }
    
    setLoading(true);
    try {
      const { runTransaction, doc, collection, getDocs, query, where } = await import('firebase/firestore');
      const { parseISO, areIntervalsOverlapping } = await import('date-fns');

      const targetBarberId = selectedBarberId;
      const appointmentStartTime = selectedSlot.toISOString();
      const appointmentEndTime = new Date(selectedSlot.getTime() + selectedService.durationMinutes * 60000).toISOString();
      const startDate = parseISO(appointmentStartTime);
      const endDate = parseISO(appointmentEndTime);

      // Check legacy overlapping outside transaction first
      const apptsSnap = await getDocs(query(collection(db, 'appointments'), where('barberId', '==', targetBarberId)));
      const existingAppts = apptsSnap.docs.map(d => ({id: d.id, ...d.data()} as Appointment));
      const hasLegacyOverlap = existingAppts.some(app => {
        if (app.status === 'cancelled') return false;
        if (rescheduleOldId && app.id === rescheduleOldId) return false;
        return areIntervalsOverlapping(
          { start: startDate, end: endDate },
          { start: parseISO(app.startTime), end: parseISO(app.endTime) },
          { inclusive: false }
        );
      });

      if (hasLegacyOverlap) {
         throw new Error("OVERLAP");
      }

      const scheduleLockRef = doc(db, 'daily_schedules', `${targetBarberId}_${format(startDate, 'yyyy-MM-dd')}`);
      const newApptRef = doc(collection(db, 'appointments'));
      const tokenRef = doc(collection(db, 'appointment_management_tokens'));

      const servicePrice = selectedService.barberOverrides?.[targetBarberId]?.price ?? selectedService.price;
      const productsPrice = selectedProducts.reduce((acc, productId) => {
        const product = dbProducts.find(p => p.id === productId);
        return acc + (product?.price ?? 0);
      }, 0);
      const totalPrice = servicePrice + productsPrice;

      const tokenStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const appointment: Omit<Appointment, 'id'> = {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        whatsapp_confirmation_status: 'not_sent',
        serviceId: selectedService.id,
        barberId: targetBarberId,
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        status: 'pending_confirmation',
        paymentStatus: 'pending',
        totalPrice: totalPrice,
        createdAt: new Date().toISOString(),
        productIds: selectedProducts,
        // bookingSource: repeatApptId ? 'repeat_booking' : 'manual',
        // cancellationTokenHash: tokenStr,
        // publicCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };

      await runTransaction(db, async (transaction) => {
          const lockDoc = await transaction.get(scheduleLockRef);
          let bookedSlots = [];
          if (lockDoc.exists()) {
             bookedSlots = lockDoc.data().bookedSlots || [];
          }

          // Check overlap in lock
          let hasOverlap = false;
          let activeSlots = [];
          for (const slot of bookedSlots) {
             if (rescheduleOldId && slot.appointmentId === rescheduleOldId) continue;
             
             const isOverlap = areIntervalsOverlapping(
                { start: startDate, end: endDate },
                { start: parseISO(slot.start), end: parseISO(slot.end) },
                { inclusive: false }
             );
             
             if (isOverlap) {
                // Check if the overlapping appointment is actually still active
                const apptDoc = await transaction.get(doc(db, 'appointments', slot.appointmentId));
                if (apptDoc.exists() && apptDoc.data().status !== 'cancelled') {
                   hasOverlap = true;
                   break;
                }
             } else {
                activeSlots.push(slot); // Keep track of non-overlapping slots just in case
             }
          }

          if (hasOverlap) {
             throw new Error("OVERLAP");
          }

          // check products
          const productDocs = [];
          if (selectedProducts.length > 0) {
             for (const pId of selectedProducts) {
                const pRef = doc(db, 'products', pId);
                const pDoc = await transaction.get(pRef);
                if (pDoc.exists()) {
                   const data = pDoc.data();
                   if (data.stockAvailable <= 0) throw new Error("OUT_OF_STOCK_" + pId);
                   productDocs.push({ ref: pRef, data });
                }
             }
          }

          // Update lock
          bookedSlots.push({ start: appointmentStartTime, end: appointmentEndTime, appointmentId: newApptRef.id });
          transaction.set(scheduleLockRef, { bookedSlots }, { merge: true });

          // Update inventory
          for (const { ref, data } of productDocs) {
             transaction.update(ref, {
                stockAvailable: data.stockAvailable - 1,
                stockReserved: data.stockReserved + 1
             });
          }

          // Create appointment
          transaction.set(newApptRef, appointment);

          // Create token
          transaction.set(tokenRef, {
             appointmentId: newApptRef.id,
             token: tokenStr,
             expiresAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
             createdAt: new Date().toISOString()
          });

          // Cancel old if rescheduling
          if (rescheduleOldId) {
             const oldRef = doc(db, 'appointments', rescheduleOldId);
             transaction.update(oldRef, { status: 'cancelled' });
          }
      });

      setCreatedToken(tokenStr);
      setCreatedAppointmentId(newApptRef.id);
      

      
      if (user) {
         try {
            const { updateDoc } = await import("firebase/firestore");
            const profileSnap = await getDocs(query(collection(db, "client_profiles"), where("authUserId", "==", user.uid)));
            if (!profileSnap.empty) {
               const pDoc = profileSnap.docs[0];
               await updateDoc(doc(db, "client_profiles", pDoc.id), {
                  preferredBarberId: targetBarberId,
                  preferredServiceId: selectedService.id
               });
            }
         } catch (e) {
            console.error("Error updating preferences", e);
         }
      }
      setStep(5);
    } catch (err: any) {
      console.error("Error saving appointment:", err);
      if (err.message === "OVERLAP") {
         alert("Este horário acabou de ser reservado por outra pessoa. Escolha outro horário disponível para continuar.");
         setStep(3);
         loadBarberData();
      } else if (err.message && err.message.startsWith("OUT_OF_STOCK")) {
         alert("Um ou mais produtos selecionados não estão mais disponíveis no estoque.");
      } else {
         alert("Não foi possível confirmar agora. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }
  if (loading && step === 1) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white">
      <header className="border-b border-neutral-800 bg-[#0A0A0A] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <Scissors className="w-5 h-5 text-orange-500" />
            <span>Agendamento</span>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {step < 5 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-orange-500">Passo {step} de 4</span>
              <span className="text-sm text-neutral-500">
                {step === 1 && 'Selecione um Profissional'}
                {step === 2 && 'Selecione os Serviços'}
                {step === 3 && 'Selecione o Horário'}
                {step === 4 && 'Confirmar'}
              </span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>
          </div>
        )}

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait" initial={false}>
          
          {/* STEP 1: BARBER */}
          
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold">Selecione um Profissional</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {barbers.map(barber => (
                  <button 
                    key={barber.id}
                    onClick={() => { setSelectedBarberId(barber.id); setStep(2); }}
                    className="p-4 rounded-xl border border-neutral-800 hover:border-orange-500 hover:border-orange-500 transition-colors flex items-center gap-4 bg-neutral-900/50"
                  >
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                      {barber.photoUrl ? (
                        <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold">{barber.name}</h3>
                      <p className="text-sm text-neutral-500 line-clamp-1">{barber.specialties.join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            </motion.div>
          )}
          
          {step === 1 && (
            <motion.div key="find-appt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 text-center pt-8 border-t border-neutral-800">
               <p className="text-neutral-400 mb-4">Já possui um horário marcado?</p>
               <button onClick={() => setShowFindAppt(true)} className="px-6 py-2 rounded-full border border-neutral-700 text-white hover:bg-neutral-800 transition-colors">
                  Encontrar meu agendamento
               </button>
            </motion.div>
          )}

          {/* STEP 2: SERVICE */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div>
              <div className="flex items-center mb-6">
                <button onClick={() => setStep(1)} className="mr-4 p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Selecione os Serviços</h2>
              </div>
              
              {services.filter(s => s.barberIds.includes(selectedBarberId || '')).length === 0 ? (
                <p className="text-neutral-500">Nenhum serviço disponível para este profissional.</p>
              ) : (
                <div className="space-y-4">
                  {services
                    .filter(s => s.barberIds.includes(selectedBarberId || ''))
                    .map(service => {
                      const price = selectedBarberId && service.barberOverrides?.[selectedBarberId]?.price !== undefined 
                        ? service.barberOverrides[selectedBarberId].price 
                        : service.price;
                      const durationMinutes = selectedBarberId && service.barberOverrides?.[selectedBarberId]?.durationMinutes !== undefined 
                        ? service.barberOverrides[selectedBarberId].durationMinutes 
                        : service.durationMinutes;
                        
                      const isSelected = selectedService?.id === service.id;
                        
                      return (
                      <div 
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group cursor-pointer ${isSelected ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10 scale-[1.02]' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50 hover:scale-[1.01]'}`}
                      >
                        <div>
                          <h3 className={`font-bold transition-colors ${isSelected ? 'text-orange-500' : 'group-hover:text-orange-500'}`}>{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4 flex flex-col items-end shrink-0 gap-2">
                          <div>
                            <div className="font-bold text-lg">R$ {price.toFixed(2)}</div>
                            <div className="text-sm text-neutral-500">{durationMinutes} min</div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectService(service);
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-orange-500 hover:bg-neutral-700'}`}
                          >
                            {isSelected ? 'Selecionado' : 'Adicionar'}
                          </button>
                        </div>
                      </div>
                    )})}
                </div>
              )}

              {selectedService && (
                <section ref={upsellRef} aria-labelledby="upsell-title" className="mt-8 bg-neutral-900/50 rounded-2xl border border-neutral-800 p-6">
                  <div className="mb-4">
                    {repeatApptId && selectedProducts.length > 0 && (
                      <div className="mb-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 p-4 rounded-xl text-sm">
                        Incluímos os produtos do seu último atendimento. Você pode remover ou adicionar itens antes de continuar.
                      </div>
                    )}
                    <h3 id="upsell-title" className="text-xl font-bold text-white">Complete seu cuidado em casa</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Recomendado com base no seu serviço e nas suas escolhas anteriores. A compra é opcional e o pagamento é realizado presencialmente.
                    </p>
                  </div>

                  {loadingProducts ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-neutral-800 rounded-xl w-full"></div>
                      ))}
                    </div>
                  ) : productsError ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                      <p className="text-red-500 text-sm font-bold mb-1">Não foi possível carregar os produtos adicionais.</p>
                      <button type="button" onClick={loadProducts} className="px-4 py-2 mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm transition-colors">
                        Tentar novamente
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).length === 0 ? (
                        <p className="text-neutral-500 py-4">Nenhum produto adicional está disponível no momento.</p>
                      ) : (
                        getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product) => {
                          const isSelected = selectedProducts.includes(product.id);
                          const isOutOfStock = product.stockAvailable <= 0 && product.trackStock !== false;
                          
                          return (
                            <div
                              key={product.id}
                              onClick={() => {
                                if (isOutOfStock) return;
                                if (isSelected) {
                                  setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                } else {
                                  setSelectedProducts(prev => [...prev, product.id]);
                                }
                                setTimeout(() => {
                                  continueBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 200);
                              }}
                              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group ${isOutOfStock ? 'opacity-50 cursor-not-allowed border-neutral-800 bg-neutral-900/20' : isSelected ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10 scale-[1.02] cursor-pointer' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50 hover:scale-[1.01] cursor-pointer'}`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-neutral-600 group-hover:border-orange-500'}`}>
                                    {isSelected && <CheckCircle className="w-3 h-3" />}
                                  </div>
                                  <h4 className={`font-bold transition-colors ${isSelected ? 'text-orange-500' : 'group-hover:text-orange-500'}`}>{product.name}</h4>
                                </div>
                                {product.label && (
                                  <div className="mt-2 ml-7">
                                    <span className="inline-block bg-orange-500/20 text-orange-500 text-xs font-semibold px-2 py-1 rounded-md">
                                      {product.label}
                                    </span>
                                  </div>
                                )}
                                {product.description && product.description !== '—' && (
                                  <p className="text-sm text-neutral-500 line-clamp-2 mt-2 ml-7">{product.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4 flex flex-col items-end shrink-0 gap-1">
                                <div className="font-bold text-lg">
                                  R$ {Number(product.price).toFixed(2)}
                                </div>
                                {isOutOfStock && <span className="text-xs text-red-500 font-medium">Indisponível</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </section>
              )}

              {selectedService && (
                <div className="mt-8 animate-fade-in bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6">
                  <h3 className="font-bold text-lg mb-4 text-white">Resumo</h3>
                  <div className="space-y-3 text-sm text-neutral-300">
                     <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Serviço</span>
                           <span>{selectedService.name}</span>
                        </div>
                        <span className="font-bold">R$ {selectedBarberId && selectedService.barberOverrides?.[selectedBarberId]?.price !== undefined ? selectedService.barberOverrides[selectedBarberId].price.toFixed(2) : selectedService.price.toFixed(2)}</span>
                     </div>
                     {selectedProducts.map(pid => {
                        const prod = dbProducts.find(p => p.id === pid);
                        if (!prod) return null;
                        return (
                           <div key={pid} className="flex justify-between items-center border-t border-neutral-800/50 pt-3">
                              <div className="flex flex-col">
                                 <span className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Produto adicional</span>
                                 <span>{prod.name}</span>
                              </div>
                              <span className="font-bold">R$ {prod.price.toFixed(2)}</span>
                           </div>
                        )
                     })}
                     <div className="flex justify-between items-center border-t border-neutral-800 pt-4 mt-4">
                        <span className="font-bold text-lg text-white">Total</span>
                        <span className="font-bold text-lg text-orange-500">
                           R$ {((selectedBarberId && selectedService.barberOverrides?.[selectedBarberId]?.price !== undefined ? selectedService.barberOverrides[selectedBarberId].price : selectedService.price) + selectedProducts.reduce((acc, pid) => acc + (dbProducts.find(p => p.id === pid)?.price || 0), 0)).toFixed(2)}
                        </span>
                     </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      ref={continueBtnRef}
                      onClick={() => setStep(3)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 w-full sm:w-auto"
                    >
                      Continuar para os horários
                    </button>
                  </div>
                </div>
              )}
            </div>
            </motion.div>
          )}

          {/* STEP 3: DATE & TIME */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div>
              <div className="flex items-center mb-6">
                <button onClick={() => setStep(2)} className="mr-4 p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Quando você quer vir?</h2>
              </div>
              
              <MonthCalendar 
                 currentMonth={currentMonth} 
                 setCurrentMonth={setCurrentMonth} 
                 selectedDate={selectedDate} 
                 setSelectedDate={setSelectedDate} 
                 monthAvailability={monthAvailability}
              />
              
              <div className="mb-4">
                 {(() => {
                    const dateStr = format(selectedDate, 'yyyy-MM-dd');
                    const availability = monthAvailability[dateStr];
                    
                    if (!availability) {
                       return <div className="text-center py-8 text-neutral-500">Buscando disponibilidade...</div>;
                    }
                    
                    if (availability.status === 'available') {
                       return (
                          <>
                             <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" /> {availability.slots.length} Horários Disponíveis
                             </h3>
                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                               {availability.slots.map((slot, i) => {
                                 const isSelected = selectedSlot?.getTime() === slot.getTime();
                                 return (
                                   <button
                                     key={i}
                                     onClick={() => { setSelectedSlot(slot); setStep(4); }}
                                     className={`py-3 rounded-xl font-medium transition-colors border ${isSelected ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50'}`}
                                   >
                                     {format(slot, 'HH:mm')}
                                   </button>
                                 );
                               })}
                             </div>
                          </>
                       );
                    }
                    
                    // Un-available day selected
                    let message = "Sem horários disponíveis.";
                    if (availability.status === 'fully_booked') message = "Todos os horários deste dia já foram reservados.";
                    else if (availability.status === 'barber_day_off') message = "Este profissional não atende neste dia.";
                    else if (availability.status === 'outside_working_schedule') message = "A barbearia não funciona nesta data.";
                    else if (availability.status === 'blocked') message = "Esta data está indisponível para agendamentos.";
                    else if (availability.status === 'past') message = "Esta data já passou.";
                    else if (availability.status === 'outside_booking_range') message = "Os agendamentos estão disponíveis somente até 31 de dezembro de 2026.";
                    
                    return (
                       <div className="text-center py-8 bg-[#111] rounded-xl border border-neutral-800 px-4">
                          <p className="text-neutral-300 font-bold mb-2">{message}</p>
                          <p className="text-sm mt-1 text-neutral-400 mb-6 max-w-sm mx-auto">Escolha outra data ou entre na lista de encaixe para receber um aviso caso surja uma vaga.</p>
                          
                          <div className="flex flex-col gap-3 max-w-xs mx-auto">
                             <button onClick={() => {
                                
                                const sortedDates = Object.keys(monthAvailability).sort();
                                const nextAvail = sortedDates.find(d => d > dateStr && monthAvailability[d].status === 'available');
                                if (nextAvail) {
                                   const dateToSet = new Date(nextAvail + 'T12:00:00');
                                   setSelectedDate(dateToSet);
                                   const newMonth = startOfMonth(dateToSet);
                                   if (!isSameMonth(currentMonth, newMonth)) {
                                      setCurrentMonth(newMonth);
                                   }
                                }
                             }} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-medium transition-colors border border-neutral-700 hidden">
                                Procurar próxima data
                             </button>
                             
                             <button onClick={() => setShowWaitlistForm(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-orange-500/20">
                                Entrar na lista de encaixe
                             </button>
                          </div>
                       </div>
                    );
                 })()}
              </div>
            </div>
            </motion.div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <div>
              <div className="flex items-center mb-6">
                <button onClick={() => setStep(3)} className="mr-4 p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Seus dados</h2>
              </div>
              
              <div className="bg-[#111] p-4 rounded-xl mb-6 border border-neutral-800">
                <p className="font-medium text-sm text-neutral-400 mb-2">Resumo do Agendamento</p>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold">{selectedService?.name}</div>
                  <div className="font-bold">
                    R$ {selectedService && selectedBarberId ? (selectedService.barberOverrides?.[selectedBarberId]?.price ?? selectedService.price).toFixed(2) : '0.00'}
                  </div>
                </div>
                
                {selectedProducts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-neutral-500 mb-1">Produtos Adicionais:</p>
                    {selectedProducts.map(productId => {
                      const product = dbProducts.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <div key={productId} className="flex justify-between items-center text-sm text-neutral-400">
                          <span>{product.name}</span>
                          <span>R$ {product.price.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="border-t border-neutral-800 mt-4 pt-4 flex justify-between items-center">
                  <span className="font-bold">Total a pagar no local</span>
                  <span className="font-bold text-orange-500 text-lg">
                    R$ {(() => {
                      const servicePrice = selectedService && selectedBarberId ? (selectedService.barberOverrides?.[selectedBarberId]?.price ?? selectedService.price) : 0;
                      const productsPrice = selectedProducts.reduce((acc, productId) => {
                        const product = dbProducts.find(p => p.id === productId);
                        return acc + (product?.price ?? 0);
                      }, 0);
                      return (servicePrice + productsPrice).toFixed(2);
                    })()}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-2 text-neutral-400 text-sm">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  {selectedSlot ? format(selectedSlot, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : ''}
                </div>
                  <div className="mt-8 text-center border-t border-neutral-800 pt-8">
                     <p className="text-neutral-500 mb-4">Não encontrou o horário ideal?</p>
                     <button onClick={() => setShowWaitlistForm(true)} className="px-6 py-2 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors">Entrar na Lista de Encaixe</button>
                  </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={customer.name}
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp (Celular)</label>
                  <input 
                    required
                    type="tel" 
                    value={customer.phone}
                    onChange={e => setCustomer({...customer, phone: e.target.value})}
                    className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">E-mail (opcional)</label>
                  <input 
                    type="email" 
                    value={customer.email}
                    onChange={e => setCustomer({...customer, email: e.target.value})}
                    className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? 'Confirmando...' : (repeatApptId ? 'Confirmar meu corte de sempre' : 'Confirmar Agendamento')}
                </button>
              </form>
            </div>
            </motion.div>
          )}

          {/* STEP 6: SUCCESS WAITLIST */}
          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="text-center py-12 animate-fade-in">
              <div className="w-20 h-20 bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Na Lista!</h2>
              <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                Você entrou na lista de encaixe para o dia <strong>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</strong>.
                Se algum horário vagar, nós avisaremos no seu WhatsApp.
              </p>
              
              <Link 
                to="/"
                className="inline-block bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-8 rounded-xl transition-colors border border-neutral-700"
              >
                Voltar ao Início
              </Link>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="text-center py-12 animate-fade-in">
              <div className="w-20 h-20 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Seu horário está confirmado.</h2>
              <p className="text-lg text-neutral-400 mb-2">
                Te esperamos no dia {selectedSlot ? format(selectedSlot, "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}.
              </p>
              <div className="mb-8 flex flex-col gap-3">
                 <button 
                   onClick={() => {
                     // Generate client-side confirmation message for Barbearia Tony official number
                     const officialNumber = (import.meta as any).env.VITE_WHATSAPP_BUSINESS_NUMBER || BARBERSHOP_LOCATION?.whatsapp?.replace(/\D/g, '');
                     if (!officialNumber) {
                        alert('Número oficial não configurado.');
                        return;
                     }
                     const msg = `Olá! Meu nome é ${customer.name}.\nAcabei de realizar o agendamento ${createdAppointmentId?.substring(0,6).toUpperCase()}.\nProfissional: ${barbers.find(b => b.id === selectedBarberId)?.name}\nServiço: ${selectedService?.name}\nData: ${selectedSlot ? format(selectedSlot, "dd/MM/yyyy", { locale: ptBR }) : ''}\nHorário: ${selectedSlot ? format(selectedSlot, "HH:mm", { locale: ptBR }) : ''}\nEstou confirmando meu horário pelo WhatsApp.`;
                     window.open(`https://wa.me/${officialNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                   }}
                   className="inline-flex justify-center bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
                 >
                   Confirmar também pelo WhatsApp
                 </button>
                 <button 
                   onClick={() => {
                     const officialNumber = (import.meta as any).env.VITE_WHATSAPP_BUSINESS_NUMBER || BARBERSHOP_LOCATION?.whatsapp?.replace(/\D/g, '');
                     if (!officialNumber) {
                        alert('Número oficial não configurado.');
                        return;
                     }
                     const msg = `Olá! Acabei de realizar o agendamento ${createdAppointmentId?.substring(0,6).toUpperCase()} e gostaria de falar com a Barbearia Tony.`;
                     window.open(`https://wa.me/${officialNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                   }}
                   className="inline-flex justify-center border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-8 py-3 rounded-full font-medium transition-colors"
                 >
                   Falar com a Barbearia Tony
                 </button>
              </div>

              <div className="bg-[#111] p-6 rounded-3xl border border-neutral-800 mb-8 text-left max-w-md mx-auto shadow-lg">
                  <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-500"/> Como chegar</h3>
                  <div className="text-sm text-neutral-300 mb-6 space-y-1">
                     <p className="font-medium text-white">{BARBERSHOP_LOCATION.name}</p>
                     <p>{BARBERSHOP_LOCATION.street}, nº {BARBERSHOP_LOCATION.number} — {BARBERSHOP_LOCATION.reference}</p>
                     <p>{BARBERSHOP_LOCATION.city} — {BARBERSHOP_LOCATION.stateCode}</p>
                     <p>CEP {BARBERSHOP_LOCATION.postalCode}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                     <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${BARBERSHOP_LOCATION.street}, ${BARBERSHOP_LOCATION.number}, ${BARBERSHOP_LOCATION.reference}, ${BARBERSHOP_LOCATION.city}, ${BARBERSHOP_LOCATION.stateCode}, ${BARBERSHOP_LOCATION.postalCode}, ${BARBERSHOP_LOCATION.country} (${BARBERSHOP_LOCATION.name})`)}`}
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                     >
                        <Navigation2 className="w-4 h-4" /> Traçar rota
                     </a>
                     <button 
                        onClick={() => {
                           navigator.clipboard.writeText(`${BARBERSHOP_LOCATION.street}, ${BARBERSHOP_LOCATION.number} — ${BARBERSHOP_LOCATION.reference}, ${BARBERSHOP_LOCATION.city} — ${BARBERSHOP_LOCATION.stateCode}, ${BARBERSHOP_LOCATION.postalCode}, ${BARBERSHOP_LOCATION.country}`).then(() => {
                              alert('Endereço copiado!');
                           });
                        }}
                        className="w-full bg-transparent border border-neutral-700 text-neutral-300 hover:bg-neutral-800 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                     >
                        <Copy className="w-4 h-4" /> Copiar endereço
                     </button>
                     <a 
                        href={`https://wa.me/${BARBERSHOP_LOCATION.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20meu%20agendamento.`}
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                     >
                        <MessageCircle className="w-4 h-4" /> Falar com a barbearia
                     </a>
                  </div>
              </div>
              
              {!user && (
                <div className="bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 mb-8 text-left max-w-md mx-auto">
                  <h3 className="font-bold text-lg mb-2 text-white">Salvar minhas preferências no Meu Estilo</h3>
                  <p className="text-sm text-neutral-400 mb-6">Guarde seu barbeiro, serviço e preferências para agendar mais rápido na próxima visita.</p>
                  <Link to="/meu-estilo" className="w-full inline-block text-center bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-neutral-700">
                    Criar meu perfil
                  </Link>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/"
                  className="inline-flex justify-center border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-8 py-3 rounded-full font-medium transition-colors"
                >
                  Voltar ao Início
                </Link>
                {createdAppointmentId && (
                  <Link 
                    to={`/agendamento/gerenciar/${createdToken || createdAppointmentId}`}
                    className="inline-flex justify-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
                  >
                    Ver Agendamento
                  </Link>
                )}
              </div>
            </div>
            </motion.div>
          )}
          </AnimatePresence>

          
        </div>
      </main>

      {/* WAITLIST MODAL */}
      <AnimatePresence>
        {showWaitlistForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#111] border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowWaitlistForm(false)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800">
                 <span className="text-sm">X</span>
              </button>
              
              <h2 className="text-2xl font-bold mb-2">Entrar na lista de encaixe</h2>
              <p className="text-neutral-400 mb-6 text-sm">Avisaremos caso surja um horário compatível com suas preferências. O horário só será reservado depois que você confirmar.</p>
              
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 setLoading(true);
                 try {
                    const { collection, addDoc, serverTimestamp, query, where, getDocs } = await import('firebase/firestore');
                    
                    // Check duplicate
                    const q = query(collection(db, 'waitlist_entries'), 
                        where('customerPhone', '==', customer.phone),
                        where('preferredDate', '==', format(selectedDate, 'yyyy-MM-dd')),
                        where('status', '==', 'waiting')
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        alert("Você já possui uma solicitação para esta data.");
                        setLoading(false);
                        return;
                    }

                    await addDoc(collection(db, 'waitlist_entries'), {
                        barberId: selectedBarberId,
                        serviceId: selectedService?.id,
                        customerName: customer.name,
                        customerPhone: customer.phone,
                        customerEmail: customer.email,
                        preferredDate: format(selectedDate, 'yyyy-MM-dd'),
                        timePeriod: waitlistTimePref,
                        status: 'waiting',
                        notificationConsent: true,
                        createdAt: serverTimestamp()
                    });
                    
                    alert("Você entrou na lista de encaixe com sucesso!");
                    setShowWaitlistForm(false);
                 } catch(err) {
                    console.error(err);
                    alert("Não foi possível entrar na lista agora. Tente novamente.");
                 } finally {
                    setLoading(false);
                 }
              }} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Nome Completo</label>
                    <input 
                      required type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})}
                      className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" placeholder="Seu nome"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp (Celular)</label>
                    <input 
                      required type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})}
                      className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" placeholder="(11) 99999-9999"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Período de preferência</label>
                    <select 
                      value={waitlistTimePref} onChange={e => setWaitlistTimePref(e.target.value)}
                      className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500 text-white"
                    >
                       <option value="Qualquer horário">Qualquer horário</option>
                       <option value="Manhã (09:00 - 12:00)">Manhã (09:00 - 12:00)</option>
                       <option value="Tarde (13:00 - 18:00)">Tarde (13:00 - 18:00)</option>
                       <option value="Noite (18:00 - 20:00)">Noite (18:00 - 20:00)</option>
                    </select>
                 </div>
                 <div className="flex items-start gap-2 mt-2">
                    <input required type="checkbox" id="consent" className="mt-1" />
                    <label htmlFor="consent" className="text-sm text-neutral-400">
                       Autorizo o envio de aviso pelo WhatsApp ou E-mail quando um horário surgir.
                    </label>
                 </div>
                 <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl font-bold transition-colors disabled:opacity-50 mt-4">
                    {loading ? 'Entrando na lista...' : 'Entrar na Lista de Encaixe'}
                 </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* FIND APPOINTMENT MODAL */}
      <AnimatePresence>
        {showFindAppt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#111] border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full relative"
            >
              <button onClick={() => { setShowFindAppt(false); setFindApptStatus('idle'); setFoundAppts([]); }} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800">
                 <User className="w-5 h-5 opacity-0" /> {/* placeholder for close icon, can use X if available, but let's use text */}
                 <span className="text-sm">X</span>
              </button>
              
              <h2 className="text-2xl font-bold mb-2">Não encontrou seu agendamento?</h2>
              
              {findApptStatus === 'idle' && (
                <>
                  <p className="text-neutral-400 mb-6 text-sm">Informe os dados utilizados na reserva (telefone ou e-mail) para consultar, confirmar, remarcar ou cancelar seu horário.</p>
                  <form onSubmit={async (e) => {
                     e.preventDefault();
                     if (!findApptInput) return;
                     setFindApptStatus('loading');
                     try {
                        const { getDocs, query, collection, where, or } = await import('firebase/firestore');
                        const q = query(collection(db, 'appointments'), or(where('customerPhone', '==', findApptInput), where('customerEmail', '==', findApptInput)));
                        const snap = await getDocs(q);
                        if (snap.empty) {
                           setFindApptStatus('not_found');
                        } else {
                           setFoundAppts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
                           setFindApptStatus('found');
                        }
                     } catch(err) {
                        console.error(err);
                        setFindApptStatus('not_found');
                     }
                  }}>
                     <input 
                       type="text" 
                       value={findApptInput} 
                       onChange={e => setFindApptInput(e.target.value)} 
                       placeholder="Seu telefone ou e-mail" 
                       className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:outline-none focus:border-orange-500 mb-4"
                     />
                     <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl font-bold transition-colors">
                        Buscar
                     </button>
                  </form>
                </>
              )}

              {findApptStatus === 'loading' && (
                <div className="py-8 text-center text-orange-500">Buscando...</div>
              )}

              {findApptStatus === 'not_found' && (
                <div className="text-center py-4">
                   <p className="text-neutral-300 font-bold mb-2">Nenhum agendamento foi encontrado.</p>
                   <p className="text-neutral-500 text-sm mb-6">Confira se o telefone ou e-mail informado é o mesmo utilizado na reserva.</p>
                   <div className="space-y-3">
                      <button onClick={() => setFindApptStatus('idle')} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-xl font-medium transition-colors">Tentar novamente</button>
                      <button onClick={() => { setShowFindAppt(false); setStep(1); }} className="w-full border border-neutral-800 hover:bg-neutral-900 text-white p-3 rounded-xl font-medium transition-colors">Fazer novo agendamento</button>
                   </div>
                </div>
              )}

              {findApptStatus === 'found' && (
                <div>
                   <p className="text-neutral-400 mb-4 text-sm">Se encontrarmos um agendamento associado aos dados informados, enviaremos uma forma segura de acesso. Para sua comodidade (ambiente de teste), mostramos os resultados abaixo:</p>
                   <div className="max-h-60 overflow-y-auto space-y-3 mb-6">
                      {foundAppts.filter(a => a.status !== 'cancelled' && a.status !== 'completed').map(appt => (
                         <div key={appt.id} className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
                            <div className="font-bold text-orange-500 mb-1">{new Date(appt.startTime).toLocaleString('pt-BR')}</div>
                            <div className="text-sm text-neutral-300 mb-3">{services.find(s => s.id === appt.serviceId)?.name || 'Serviço'} com {barbers.find(b => b.id === appt.barberId)?.name || 'Barbeiro'}</div>
                            <Link to={`/agendamento/gerenciar/${appt.id}`} className="block text-center w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg text-sm transition-colors">
                               Gerenciar Agendamento
                            </Link>
                         </div>
                      ))}
                      {foundAppts.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length === 0 && (
                         <p className="text-neutral-500 text-sm text-center">Todos os seus agendamentos já foram concluídos ou cancelados.</p>
                      )}
                   </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
