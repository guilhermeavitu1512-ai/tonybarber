const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

// 1. Add upsellRef and handleSelectService
const stateStr = `  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);`;

const newStateStr = `  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const upsellRef = useRef<HTMLDivElement>(null);

  const handleSelectService = (service: Service) => {
    if (selectedService?.id !== service.id) {
      setSelectedService(service);
      setSelectedProducts([]);
      
      // Allow react to render the section then scroll
      setTimeout(() => {
        upsellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };`;
code = code.replace(stateStr, newStateStr);

if (!code.includes('useRef')) {
  code = code.replace(/useState(,| )/g, 'useState, useRef$1');
}

// 2. Replace onClick in the button card:
code = code.replace(/onClick=\{\(\) => setSelectedService\(service\)\}/g, 'onClick={() => handleSelectService(service)}');

// 3. Replace inner button onClick
const innerBtnOld = `onClick={(event) => {
                              event.stopPropagation();
                              setSelectedService(service);
                              setSelectedProducts([]); // Reset products when changing service
                            }}`;
const innerBtnNew = `onClick={(event) => {
                              event.stopPropagation();
                              handleSelectService(service);
                            }}`;
code = code.replace(innerBtnOld, innerBtnNew);

// 4. Add ref to the AnimatePresence div
const divOld = `                <motion.div 
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}`;
const divNew = `                <motion.div 
                  ref={upsellRef}
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}`;
code = code.replace(divOld, divNew);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
