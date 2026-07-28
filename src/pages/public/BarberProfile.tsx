import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Barber, Service } from '../../types';
import { Scissors, Star, MapPin, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import SpecularButton from '../../components/ui/SpecularButton';

export function BarberProfile() {
  const { id } = useParams<{ id: string }>();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const barbersSnap = await getDocs(query(collection(db, 'barbers')));
        // We simulate finding by ID or slug. Since id is likely doc.id right now or name slug.
        // Let's assume id is the doc.id for now.
        const found = barbersSnap.docs.find(d => {
           // Basic slug generation for matching
           const slug = d.data().name.toLowerCase().replace(/\\s+/g, '-');
           return slug === id || d.id === id;
        });

        if (found) {
           const b = { id: found.id, ...found.data() } as Barber;
           setBarber(b);

           // Load services
           const servicesSnap = await getDocs(collection(db, 'services'));
           const bServices = servicesSnap.docs
             .map(d => ({ id: d.id, ...d.data() } as Service))
             .filter(s => s.barberIds.includes(b.id) && s.isActive);
           setServices(bServices);
           
           const portSnap = await getDocs(query(collection(db, 'barber_portfolio_items'), where('barberId', '==', b.id), where('isActive', '==', true)));
           const portItems = portSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.displayOrder - b.displayOrder);
           setPortfolio(portItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (!barber) {
    return <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center">
       <p className="text-xl text-neutral-500">Barbeiro não encontrado.</p>
       <Link to="/" className="mt-4 text-orange-500 hover:underline">Voltar ao início</Link>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      <div className="h-64 md:h-80 w-full bg-neutral-900 relative overflow-hidden">
         <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=2074" alt="Barbershop" className="w-full h-full object-cover opacity-40" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent"></div>
         <div className="absolute top-6 left-6">
            <Link to="/" className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
               <ChevronLeft className="w-6 h-6" />
            </Link>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
         <div className="flex flex-col md:flex-row gap-8 items-start md:items-end mb-12">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0A0A0A] bg-neutral-800 overflow-hidden shrink-0">
               <img src={barber.photoUrl || "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=2070"} alt={barber.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <span className="font-bold text-lg">4.9</span>
                  <span className="text-neutral-500">(128 avaliações)</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-bold mb-2">{barber.name}</h1>
               <p className="text-neutral-400 text-lg">{barber.specialties.join(' • ')}</p>
            </div>
            <div>
               <Link to={`/agendar?barber=${barber.id}`} className="inline-flex">
                 <SpecularButton
                   size="lg"
                   radius={12}
                   tint="#ea580c"
                   tintOpacity={1}
                   textColor="#ffffff"
                   lineColor="#fdba74"
                   baseColor="#9a3412"
                   intensity={2.8}
                   shineSize={28}
                   shineFade={55}
                   followMouse
                   proximity={280}
                 >
                   <span className="flex items-center gap-2">
                     Agendar com {barber.name.split(' ')[0]}
                     <ArrowRight className="w-5 h-5" />
                   </span>
                 </SpecularButton>
               </Link>
            </div>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-12">
               <section>
                 <h2 className="text-2xl font-bold mb-6">Sobre mim</h2>
                 <p className="text-neutral-400 leading-relaxed text-lg">
                   {(barber as any).bio || "Especialista em cortes clássicos e visagismo. Busco sempre o corte perfeito que combina com a personalidade de cada cliente."}
                 </p>
               </section>

               <section>
                 <h2 className="text-2xl font-bold mb-6">Galeria de Cortes</h2>
                 {portfolio.length === 0 ? (
                    <p className="text-neutral-500 text-sm">Este barbeiro ainda não adicionou fotos ao portfólio.</p>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {portfolio.map(p => (
                         <img key={p.id} src={p.publicUrl} alt={p.caption || 'Corte'} className="w-full aspect-[4/5] object-cover rounded-xl border border-neutral-800 shadow-sm" />
                      ))}
                   </div>
                 )}
               </section>

               <section>
                  <h2 className="text-2xl font-bold mb-6">Avaliações</h2>
                  <div className="space-y-6">
                     <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold">M</div>
                              <div>
                                 <div className="font-bold">Marcos S.</div>
                                 <div className="text-xs text-neutral-500">Há 2 semanas</div>
                              </div>
                           </div>
                           <div className="flex">
                              {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-orange-500 fill-orange-500" />)}
                           </div>
                        </div>
                        <p className="text-neutral-400">Excelente profissional. Entendeu exatamente o que eu queria e o corte ficou perfeito. Recomendo muito!</p>
                     </div>
                  </div>
               </section>
            </div>

            <div className="space-y-8">
               <div className="bg-neutral-900/80 border border-neutral-800 p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-orange-500" /> Serviços
                  </h3>
                  <div className="space-y-4">
                     {services.map(s => (
                       <div key={s.id} className="flex justify-between items-center pb-4 border-b border-neutral-800 last:border-0 last:pb-0">
                         <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-sm text-neutral-500">{s.durationMinutes} min</div>
                         </div>
                         <div className="font-bold">R$ {s.price.toFixed(2)}</div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
