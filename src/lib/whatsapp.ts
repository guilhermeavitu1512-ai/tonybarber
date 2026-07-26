export function normalizePhoneForWhatsApp(phone: string): string | null {
   if (!phone) return null;
   const digits = phone.replace(/\\D/g, '');
   if (digits.length === 0) return null;
   
   if (digits.length >= 10 && digits.length <= 11) {
      return '55' + digits;
   }
   
   // If it already has country code (e.g. 5581999999999)
   if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
      return digits;
   }
   
   // Other valid international format maybe, just return digits if > 11?
   // Let's assume it's valid if length > 8
   if (digits.length >= 8) return digits;
   
   return null;
}

export function formatWhatsAppMessage(
   customerName: string,
   appointmentCode: string,
   barberName: string,
   serviceName: string,
   dateStr: string,
   startTimeStr: string,
   endTimeStr: string,
   productsText: string,
   totalPriceFormatted: string,
   address: string,
   appointmentLink: string
): string {
   return `Olá, *${customerName}*! Seu horário na Barbearia Tony está confirmado. ✅

Código: ${appointmentCode}

Profissional: ${barberName}
Serviço: ${serviceName}
Data: ${dateStr}
Horário: ${startTimeStr} às ${endTimeStr}

Produtos adicionais:
${productsText}

Total: ${totalPriceFormatted}
Pagamento presencial ao final do atendimento.

Local:
${address}

Consulte, remarque ou cancele seu horário:
${appointmentLink}

Esperamos por você!`;
}
