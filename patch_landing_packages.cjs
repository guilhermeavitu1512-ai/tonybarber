const fs = require('fs');
let code = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');

const stateStr = `  const [location, setLocation] = useState(BARBERSHOP_LOCATION);
  const { user } = useAuth();`;
const newStateStr = `  const [location, setLocation] = useState(BARBERSHOP_LOCATION);
  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);
  const { user } = useAuth();`;

code = code.replace(stateStr, newStateStr);

const fetchStr = `    async function loadLocation() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'location'));
        if (snap.exists()) {
          setLocation(snap.data() as typeof BARBERSHOP_LOCATION);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadLocation();`;
const newFetchStr = `    async function loadData() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'location'));
        if (snap.exists()) {
          setLocation(snap.data() as typeof BARBERSHOP_LOCATION);
        }
        
        // Load featured packages
        const pkgSnap = await getDocs(query(collection(db, 'service_packages'), where('isActive', '==', true), where('isFeatured', '==', true)));
        setFeaturedPackages(pkgSnap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch (err) {
        console.error(err);
      }
    }
    loadData();`;

code = code.replace(fetchStr, newFetchStr);

const meuEstiloSection = `      {/* Meu Estilo Promo */}`;

const packagesSection = `      {/* Featured Packages */}
      {featuredPackages.length > 0 && (
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Nossos <span className="text-orange-500">Pacotes</span></h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Garanta seu visual sempre em dia com nossos pacotes promocionais.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPackages.map(pkg => (
              <div key={pkg.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all group">
                 <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
                 <p className="text-neutral-400 mb-6 h-12">{pkg.description}</p>
                 <div className="text-4xl font-bold text-orange-500 mb-6">R$ {pkg.price.toFixed(2)}</div>
                 <div className="text-sm text-neutral-500 mb-8 border-t border-neutral-800 pt-4">
                    Validade de {pkg.validityDays} dias
                 </div>
                 <Link to="/agendar" className="block w-full bg-neutral-800 group-hover:bg-orange-500 group-hover:text-white text-center text-white py-3 rounded-xl font-bold transition-colors">
                    Adquirir Pacote
                 </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Meu Estilo Promo */}`;

code = code.replace(meuEstiloSection, packagesSection);

fs.writeFileSync('src/pages/public/LandingPage.tsx', code);
