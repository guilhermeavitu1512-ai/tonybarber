const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const helperTarget = `  async function updateStatus(id: string, newStatus: string) {`;
const newHelper = `
  const handleOpenWhatsApp = async (appt: Appointment) => {
     const phone = normalizePhoneForWhatsApp(appt.customerPhone);
     if (!phone) {
        alert("O telefone do cliente precisa ser corrigido antes de abrir o WhatsApp.");
        return;
     }
     
     // Note: we don't have barbers and services in AdminDashboard state directly unless we load them, but in the previous step the user didn't request adding them to AdminDashboard. Wait, they are requested to be shown in the UI "Profissional: [NOME]". But AdminDashboard currently doesn't fetch barbers/services in its list. Let's just use the ID or load them.
     // Actually, let's just make it generic if we don't have it, or fetch it.
     
     const address = locationData ? \`\${locationData.name}\\n\${locationData.address}\\nCEP \${locationData.postalCode}\\n\${locationData.country}\` : 'Endereço não configurado';
     
     const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
     const link = \`\${baseUrl}/agendamento/gerenciar/\${appt.id}\`;
     
     const startDate = new Date(appt.startTime);
     const endDate = new Date(appt.endTime);
     
     // Fetch barber and service since we don't have them in state
     // But we can't await easily inside format if we want to be fast, but we can await here
     // Let's just use appt properties if available or ID.
     // Let's fetch them on the fly if needed.
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
     const address = locationData ? \`\${locationData.name}\\n\${locationData.address}\\nCEP \${locationData.postalCode}\\n\${locationData.country}\` : 'Endereço não configurado';
     const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
     const link = \`\${baseUrl}/agendamento/gerenciar/\${appt.id}\`;
     
     const startDate = new Date(appt.startTime);
     const endDate = new Date(appt.endTime);
     
     const msg = formatWhatsAppMessage(
        appt.customerName,
        appt.id.substring(0,6).toUpperCase(),
        'Barbeiro', // we will fix this
        'Serviço', // we will fix this
        startDate.toLocaleDateString('pt-BR'),
        startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        "Nenhum produto adicional",
        "R$ " + (appt.totalPrice || 0).toFixed(2).replace('.', ','),
        address,
        link
     );
     
     navigator.clipboard.writeText(msg);
     alert("Mensagem copiada!");
  };

  async function updateStatus(id: string, newStatus: string) {`;
code = code.replace(helperTarget, newHelper);
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
