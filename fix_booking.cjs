const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const stateTarget = `const [customer, setCustomer] = useState({ name: '', phone: '', email: '', consent_whatsapp_transactional: true });`;
const newState = `const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });`;
code = code.replace(stateTarget, newState);

const payloadTarget = `      let e164 = customer.phone.replace(/\\D/g, '');
      if (e164.length === 10 || e164.length === 11) e164 = '55' + e164;
      if (!e164.startsWith('+')) e164 = '+' + e164;
      
      const appointment: Omit<Appointment, 'id'> = {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerPhone_e164: e164,
        consent_whatsapp_transactional: customer.consent_whatsapp_transactional,`;

const newPayload = `      const appointment: Omit<Appointment, 'id'> = {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        whatsapp_confirmation_status: 'not_sent',`;

code = code.replace(payloadTarget, newPayload);

const fetchTarget = `      // Trigger WhatsApp Notification automatically in the background
      if (customer.consent_whatsapp_transactional) {
         fetch(\`/api/appointments/\${newApptRef.id}/notify\`, { method: 'POST' }).catch(console.error);
      }`;
code = code.replace(fetchTarget, '');

const consentTarget = `                <div className="flex items-start gap-3 mt-4 mb-2">
                   <input 
                      type="checkbox" 
                      id="consent_whatsapp" 
                      checked={customer.consent_whatsapp_transactional}
                      onChange={e => setCustomer({...customer, consent_whatsapp_transactional: e.target.checked})}
                      className="mt-1 w-4 h-4 rounded border-neutral-700 text-orange-500 focus:ring-orange-500 bg-neutral-900"
                   />
                   <label htmlFor="consent_whatsapp" className="text-sm text-neutral-400">
                      Autorizo o envio da confirmação e de atualizações deste agendamento pelo WhatsApp.
                   </label>
                </div>`;
code = code.replace(consentTarget, '');


const successTarget = `{customer.consent_whatsapp_transactional ? (
                <div className="mb-8">
                   <p className="text-neutral-400">Enviamos os detalhes do seu agendamento para o WhatsApp informado.</p>
                   <p className="text-neutral-500 text-sm mt-1 mb-3">Enviado para: {customer.phone.replace(/\\D/g, '').length >= 10 ? '(' + customer.phone.replace(/\\D/g, '').substring(0,2) + ') 9****-' + customer.phone.replace(/\\D/g, '').substring(customer.phone.replace(/\\D/g, '').length - 4) : customer.phone}</p>
                   <button 
                     onClick={() => {
                       if (createdAppointmentId) {
                         fetch(\`/api/appointments/\${createdAppointmentId}/notify\`, { method: 'POST' }).then(() => alert('Mensagem reenviada!')).catch(() => alert('Erro ao reenviar'));
                       }
                     }}
                     className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors"
                   >
                     Reenviar pelo WhatsApp
                   </button>
                </div>
              ) : (
                <p className="text-neutral-400 mb-8">Anote os detalhes ou acesse o link do agendamento para mais informações.</p>
              )}`;

// Adding the WhatsApp buttons to the success screen
const newSuccess = `<div className="mb-8 flex flex-col gap-3">
                 <button 
                   onClick={() => {
                     // Generate client-side confirmation message for Barbearia Tony official number
                     const officialNumber = import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || locationData?.phone?.replace(/\\D/g, '');
                     if (!officialNumber) {
                        alert('Número oficial não configurado.');
                        return;
                     }
                     const msg = \`Olá! Meu nome é \${customer.name}.\\nAcabei de realizar o agendamento \${createdAppointmentId?.substring(0,6).toUpperCase()}.\\nProfissional: \${barbers.find(b => b.id === selectedBarberId)?.name}\\nServiço: \${selectedService?.name}\\nData: \${selectedSlot ? format(selectedSlot, "dd/MM/yyyy", { locale: ptBR }) : ''}\\nHorário: \${selectedSlot ? format(selectedSlot, "HH:mm", { locale: ptBR }) : ''}\\nEstou confirmando meu horário pelo WhatsApp.\`;
                     window.open(\`https://wa.me/\${officialNumber}?text=\${encodeURIComponent(msg)}\`, '_blank');
                   }}
                   className="inline-flex justify-center bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
                 >
                   Confirmar também pelo WhatsApp
                 </button>
                 <button 
                   onClick={() => {
                     const officialNumber = import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || locationData?.phone?.replace(/\\D/g, '');
                     if (!officialNumber) {
                        alert('Número oficial não configurado.');
                        return;
                     }
                     const msg = \`Olá! Acabei de realizar o agendamento \${createdAppointmentId?.substring(0,6).toUpperCase()} e gostaria de falar com a Barbearia Tony.\`;
                     window.open(\`https://wa.me/\${officialNumber}?text=\${encodeURIComponent(msg)}\`, '_blank');
                   }}
                   className="inline-flex justify-center border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-8 py-3 rounded-full font-medium transition-colors"
                 >
                   Falar com a Barbearia Tony
                 </button>
              </div>`;
code = code.replace(successTarget, newSuccess);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
