const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const startStr = `              <AnimatePresence>
              {selectedService && (`;
const endStr = `              )}
              </AnimatePresence>`;

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find upsell section");
  process.exit(1);
}

const replacement = `              {selectedService && (
                <section aria-labelledby="upsell-title" className="mt-8 bg-neutral-900/50 rounded-2xl border border-neutral-800 p-6">
                  <div className="mb-4">
                    {repeatApptId && selectedProducts.length > 0 && (
                      <div className="mb-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 p-4 rounded-xl text-sm">
                        Incluímos os produtos do seu último atendimento. Você pode remover ou adicionar itens antes de continuar.
                      </div>
                    )}
                    <h3 id="upsell-title" className="text-xl font-bold text-white">Complete seu cuidado em casa</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Recomendado com base no seu serviço e nas suas escolhas anteriores. A compra é opcional e o pagamento é realizado presencialmente.
                    </p>
                  </div>

                  {loadingProducts ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-neutral-800 rounded-xl w-full"></div>
                      ))}
                    </div>
                  ) : productsError ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                      <p className="text-red-500 text-sm font-bold mb-1">Não foi possível carregar os produtos adicionais.</p>
                      <button type="button" onClick={loadProducts} className="px-4 py-2 mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm transition-colors">
                        Tentar novamente
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).length === 0 ? (
                        <p className="text-neutral-500 py-4">Nenhum produto adicional está disponível no momento.</p>
                      ) : (
                        getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product) => {
                          const isSelected = selectedProducts.includes(product.id);
                          const isOutOfStock = product.stockAvailable <= 0 && product.trackStock !== false;
                          
                          return (
                            <div
                              key={product.id}
                              onClick={() => {
                                if (isOutOfStock) return;
                                if (isSelected) {
                                  setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                } else {
                                  setSelectedProducts(prev => [...prev, product.id]);
                                }
                              }}
                              className={\`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group \${isOutOfStock ? 'opacity-50 cursor-not-allowed border-neutral-800 bg-neutral-900/20' : isSelected ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10 scale-[1.02] cursor-pointer' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50 hover:scale-[1.01] cursor-pointer'}\`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className={\`w-5 h-5 rounded border flex items-center justify-center transition-colors \${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-neutral-600 group-hover:border-orange-500'}\`}>
                                    {isSelected && <CheckCircle className="w-3 h-3" />}
                                  </div>
                                  <h4 className={\`font-bold transition-colors \${isSelected ? 'text-orange-500' : 'group-hover:text-orange-500'}\`}>{product.name}</h4>
                                </div>
                                {product.label && (
                                  <div className="mt-2 ml-7">
                                    <span className="inline-block bg-orange-500/20 text-orange-500 text-xs font-semibold px-2 py-1 rounded-md">
                                      {product.label}
                                    </span>
                                  </div>
                                )}
                                {product.description && product.description !== '—' && (
                                  <p className="text-sm text-neutral-500 line-clamp-2 mt-2 ml-7">{product.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4 flex flex-col items-end shrink-0 gap-1">
                                <div className="font-bold text-lg">
                                  R$ {Number(product.price).toFixed(2)}
                                </div>
                                {isOutOfStock && <span className="text-xs text-red-500 font-medium">Indisponível</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </section>
              )}`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
console.log("Upsell patched!");
