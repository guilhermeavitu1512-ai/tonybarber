const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

// We need to add an 'Adicionar' button inside the service card.
const serviceCardStr = `                        <div className="text-right ml-4 shrink-0">
                          <div className="font-bold text-lg">R$ {price.toFixed(2)}</div>
                          <div className="text-sm text-neutral-500">{durationMinutes} min</div>
                        </div>
                      </button>
                    )})}
                </div>`;

const newServiceCardStr = `                        <div className="text-right ml-4 flex flex-col items-end shrink-0 gap-2">
                          <div>
                            <div className="font-bold text-lg">R$ {price.toFixed(2)}</div>
                            <div className="text-sm text-neutral-500">{durationMinutes} min</div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedService(service);
                              setSelectedProducts([]); // Reset products when changing service
                            }}
                            className={\`px-4 py-1.5 rounded-full text-sm font-medium transition-colors \${isSelected ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-orange-500 hover:bg-neutral-700'}\`}
                          >
                            {isSelected ? 'Selecionado' : 'Adicionar'}
                          </button>
                        </div>
                      </button>
                    )})}
                </div>`;

code = code.replace(serviceCardStr, newServiceCardStr);

// Also the user mentioned:
// "Se houver erro: Não foi possível carregar os produtos adicionais."
// "Enquanto os produtos forem carregados, mostrar skeleton dentro da seção."
// We don't have productsLoading right now, they load on mount.
// We can just add a check: if products.length === 0 and loading is true.

fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
