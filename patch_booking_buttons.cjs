const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const oldProductRender = `                    {getSmartUpsellProducts(dbProducts, recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <div key={product.id} className={\`p-4 rounded-xl border \${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-800 bg-neutral-900'} cursor-pointer transition-colors\`} onClick={() => toggleProduct(product.id)}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold">{product.name}</h4>
                            <span className="text-orange-500 font-bold">+ R$ {product.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-neutral-400">{product.description}</p>
                          {(product as any).smartLabel && (
                            <div className="mt-2 text-xs text-orange-400 font-medium px-2 py-1 bg-orange-500/10 rounded-full inline-block">
                              {(product as any).smartLabel}
                            </div>
                          )}
                        </div>
                      );
                    })}`;

const newProductRender = `                    {getSmartUpsellProducts(dbProducts, recommendations, selectedService?.id || '', [], [], []).map((product, idx) => {
                      const isSelected = selectedProducts.includes(product.id);
                      const isAvailable = (product as any).stockAvailable > 0;
                      return (
                        <div key={product.id} className={\`p-4 rounded-xl border \${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-800 bg-neutral-900'} \${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-colors\`} onClick={() => isAvailable && toggleProduct(product.id)}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold flex items-center gap-2">
                              {product.name}
                              {!isAvailable && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">Indisponível</span>}
                            </h4>
                            <span className="text-orange-500 font-bold">+ R$ {product.price.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-neutral-400">{product.description}</p>
                          {(product as any).smartLabel && (
                            <div className="mt-2 text-xs text-orange-400 font-medium px-2 py-1 bg-orange-500/10 rounded-full inline-block">
                              {(product as any).smartLabel}
                            </div>
                          )}
                        </div>
                      );
                    })}`;

code = code.replace(oldProductRender, newProductRender);

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
