const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const anchorStart = `  useEffect(() => {
    loadProducts(); // Call loadProducts to fetch products specifically with loading state
    async function loadInitialData() {`;
const anchorEnd = `    loadInitialData();
  }, [location.search, user]);`;

const startIndex = code.indexOf(anchorStart);
const endIndex = code.indexOf(anchorEnd, startIndex) + anchorEnd.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find useEffect");
  process.exit(1);
}

const replacement = `  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setLoadingProducts(true);
        setProductsError(false);

        const [
          servicesSnap,
          barbersSnap,
          recsSnap,
          locSnap,
          productsSnap
        ] = await Promise.all([
          getDocs(query(collection(db, 'services'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'barbers'), where('isActive', '==', true))),
          getDocs(collection(db, 'service_product_recommendations')),
          getDocs(collection(db, 'settings')),
          getDocs(collection(db, 'products'))
        ]);

        const locDoc = locSnap.docs.find(d => d.id === 'location');
        if (locDoc) setLocationData(locDoc.data());
        
        const loadedServices = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service));
        const loadedBarbers = barbersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber));
        
        setServices(loadedServices);
        setBarbers(loadedBarbers);
        setRecommendations(recsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const allProds = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setDbProducts(allProds);
        setProducts(allProds.filter(p => p.isActive));

        // Handle repeat query param
        const params = new URLSearchParams(location.search);
        const repeatVal = params.get('repeat');
        
        if (repeatVal) {
          if (user) {
            const profileSnap = await getDocs(query(collection(db, 'client_profiles'), where('authUserId', '==', user.uid)));
            if (!profileSnap.empty) {
              const profile = profileSnap.docs[0].data();
              if (profile.preferredBarberId) setSelectedBarberId(profile.preferredBarberId);
              if (profile.preferredServiceId) setSelectedService(loadedServices.find(s => s.id === profile.preferredServiceId) || null);
            }
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setProductsError(true);
      } finally {
        setLoading(false);
        setLoadingProducts(false);
      }
    }
    loadInitialData();
  }, [location.search, user]);`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
console.log("Unified fetch patched!");
