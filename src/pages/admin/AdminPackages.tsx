import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, query, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServicePackage, Service, Product } from '../../types';
import { Loader2, Plus, Gift, Edit2, Trash2, X } from 'lucide-react';

export function AdminPackages() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [validityDays, setValidityDays] = useState('90');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [servicesIncluded, setServicesIncluded] = useState<{serviceId: string, quantity: number}[]>([]);

  useEffect(() => {
    const pQ = query(collection(db, 'service_packages'));
    const unsubP = onSnapshot(pQ, snap => setPackages(snap.docs.map(d => ({id: d.id, ...d.data()} as ServicePackage))));
    
    getDocs(collection(db, 'services')).then(snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()} as Service))));
    getDocs(collection(db, 'products')).then(snap => setProducts(snap.docs.map(d => ({id: d.id, ...d.data()} as Product))));
    
    setLoading(false);
    return () => unsubP();
  }, []);

  const openModal = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setName(pkg.name);
      setDescription(pkg.description);
      setPrice(pkg.price.toString());
      setValidityDays(pkg.validityDays.toString());
      setIsActive(pkg.isActive);
      setIsFeatured(pkg.isFeatured);
      setServicesIncluded(pkg.servicesIncluded || []);
    } else {
      setEditingPackage(null);
      setName('');
      setDescription('');
      setPrice('');
      setValidityDays('90');
      setIsActive(true);
      setIsFeatured(false);
      setServicesIncluded([]);
    }
    setIsModalOpen(true);
  };

  const addServiceIncluded = () => {
    if (services.length > 0) {
      setServicesIncluded([...servicesIncluded, { serviceId: services[0].id, quantity: 1 }]);
    }
  };

  const updateServiceIncluded = (index: number, field: string, value: any) => {
    const newArr = [...servicesIncluded];
    (newArr[index] as any)[field] = value;
    setServicesIncluded(newArr);
  };

  const removeServiceIncluded = (index: number) => {
    const newArr = [...servicesIncluded];
    newArr.splice(index, 1);
    setServicesIncluded(newArr);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (servicesIncluded.length === 0) {
      alert("Adicione pelo menos um serviço ou produto ao pacote.");
      return;
    }

    const pkgData = {
      name,
      description,
      price: parseFloat(price),
      validityDays: parseInt(validityDays),
      isActive,
      isFeatured,
      servicesIncluded,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingPackage) {
        await updateDoc(doc(db, 'service_packages', editingPackage.id), pkgData);
        alert("Pacote atualizado com sucesso.");
      } else {
        await addDoc(collection(db, 'service_packages'), {
          ...pkgData,
          createdAt: new Date().toISOString()
        });
        alert("Pacote criado com sucesso.");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Não foi possível salvar o pacote. Erro: " + (err.message || String(err)));
    }
  };

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Desconhecido';

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Gift className="text-orange-500" /> Pacotes de Serviços</h1>
        <button onClick={() => openModal()} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> Novo Pacote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative ${!pkg.isActive ? 'opacity-60' : ''}`}>
             <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{pkg.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${pkg.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {pkg.isActive ? 'Ativo' : 'Inativo'}
                </span>
             </div>
             <p className="text-neutral-400 text-sm mb-4 h-10">{pkg.description}</p>
             <div className="text-2xl font-bold mb-4 text-orange-500">R$ {pkg.price.toFixed(2)}</div>
             
             <div className="bg-[#0A0A0A] p-4 rounded-xl border border-neutral-800 mb-4 h-32 overflow-y-auto">
               <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-bold">Itens Inclusos</h4>
               <ul className="space-y-2">
                 {pkg.servicesIncluded.map((si, i) => (
                   <li key={i} className="text-sm flex justify-between text-neutral-300">
                     <span>{getServiceName(si.serviceId)}</span>
                     <span className="font-bold">x{si.quantity}</span>
                   </li>
                 ))}
               </ul>
             </div>
             
             <div className="text-sm text-neutral-500 flex justify-between items-center mt-4 border-t border-neutral-800 pt-4">
               <span>Validade: {pkg.validityDays} dias</span>
               <button onClick={() => openModal(pkg)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors">
                 <Edit2 className="w-4 h-4" />
               </button>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingPackage ? 'Editar Pacote' : 'Novo Pacote'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-6 h-6"/></button>
             </div>

             <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Nome do Pacote</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" required min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Descrição</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white" rows={2}></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">Validade (dias)</label>
                    <input type="number" required min="1" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white" />
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded bg-[#0A0A0A] border-neutral-800 text-orange-500 focus:ring-orange-500" />
                      Ativo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded bg-[#0A0A0A] border-neutral-800 text-orange-500 focus:ring-orange-500" />
                      Destaque na Landing Page
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Serviços / Produtos Inclusos</h3>
                    <button type="button" onClick={addServiceIncluded} className="text-sm bg-neutral-800 hover:bg-neutral-700 px-3 py-1 rounded-lg text-white">
                      + Adicionar Item
                    </button>
                  </div>
                  
                  {servicesIncluded.length === 0 ? (
                    <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      O pacote precisa de pelo menos um item.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {servicesIncluded.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-[#0A0A0A] p-3 rounded-lg border border-neutral-800">
                          <select 
                            value={item.serviceId} 
                            onChange={e => updateServiceIncluded(idx, 'serviceId', e.target.value)}
                            className="flex-1 bg-transparent text-white text-sm outline-none"
                          >
                            <optgroup label="Serviços">
                              {services.map(s => <option key={s.id} value={s.id} className="bg-neutral-900">{s.name}</option>)}
                            </optgroup>
                          </select>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-neutral-500">Qtd:</label>
                            <input 
                              type="number" 
                              min="1" 
                              value={item.quantity} 
                              onChange={e => updateServiceIncluded(idx, 'quantity', parseInt(e.target.value))}
                              className="w-16 bg-neutral-900 border border-neutral-800 rounded p-1 text-center text-sm" 
                            />
                          </div>
                          <button type="button" onClick={() => removeServiceIncluded(idx)} className="text-red-500 hover:bg-red-500/20 p-1 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
                   Salvar Pacote
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
