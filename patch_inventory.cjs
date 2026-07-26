const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminInventory.tsx', 'utf8');

// We need to add handleAddProduct and a modal for it.
// Right now we have an isModalOpen for inventory transactions.
// Let's add a separate state for new product modal.

const stateStr = `  const [movements, setMovements] = useState<InventoryMovement[]>([]);`;
const newStateStr = `  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = parseFloat(newProductPrice);
      const stock = parseInt(newProductStock);
      
      const p = {
        name: newProductName,
        sku: 'SKU-' + Math.floor(Math.random()*10000),
        price,
        stockPhysical: stock,
        stockReserved: 0,
        stockAvailable: stock,
        stockMinimum: 3,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'products'), p);
      
      await addDoc(collection(db, 'inventory_movements'), {
        productId: docRef.id,
        movementType: 'entry',
        quantity: stock,
        stockBefore: 0,
        stockAfter: stock,
        reservedBefore: 0,
        reservedAfter: 0,
        reason: 'Estoque inicial (cadastro de produto)',
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      });
      
      setIsNewProductModalOpen(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('10');
      alert('Produto criado com sucesso!');
    } catch(err) {
      console.error(err);
      alert('Erro ao criar produto.');
    }
  };`;
code = code.replace(stateStr, newStateStr);

const headerStr = `<h1 className="text-3xl font-bold flex items-center gap-3"><Package className="text-orange-500" /> Controle de Estoque</h1>
      </div>`;
const newHeaderStr = `<h1 className="text-3xl font-bold flex items-center gap-3"><Package className="text-orange-500" /> Controle de Estoque</h1>
        <button onClick={() => setIsNewProductModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Novo Produto
        </button>
      </div>`;
code = code.replace(headerStr, newHeaderStr);

const modalStr = `      {isModalOpen && selectedProduct && (`;
const newModalStr = `      {isNewProductModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Novo Produto</h2>
                <button onClick={() => setIsNewProductModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-6 h-6"/></button>
             </div>
             <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Nome do Produto</label>
                  <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" required value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Estoque Inicial</label>
                    <input type="number" required value={newProductStock} onChange={e => setNewProductStock(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors mt-6">
                   Criar Produto
                </button>
             </form>
          </div>
        </div>
      )}

      {isModalOpen && selectedProduct && (`
code = code.replace(modalStr, newModalStr);

fs.writeFileSync('src/pages/admin/AdminInventory.tsx', code);
