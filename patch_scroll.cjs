const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const refTarget = "const upsellRef = useRef<HTMLElement>(null);";
const refReplace = "const upsellRef = useRef<HTMLElement>(null);\n  const continueBtnRef = useRef<HTMLButtonElement>(null);";
code = code.replace(refTarget, refReplace);

const handleSelectServiceTarget = `  const handleSelectService = (service: Service) => {
    if (selectedService?.id !== service.id) {
      setSelectedService(service);
      setSelectedProducts([]);
      setTimeout(() => {
        upsellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };`;
const handleSelectServiceReplace = `  const handleSelectService = (service: Service) => {
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
  };`;
code = code.replace(handleSelectServiceTarget, handleSelectServiceReplace);

const onClickTarget = `                              onClick={() => {
                                if (isOutOfStock) return;
                                if (isSelected) {
                                  setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                } else {
                                  setSelectedProducts(prev => [...prev, product.id]);
                                }
                              }}`;
const onClickReplace = `                              onClick={() => {
                                if (isOutOfStock) return;
                                if (isSelected) {
                                  setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                } else {
                                  setSelectedProducts(prev => [...prev, product.id]);
                                }
                                setTimeout(() => {
                                  continueBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 200);
                              }}`;
code = code.replace(onClickTarget, onClickReplace);

const btnTarget = `                    <button
                      onClick={() => setStep(3)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 w-full sm:w-auto"
                    >
                      Continuar para os horários
                    </button>`;
const btnReplace = `                    <button
                      ref={continueBtnRef}
                      onClick={() => setStep(3)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 w-full sm:w-auto"
                    >
                      Continuar para os horários
                    </button>`;
code = code.replace(btnTarget, btnReplace);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
