import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, InventoryMovement } from '../../types';
import { Loader2, Plus, AlertCircle, Package, Minus, History, X } from 'lucide-react';

export function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'remove' | 'correct' | 'history'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  
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
  };

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (type: 'add' | 'remove' | 'correct' | 'history', product: Product) => {
    setSelectedProduct(product);
    setModalType(type);
    setAmount('');
    setReason('');
    setIsModalOpen(true);
    
    if (type === 'history') {
       loadHistory(product.id);
    }
  };

  const loadHistory = async (productId: string) => {
    try {
      const snap = await getDocs(query(collection(db, 'inventory_movements')));
      const movs = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryMovement)).filter(m => m.productId === productId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMovements(movs);
    } catch (e) { console.error(e); }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseInt(amount);
    if (isNaN(qty) || (modalType !== 'correct' && qty <= 0)) {
       alert("Quantidade inválida");
       return;
    }

    let newPhysical = selectedProduct.stockPhysical;
    let mType: any = 'adjustment';
    
    if (modalType === 'add') {
      newPhysical += qty;
      mType = 'entry';
    } else if (modalType === 'remove') {
      if (qty > selectedProduct.stockAvailable) {
         alert("Não há unidades suficientes disponíveis para esta saída.");
         return;
      }
      newPhysical -= qty;
      mType = 'loss'; // or manual_exit
    } else if (modalType === 'correct') {
      newPhysical = qty;
      if (newPhysical < 0) {
        alert("Estoque não pode ser negativo");
        return;
      }
    }

    const newAvailable = newPhysical - (selectedProduct.stockReserved || 0);

    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        stockPhysical: newPhysical,
        stockAvailable: newAvailable
      });
      await addDoc(collection(db, 'inventory_movements'), {
        productId: selectedProduct.id,
        movementType: mType,
        quantity: Math.abs(newPhysical - selectedProduct.stockPhysical),
        stockBefore: selectedProduct.stockAvailable,
        stockAfter: newAvailable,
        reservedBefore: selectedProduct.stockReserved,
        reservedAfter: selectedProduct.stockReserved,
        reason: reason || `${mType} manual`,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      alert("Estoque atualizado com sucesso.");
    } catch(err) {
      console.error(err);
      alert("Erro ao atualizar estoque.");
    }
  };

  const toggleActive = async (prod: Product) => {
    await updateDoc(doc(db, 'products', prod.id), { isActive: !prod.isActive });
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Package className="text-orange-500" /> Controle de Estoque</h1>
        <button onClick={() => setIsNewProductModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map(prod => (
          <div key={prod.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${!prod.isActive ? 'opacity-50' : ''}`}>
             <div>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  {prod.name}
                   {prod.stockAvailable <= prod.stockMinimum && prod.isActive && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Estoque baixo</span>}
                   {!prod.isActive && <span className="text-xs bg-neutral-500/20 text-neutral-400 px-2 py-1 rounded-full">Inativo</span>}
                </h3>
                <p className="text-neutral-400 text-sm">SKU: {prod.sku} • R$ {prod.price.toFixed(2)}</p>
             </div>
             
             <div className="flex gap-8 text-center bg-[#0A0A0A] p-4 rounded-xl border border-neutral-800">
                <div>
                   <div className="text-2xl font-bold text-white">{prod.stockPhysical}</div>
                   <div className="text-xs text-neutral-500">Físico</div>
                </div>
                <div>
                   <div className="text-2xl font-bold text-yellow-500">{prod.stockReserved || 0}</div>
                   <div className="text-xs text-neutral-500">Reservado</div>
                </div>
                <div>
                   <div className={`text-2xl font-bold ${prod.stockAvailable <= prod.stockMinimum ? 'text-red-500' : 'text-green-500'}`}>{prod.stockAvailable}</div>
                   <div className="text-xs text-neutral-500">Disponível</div>
                </div>
             </div>

             <div className="flex gap-2 flex-wrap">
                <button onClick={() => openModal('add', prod)} className="px-3 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm transition-colors flex items-center gap-1">
                   <Plus className="w-4 h-4"/> Entrada
                </button>
                <button onClick={() => openModal('remove', prod)} className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm transition-colors flex items-center gap-1">
                   <Minus className="w-4 h-4"/> Saída
                </button>
                <button onClick={() => openModal('correct', prod)} className="px-3 py-2 bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg text-sm transition-colors">
                   Corrigir
                </button>
                <button onClick={() => openModal('history', prod)} className="px-3 py-2 bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg text-sm transition-colors flex items-center gap-1">
                   <History className="w-4 h-4"/> Histórico
                </button>
                <button onClick={() => toggleActive(prod)} className="px-3 py-2 bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg text-sm transition-colors">
                   {prod.isActive ? 'Desativar' : 'Ativar'}
                </button>
             </div>
          </div>
        ))}
      </div>

      {isNewProductModalOpen && (
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

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                   {modalType === 'add' && 'Adicionar Estoque'}
                   {modalType === 'remove' && 'Remover Estoque'}
                   {modalType === 'correct' && 'Corrigir Estoque'}
                   {modalType === 'history' && 'Histórico de Movimentações'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-6 h-6"/></button>
             </div>

             {modalType !== 'history' ? (
                <form onSubmit={handleTransaction} className="space-y-4">
                   <div className="mb-4 text-sm text-neutral-400">Produto: <strong className="text-white">{selectedProduct.name}</strong></div>
                   
                   <div>
                     <label className="block text-sm text-neutral-400 mb-1">
                        {modalType === 'correct' ? 'Nova Quantidade Física Total' : 'Quantidade'}
                     </label>
                     <input type="number" required min={modalType === 'correct' ? 0 : 1} value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
                   </div>
                   
                   <div>
                     <label className="block text-sm text-neutral-400 mb-1">Motivo / Observação</label>
                     <input type="text" required value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" placeholder="Ex: Compra, Perda, Ajuste manual..." />
                   </div>

                   <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
                      Confirmar
                   </button>
                </form>
             ) : (
                <div className="space-y-4">
                   {movements.length === 0 ? (
                      <p className="text-neutral-400 text-center py-4">Nenhuma movimentação registrada.</p>
                   ) : (
                      movements.map(m => (
                         <div key={m.id} className="bg-[#0A0A0A] p-4 rounded-xl border border-neutral-800 text-sm">
                            <div className="flex justify-between items-start mb-2">
                               <span className="font-bold text-orange-500">{m.movementType}</span>
                               <span className="text-neutral-500">{new Date(m.createdAt).toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="text-white mb-1">Quantidade: {m.quantity}</div>
                            <div className="text-neutral-400 text-xs">
                               Disp. Antes: {m.stockBefore} | Disp. Depois: {m.stockAfter}
                            </div>
                            <div className="text-neutral-400 text-xs mt-1">Motivo: {m.reason}</div>
                            {m.appointmentId && <div className="text-blue-400 text-xs mt-1">Agendamento: {m.appointmentId}</div>}
                         </div>
                      ))
                   )}
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
