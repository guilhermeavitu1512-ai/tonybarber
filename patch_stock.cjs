const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const mapStr = `                    {getSmartUpsellProducts(dbProducts, recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          key={product.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            } else {
                              setSelectedProducts(prev => [...prev, product.id]);
                            }
                          }}
                          className={\`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group \${isSelected ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10 scale-[1.02]' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50 hover:scale-[1.01]'}\`}
                        >`;

const newMapStr = `                    {getSmartUpsellProducts(dbProducts.filter(p => p.isActive), recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {
                      const isSelected = selectedProducts.includes(product.id);
                      const isOutOfStock = product.stockAvailable <= 0;
                      return (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          key={product.id}
                          disabled={isOutOfStock}
                          onClick={() => {
                            if (isOutOfStock) return;
                            if (isSelected) {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            } else {
                              setSelectedProducts(prev => [...prev, product.id]);
                            }
                          }}
                          className={\`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group \${isOutOfStock ? 'opacity-50 cursor-not-allowed border-neutral-800 bg-neutral-900/20' : isSelected ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10 scale-[1.02]' : 'border-neutral-800 hover:border-orange-500 bg-neutral-900/50 hover:scale-[1.01]'}\`}
                        >`;

code = code.replace(mapStr, newMapStr);

const priceStr = `                          </div>
                          <div className="text-right ml-4 shrink-0 font-bold text-lg">
                            R$ {product.price.toFixed(2)}
                          </div>
                        </motion.button>`;

const newPriceStr = `                          </div>
                          <div className="text-right ml-4 flex flex-col items-end shrink-0 gap-1">
                            <div className="font-bold text-lg">
                              R$ {product.price.toFixed(2)}
                            </div>
                            {isOutOfStock && <span className="text-xs text-red-500 font-medium">Indisponível</span>}
                          </div>
                        </motion.button>`;

code = code.replace(priceStr, newPriceStr);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
