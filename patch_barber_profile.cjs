const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BarberProfile.tsx', 'utf8');

const stateStr = `  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);`;
const newStateStr = `  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);`;

code = code.replace(stateStr, newStateStr);

const fetchStr = `           const bServices = servicesSnap.docs
             .map(d => ({ id: d.id, ...d.data() } as Service))
             .filter(s => s.barberIds.includes(b.id) && s.isActive);
           setServices(bServices);`;
const newFetchStr = `           const bServices = servicesSnap.docs
             .map(d => ({ id: d.id, ...d.data() } as Service))
             .filter(s => s.barberIds.includes(b.id) && s.isActive);
           setServices(bServices);
           
           const portSnap = await getDocs(query(collection(db, 'barber_portfolio_items'), where('barberId', '==', b.id), where('isActive', '==', true)));
           const portItems = portSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.displayOrder - b.displayOrder);
           setPortfolio(portItems);`;

code = code.replace(fetchStr, newFetchStr);

const galleryStr = `                 <h2 className="text-2xl font-bold mb-6">Galeria de Cortes</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800" alt="Corte" className="w-full aspect-square object-cover rounded-xl border border-neutral-800" />
                    <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800" alt="Corte" className="w-full aspect-square object-cover rounded-xl border border-neutral-800" />
                    <img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=800" alt="Corte" className="w-full aspect-square object-cover rounded-xl border border-neutral-800" />
                 </div>`;

const newGalleryStr = `                 <h2 className="text-2xl font-bold mb-6">Galeria de Cortes</h2>
                 {portfolio.length === 0 ? (
                    <p className="text-neutral-500 text-sm">Este barbeiro ainda não adicionou fotos ao portfólio.</p>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {portfolio.map(p => (
                         <img key={p.id} src={p.publicUrl} alt={p.caption || 'Corte'} className="w-full aspect-[4/5] object-cover rounded-xl border border-neutral-800 shadow-sm" />
                      ))}
                   </div>
                 )}`;

code = code.replace(galleryStr, newGalleryStr);

const bioStr = `Especialista em cortes clássicos e visagismo. Com mais de 5 anos de experiência, busco sempre o corte perfeito que combina com a personalidade e o formato de rosto de cada cliente.`;
const newBioStr = `{(barber as any).bio || "Especialista em cortes clássicos e visagismo. Busco sempre o corte perfeito que combina com a personalidade de cada cliente."}`;

code = code.replace(bioStr, newBioStr);

fs.writeFileSync('src/pages/public/BarberProfile.tsx', code);
