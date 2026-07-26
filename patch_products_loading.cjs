const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const stateStr = `  const [dbProducts, setDbProducts] = useState<any[]>([]);`;
const newStateStr = `  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);`;
code = code.replace(stateStr, newStateStr);

const fetchStr = `    const fetchInitialData = async () => {
      try {
        const [servicesSnap, barbersSnap, settingsSnap, productsSnap, recommendationsSnap] = await Promise.all([
          getDocs(query(collection(db, 'services'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'barbers'), where('isActive', '==', true))),
          getDocs(collection(db, 'settings')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'product_recommendations'))
        ]);`;
const newFetchStr = `    const fetchInitialData = async () => {
      try {
        setLoadingProducts(true);
        const [servicesSnap, barbersSnap, settingsSnap, productsSnap, recommendationsSnap] = await Promise.all([
          getDocs(query(collection(db, 'services'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'barbers'), where('isActive', '==', true))),
          getDocs(collection(db, 'settings')),
          getDocs(collection(db, 'products')).catch(() => { setProductsError(true); return { docs: [] } as any }),
          getDocs(collection(db, 'product_recommendations')).catch(() => { return { docs: [] } as any })
        ]);`;
code = code.replace(fetchStr, newFetchStr);

const setStr = `        setDbProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRecommendations(recommendationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductRecommendation)));
      } catch (err) {
        console.error("Error fetching initial data", err);
      }
    };`;
const newSetStr = `        setDbProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRecommendations(recommendationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductRecommendation)));
      } catch (err) {
        console.error("Error fetching initial data", err);
        setProductsError(true);
      } finally {
        setLoadingProducts(false);
      }
    };`;
code = code.replace(setStr, newSetStr);

const upsellArea = `                  <div className="mb-4">
                    {repeatApptId && selectedProducts.length > 0 && (
                      <div className="mb-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 p-4 rounded-xl text-sm">
                        Incluímos os produtos do seu último atendimento. Você pode remover ou adicionar itens antes de continuar.
                      </div>
                    )}
                    <h3 className="text-xl font-bold">Complete seu cuidado em casa</h3>
                    <p className="text-sm text-neutral-400 mt-1">Recomendado com base no seu serviço e nas suas escolhas anteriores. A compra é opcional e o pagamento é realizado presencialmente.</p>
                  </div>
                  <div className="space-y-4">
                    {getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {`;
const newUpsellArea = `                  <div className="mb-4">
                    {repeatApptId && selectedProducts.length > 0 && (
                      <div className="mb-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 p-4 rounded-xl text-sm">
                        Incluímos os produtos do seu último atendimento. Você pode remover ou adicionar itens antes de continuar.
                      </div>
                    )}
                    <h3 className="text-xl font-bold">Complete seu cuidado em casa</h3>
                    <p className="text-sm text-neutral-400 mt-1">Recomendado com base no seu serviço e nas suas escolhas anteriores. A compra é opcional e o pagamento é realizado presencialmente.</p>
                  </div>
                  <div className="space-y-4">
                    {loadingProducts ? (
                      <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-24 bg-neutral-800 rounded-xl w-full"></div>
                        ))}
                      </div>
                    ) : productsError ? (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                         <p className="text-red-500 text-sm font-bold mb-1">Não foi possível carregar os produtos adicionais.</p>
                         <p className="text-neutral-400 text-sm mb-4">Você ainda pode continuar com o agendamento normalmente.</p>
                         <button type="button" onClick={fetchInitialData} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm transition-colors">
                           Tentar novamente
                         </button>
                      </div>
                    ) : (
                      getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {`;
code = code.replace(upsellArea, newUpsellArea);

const endUpsell = `                        </motion.button>
                      );
                    })}
                  </div>`;
const newEndUpsell = `                        </motion.button>
                      );
                    })
                    )}
                  </div>`;
code = code.replace(endUpsell, newEndUpsell);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
