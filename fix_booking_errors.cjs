const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const stateTarget = `const [recommendations, setRecommendations] = useState<any[]>([]);
  const location = useLocation();`;
const newState = `const [recommendations, setRecommendations] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const location = useLocation();`;
code = code.replace(stateTarget, newState);

const fetchTarget = `const recsSnap = await getDocs(collection(db, 'service_product_recommendations'));`;
const newFetch = `const recsSnap = await getDocs(collection(db, 'service_product_recommendations'));
        const locSnap = await getDocs(collection(db, 'settings'));
        const locDoc = locSnap.docs.find(d => d.id === 'location');
        if (locDoc) setLocationData(locDoc.data());`;
code = code.replace(fetchTarget, newFetch);

// Cast import.meta.env
code = code.replace(/import\.meta\.env/g, '(import.meta as any).env');

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
