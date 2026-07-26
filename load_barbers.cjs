const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const stateTarget = `const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locationData, setLocationData] = useState<any>(null);`;
const newState = `const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);`;
code = code.replace(stateTarget, newState);

const fetchTarget = `      const waitlistSnap = await getDocs(collection(db, 'waitlist'));
      const locSnap = await getDocs(collection(db, 'settings'));
      const locDoc = locSnap.docs.find(d => d.id === 'location');
      if (locDoc) setLocationData(locDoc.data());`;
const newFetch = `      const waitlistSnap = await getDocs(collection(db, 'waitlist'));
      const locSnap = await getDocs(collection(db, 'settings'));
      const locDoc = locSnap.docs.find(d => d.id === 'location');
      if (locDoc) setLocationData(locDoc.data());
      
      const barbersSnap = await getDocs(collection(db, 'barbers'));
      setBarbers(barbersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber)));
      const servicesSnap = await getDocs(collection(db, 'services'));
      setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));`;
code = code.replace(fetchTarget, newFetch);

const handleOpenTarget = `// Fetch barber and service since we don't have them in state
     // But we can't await easily inside format if we want to be fast, but we can await here
     // Let's just use appt properties if available or ID.
     // Let's fetch them on the fly if needed.`;
const newHandleOpen = `     const barber = barbers.find(b => b.id === appt.barberId);
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
     
     const url = \`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`;
     window.open(url, '_blank');
     
     try {
        await updateDoc(doc(db, 'appointments', appt.id), {
           whatsapp_confirmation_status: 'opened'
        });
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, whatsapp_confirmation_status: 'opened' } : a));
     } catch (e) {
        console.error("Erro ao atualizar status", e);
     }`;
code = code.replace(handleOpenTarget, newHandleOpen);

const copyMsgTarget = `     const msg = formatWhatsAppMessage(
        appt.customerName,
        appt.id.substring(0,6).toUpperCase(),
        'Barbeiro', // we will fix this
        'Serviço', // we will fix this`;
const newCopyMsg = `     const barber = barbers.find(b => b.id === appt.barberId);
     const service = services.find(s => s.id === appt.serviceId);
     
     let productsText = "Nenhum produto adicional";
     if (appt.productIds && appt.productIds.length > 0) {
        productsText = "Produtos selecionados (" + appt.productIds.length + ")";
     }

     const msg = formatWhatsAppMessage(
        appt.customerName,
        appt.id.substring(0,6).toUpperCase(),
        barber?.name || 'Barbeiro',
        service?.name || 'Serviço',`;
code = code.replace(copyMsgTarget, newCopyMsg);

const copyProductTarget = `endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        "Nenhum produto adicional",
        "R$ " + (appt.totalPrice || 0).toFixed(2).replace('.', ','),`;
const newCopyProduct = `endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        productsText,
        "R$ " + (appt.totalPrice || 0).toFixed(2).replace('.', ','),`;
code = code.replace(copyProductTarget, newCopyProduct);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
