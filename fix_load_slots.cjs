const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const targetEffect = `  useEffect(() => {
    if (step === 3 && selectedService && selectedBarberId) {
      loadSlots();
    }
  }, [step, selectedDate, selectedBarberId, selectedService]);

  async function loadSlots() {
    if (!selectedService || !selectedBarberId) return;
    setLoadingSlots(true);
    try {
      const targetBarberId = selectedBarberId;
        
      const barber = barbers.find(b => b.id === targetBarberId);
      if (!barber) {
        setAvailableSlots([]);
        return;
      }

      // Fetch appointments and blocks for this day
      const startOfDayStr = format(selectedDate, "yyyy-MM-dd'T'00:00:00");
      const endOfDayStr = format(selectedDate, "yyyy-MM-dd'T'23:59:59");
      
      // In Firestore, we should query by startTime between start of day and end of day.
      // Since this is a simple local demo without composite indexes initially, we fetch all active and filter locally for the day.
      // (Optimization needed for production)
      const apptsSnap = await getDocs(query(collection(db, 'appointments'), where('barberId', '==', barber.id)));
      const blocksSnap = await getDocs(query(collection(db, 'blocks'), where('barberId', '==', barber.id)));
      
      const dayAppointments = apptsSnap.docs.map(d => d.data() as Appointment);
      const dayBlocks = blocksSnap.docs.map(d => d.data() as Block);

      const slots = generateAvailableSlots(selectedDate, barber, selectedService, dayAppointments, dayBlocks);
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error loading slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }`;

const newEffect = `
  const BOOKING_MAX_DATE = new Date("2026-12-31T23:59:59-03:00");

  useEffect(() => {
    if (step === 3 && selectedService && selectedBarberId) {
      loadBarberData();
    }
  }, [step, selectedBarberId, selectedService, currentMonth]);

  useEffect(() => {
    if (step === 3 && selectedService && selectedBarberId && barberAppointments && barberBlocks) {
      calculateMonthAvailability();
    }
  }, [selectedBarberId, selectedService, currentMonth, barberAppointments, barberBlocks]);

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
        if (!barber.workingHours[dayOfWeek]?.isActive) {
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
`;

code = code.replace(targetEffect, newEffect);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
