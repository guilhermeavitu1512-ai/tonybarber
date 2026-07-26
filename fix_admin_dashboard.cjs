const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Replace NotificationStatus with local status
const statusTarget = `import { NotificationStatus } from '../../components/NotificationStatus';`;
const newStatusTarget = `import { normalizePhoneForWhatsApp, formatWhatsAppMessage } from '../../lib/whatsapp';`;
code = code.replace(statusTarget, newStatusTarget);

// Add locationData state
const stateTarget = `const [appointments, setAppointments] = useState<Appointment[]>([]);`;
const newState = `const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [locationData, setLocationData] = useState<any>(null);`;
code = code.replace(stateTarget, newState);

// Load locationData
const loadTarget = `      const waitlistSnap = await getDocs(collection(db, 'waitlist'));`;
const newLoad = `      const waitlistSnap = await getDocs(collection(db, 'waitlist'));
      const locSnap = await getDocs(collection(db, 'settings'));
      const locDoc = locSnap.docs.find(d => d.id === 'location');
      if (locDoc) setLocationData(locDoc.data());`;
code = code.replace(loadTarget, newLoad);

// We need a helper to generate the link and copy
const helperTarget = `const updateStatus = async (id: string, newStatus: string) => {`;
const newHelper = `
  const handleOpenWhatsApp = async (appt: Appointment) => {
     const phone = normalizePhoneForWhatsApp(appt.customerPhone);
     if (!phone) {
        alert("O telefone do cliente precisa ser corrigido antes de abrir o WhatsApp.");
        return;
     }
     
     const barber = barbers.find(b => b.id === appt.barberId);
     const service = services.find(s => s.id === appt.serviceId);
     
     let productsText = "Nenhum produto adicional";
     if (appt.productIds && appt.productIds.length > 0) {
        // We might not have full product data loaded here in AdminDashboard by default
        // But we can just format the length for now, or assume they are in products collection
        // Actually, let's keep it simple as requested or just list IDs if we don't have names
        productsText = "Produtos selecionados (" + appt.productIds.length + ")";
     }
     
     const startDate = new Date(appt.startTime);
     const endDate = new Date(appt.endTime);
     
     const address = locationData ? \`\${locationData.name}\\n\${locationData.address}\\nCEP \${locationData.postalCode}\\n\${locationData.country}\` : 'Endereço não configurado';
     
     const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
     const link = \`\${baseUrl}/agendamento/gerenciar/\${appt.id}\`; // simplistic token
     
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
     const barber = barbers.find(b => b.id === appt.barberId);
     const service = services.find(s => s.id === appt.serviceId);
     const address = locationData ? \`\${locationData.name}\\n\${locationData.address}\\nCEP \${locationData.postalCode}\\n\${locationData.country}\` : 'Endereço não configurado';
     const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
     const link = \`\${baseUrl}/agendamento/gerenciar/\${appt.id}\`;
     
     const startDate = new Date(appt.startTime);
     const endDate = new Date(appt.endTime);
     
     const msg = formatWhatsAppMessage(
        appt.customerName,
        appt.id.substring(0,6).toUpperCase(),
        barber?.name || 'Barbeiro',
        service?.name || 'Serviço',
        startDate.toLocaleDateString('pt-BR'),
        startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        "Nenhum produto adicional", // simplistic
        "R$ " + (appt.totalPrice || 0).toFixed(2).replace('.', ','),
        address,
        link
     );
     
     navigator.clipboard.writeText(msg);
     alert("Mensagem copiada!");
  };

const updateStatus = async (id: string, newStatus: string) => {`;
code = code.replace(helperTarget, newHelper);

// Now the rendering in the table
const selectTarget = `                              <select
                                 className="bg-neutral-800 border border-neutral-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500 w-full"
                                value={appt.status}
                                onChange={(e) => updateStatus(appt.id, e.target.value)}
                              >
                                {Object.keys(statusLabels).map(k => (
                                   <option key={k} value={k}>{statusLabels[k]}</option>
                                ))}
                              </select>
                              <NotificationStatus appointmentId={appt.id} phone={appt.customerPhone} />
                           </td>`;

const newSelect = `                              <select
                                 className="bg-neutral-800 border border-neutral-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500 w-full mb-2"
                                value={appt.status}
                                onChange={(e) => updateStatus(appt.id, e.target.value)}
                              >
                                {Object.keys(statusLabels).map(k => (
                                   <option key={k} value={k}>{statusLabels[k]}</option>
                                ))}
                              </select>
                              
                              <div className="flex flex-col gap-1 mt-2">
                                 {(!appt.whatsapp_confirmation_status || appt.whatsapp_confirmation_status === 'not_sent') && (
                                    <button onClick={() => handleOpenWhatsApp(appt)} className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded w-full">
                                       Enviar WhatsApp
                                    </button>
                                 )}
                                 {appt.whatsapp_confirmation_status === 'opened' && (
                                    <>
                                       <span className="text-[10px] text-yellow-500 text-center">WhatsApp aberto</span>
                                       <button onClick={() => handleMarkSent(appt)} className="text-[10px] bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded w-full">
                                          Marcar como enviada
                                       </button>
                                    </>
                                 )}
                                 {appt.whatsapp_confirmation_status === 'sent_manually' && (
                                    <span className="text-[10px] text-green-500 text-center flex items-center justify-center gap-1">
                                       Confirmação enviada
                                    </span>
                                 )}
                                 <button onClick={() => handleCopyMessage(appt)} className="text-[10px] text-neutral-400 hover:text-white underline mt-1 text-center">
                                    Copiar Mensagem
                                 </button>
                              </div>
                           </td>`;
code = code.replace(selectTarget, newSelect);


// Add the "Confirmações Pendentes" section
const tableStartTarget = `<h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>`;
const pendingSection = `
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
          <h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>`;
code = code.replace(tableStartTarget, pendingSection);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
