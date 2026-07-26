const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const anchor = `export function BookingFlow() {`;
const toInsert = `
  const upsellRef = useRef<HTMLDivElement>(null);
  const handleSelectService = (service: Service) => {
    if (selectedService?.id !== service.id) {
      setSelectedService(service);
      setSelectedProducts([]);
      setTimeout(() => {
        upsellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };
`;
code = code.replace(anchor, anchor + toInsert);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
