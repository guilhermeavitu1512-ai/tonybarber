const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

// Replace UPSOLD_PRODUCTS constant with a state inside BookingFlow
code = code.replace(
  `export const UPSOLD_PRODUCTS = [
  { id: 'p1', name: 'FOX FOR MEN — Anti-caspa', description: 'Shampoo contra caspa, também anti queda e condicionante — deixa o cabelo macio e sem caspa', price: 40.00, isActive: true },
  { id: 'p2', name: 'FOX FOR MEN — Cabelo e Barba', description: 'Shampoo próprio para cabelo e barba, limpeza, maciez e hidratação', price: 35.00, isActive: true },
  { id: 'p3', name: 'Foxidil', description: 'Tônico capilar, ajuda no crescimento dos fios e previne queda; indicado para calvície e preenchimento de falhas na barba', price: 55.00, isActive: true },
  { id: 'p4', name: 'Óleo Reparador', description: 'Óleo reparador para barba e cabelo — elimina pontas duplas, combate o ressecamento', price: 30.00, isActive: true },
  { id: 'p5', name: 'Pomada Modeladora', description: '—', price: 20.00, isActive: true },
];`,
  ''
);

// Add state for dbProducts
const stateStr = `  const [availableSlots, setAvailableSlots] = useState<{ time: string, isAvailable: boolean }[]>([]);`;
code = code.replace(stateStr, `  const [availableSlots, setAvailableSlots] = useState<{ time: string, isAvailable: boolean }[]>([]);\n  const [dbProducts, setDbProducts] = useState<any[]>([]);`);

// Load products
const effectStr = `  useEffect(() => {
    async function loadInitialData() {`;
const newEffectStr = `  useEffect(() => {
    async function loadInitialData() {
      try {
        const prodSnap = await getDocs(query(collection(db, 'products'), where('isActive', '==', true), where('stockAvailable', '>', 0)));
        setDbProducts(prodSnap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) { console.error(e); }`;
code = code.replace(effectStr, newEffectStr);

// Replace UPSOLD_PRODUCTS with dbProducts
code = code.replace(/UPSOLD_PRODUCTS/g, 'dbProducts');

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
