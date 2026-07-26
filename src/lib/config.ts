export const BARBERSHOP_LOCATION = {
  name: "Barbearia Tony",
  street: "Rua José Lúcio",
  number: "135",
  reference: "Dona Lica",
  city: "Santa Cruz do Capibaribe",
  state: "Pernambuco",
  stateCode: "PE",
  postalCode: "55192-645",
  country: "Brasil",
  whatsapp: "5581999999999", 
  phone: "(81) 99999-9999", 
  hours: "Terça a Sábado: 09:00 às 20:00",
};

export function generateNotificationText(appointmentDetails: string) {
  return `${appointmentDetails}

Local do atendimento:
${BARBERSHOP_LOCATION.name}
${BARBERSHOP_LOCATION.street}, nº ${BARBERSHOP_LOCATION.number} — ${BARBERSHOP_LOCATION.reference}
${BARBERSHOP_LOCATION.city} — ${BARBERSHOP_LOCATION.stateCode}
CEP ${BARBERSHOP_LOCATION.postalCode}`;
}
