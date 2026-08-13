import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Barber } from '../../types';
import { Loader2, Plus, Users, Image as ImageIcon, Trash2, Edit2, Star, GripVertical, ChevronDown, ChevronUp , X } from 'lucide-react';

interface PortfolioItem {
  id: string;
  barberId: string;
  storagePath: string;
  publicUrl: string;
  caption: string;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}

export function AdminBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<Record<string, PortfolioItem[]>>({});
  const [loading, setLoading] = useState(true);
  
  const [expandedBarber, setExpandedBarber] = useState<string | null>(null);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [bioText, setBioText] = useState('');
  
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [captionText, setCaptionText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const bSnap = await getDocs(query(collection(db, 'barbers')));
      const bData = bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber));
      setBarbers(bData);
      
      const pSnap = await getDocs(query(collection(db, 'barber_portfolio_items'), orderBy('displayOrder', 'asc')));
      const pItems = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem));
      
      const pMap: Record<string, PortfolioItem[]> = {};
      bData.forEach(b => pMap[b.id] = []);
      pItems.forEach(pi => {
        if (pMap[pi.barberId]) pMap[pi.barberId].push(pi);
      });
      setPortfolioItems(pMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleEditPhoto = async (e: React.ChangeEvent<HTMLInputElement>, barber: Barber) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingState(prev => ({...prev, [barber.id + '_profile']: true}));
    try {
       const storageRef = ref(storage, `barber-profiles/${barber.id}/${Date.now()}_${file.name}`);
       await uploadBytes(storageRef, file);
       const url = await getDownloadURL(storageRef);
       
       await updateDoc(doc(db, 'barbers', barber.id), { photoUrl: url });
       loadData();
    } catch(err: any) {
       console.error(err);
       alert("Erro ao enviar foto de perfil: " + (err.message || String(err)));
    } finally {
       setUploadingState(prev => ({...prev, [barber.id + '_profile']: false}));
    }
  };

  const handleEditBio = (barber: Barber) => {
    setEditingBarber(barber);
    setBioText((barber as any).bio || "");
    setBioModalOpen(true);
  };
  
  const saveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber) return;
    try {
      await updateDoc(doc(db, 'barbers', editingBarber.id), { bio: bioText });
      setBioModalOpen(false);
      loadData();
    } catch(err) {
      console.error(err);
      alert("Erro ao salvar biografia.");
    }
  };
  
  const handleUploadPortfolio = async (e: React.ChangeEvent<HTMLInputElement>, barberId: string) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     setUploadingState(prev => ({...prev, [barberId + '_portfolio']: true}));
     try {
       const path = `barber-portfolios/${barberId}/${Date.now()}_${file.name}`;
       const storageRef = ref(storage, path);
       await uploadBytes(storageRef, file);
       const url = await getDownloadURL(storageRef);
       
       const items = portfolioItems[barberId] || [];
       const order = items.length > 0 ? Math.max(...items.map(i => i.displayOrder)) + 1 : 0;
       
       await addDoc(collection(db, 'barber_portfolio_items'), {
         barberId,
         storagePath: path,
         publicUrl: url,
         caption: '',
         displayOrder: order,
         isFeatured: items.length === 0,
         isActive: true,
         createdAt: new Date().toISOString()
       });
       
       loadData();
     } catch(err) {
       console.error(err);
       alert("Erro ao enviar imagem para portfólio");
     } finally {
       setUploadingState(prev => ({...prev, [barberId + '_portfolio']: false}));
     }
  };

  const handleDeletePortfolio = async (item: PortfolioItem) => {
    if (!confirm("Deseja realmente remover esta imagem do portfólio?")) return;
    try {
      await deleteObject(ref(storage, item.storagePath)).catch(e => console.log('File may not exist in storage', e));
      await deleteDoc(doc(db, 'barber_portfolio_items', item.id));
      loadData();
    } catch(err) {
      console.error(err);
      alert("Erro ao excluir imagem");
    }
  };

  const handleEditCaption = (item: PortfolioItem) => {
    setEditingItem(item);
    setCaptionText(item.caption || "");
    setCaptionModalOpen(true);
  };
  
  const saveCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateDoc(doc(db, 'barber_portfolio_items', editingItem.id), { caption: captionText });
      setCaptionModalOpen(false);
      loadData();
    } catch(err) {
      console.error(err);
      alert("Erro ao salvar legenda.");
    }
  };

  const handleSetFeatured = async (item: PortfolioItem) => {
    try {
      const items = portfolioItems[item.barberId] || [];
      const currentFeatured = items.find(i => i.isFeatured);
      if (currentFeatured) {
        await updateDoc(doc(db, 'barber_portfolio_items', currentFeatured.id), { isFeatured: false });
      }
      await updateDoc(doc(db, 'barber_portfolio_items', item.id), { isFeatured: true });
      loadData();
    } catch(err) {
      console.error(err);
    }
  };
  
  const handleToggleActive = async (item: PortfolioItem) => {
    await updateDoc(doc(db, 'barber_portfolio_items', item.id), { isActive: !item.isActive });
    loadData();
  };

  const moveItem = async (barberId: string, index: number, direction: -1 | 1) => {
     const items = [...(portfolioItems[barberId] || [])];
     if (index + direction < 0 || index + direction >= items.length) return;
     
     const current = items[index];
     const target = items[index + direction];
     
     const currentOrder = current.displayOrder;
     current.displayOrder = target.displayOrder;
     target.displayOrder = currentOrder;
     
     items[index] = target;
     items[index + direction] = current;
     
     // Update UI optimistically
     setPortfolioItems(prev => ({...prev, [barberId]: items}));
     
     try {
       await updateDoc(doc(db, 'barber_portfolio_items', current.id), { displayOrder: current.displayOrder });
       await updateDoc(doc(db, 'barber_portfolio_items', target.id), { displayOrder: target.displayOrder });
     } catch(err) {
       console.error(err);
       loadData(); // Revert on error
     }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="text-orange-500" /> Barbeiros & Portfólio</h1>
      </div>

      <div className="space-y-6">
        {barbers.map(barber => (
          <div key={barber.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
             
             {/* Barber Header Info */}
             <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-24 h-24 rounded-full bg-neutral-800 relative group overflow-hidden shrink-0">
                  {barber.photoUrl ? (
                    <img src={barber.photoUrl} alt={barber.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">Sem Foto</div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                     {uploadingState[barber.id + '_profile'] ? <Loader2 className="w-5 h-5 animate-spin text-white"/> : <ImageIcon className="w-6 h-6 text-white" />}
                     <input type="file" className="hidden" accept="image/*" onChange={e => handleEditPhoto(e, barber)} disabled={uploadingState[barber.id + '_profile']} />
                  </label>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{barber.name}</h3>
                  <p className="text-sm text-neutral-400 mb-2">{(barber as any).bio || 'Nenhuma biografia informada.'}</p>
                  <button onClick={() => handleEditBio(barber)} className="text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors">
                     Editar Biografia
                  </button>
                </div>
                
                <button 
                  onClick={() => setExpandedBarber(expandedBarber === barber.id ? null : barber.id)}
                  className="bg-[#0A0A0A] hover:bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shrink-0"
                >
                  {expandedBarber === barber.id ? 'Ocultar Portfólio' : 'Ver Portfólio'}
                  {expandedBarber === barber.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                </button>
             </div>

             {/* Portfolio Section */}
             {expandedBarber === barber.id && (
               <div className="bg-[#0A0A0A] p-6 border-t border-neutral-800">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg">Galeria de Trabalhos</h4>
                    <label className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-sm font-medium">
                      {uploadingState[barber.id + '_portfolio'] ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                      Nova Imagem
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleUploadPortfolio(e, barber.id)} disabled={uploadingState[barber.id + '_portfolio']} />
                    </label>
                  </div>
                  
                  {(portfolioItems[barber.id] || []).length === 0 ? (
                    <div className="text-center text-neutral-500 py-8 border border-dashed border-neutral-800 rounded-xl">
                      Nenhuma imagem no portfólio deste barbeiro.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(portfolioItems[barber.id] || []).map((item, index) => (
                        <div key={item.id} className={`relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group ${!item.isActive ? 'opacity-50' : ''}`}>
                          
                          <div className="aspect-[4/5] bg-neutral-800 relative">
                             <img src={item.publicUrl} alt={item.caption} className="w-full h-full object-cover" />
                             {item.isFeatured && (
                               <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                 <Star className="w-3 h-3 fill-white" /> Destaque
                               </div>
                             )}
                          </div>
                          
                          <div className="p-3">
                            <p className="text-xs text-neutral-400 truncate mb-3" title={item.caption}>{item.caption || 'Sem legenda'}</p>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex gap-1">
                                <button onClick={() => moveItem(barber.id, index, -1)} disabled={index === 0} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 disabled:opacity-30">
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => moveItem(barber.id, index, 1)} disabled={index === (portfolioItems[barber.id]?.length || 0) - 1} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 disabled:opacity-30">
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleEditCaption(item)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-white" title="Editar legenda">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleSetFeatured(item)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-orange-500" title="Marcar como destaque">
                                  <Star className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleToggleActive(item)} className={`p-1.5 rounded ${item.isActive ? 'bg-neutral-800 text-green-500' : 'bg-red-500/20 text-red-500'}`} title={item.isActive ? 'Desativar' : 'Ativar'}>
                                  <div className="w-3 h-3 rounded-full bg-current"></div>
                                </button>
                                <button onClick={() => handleDeletePortfolio(item)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-500" title="Excluir">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
               </div>
             )}
             
          </div>
        ))}
      </div>

      {bioModalOpen && editingBarber && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Editar Biografia - {editingBarber.name}</h2>
                <button onClick={() => setBioModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-6 h-6"/></button>
             </div>
             <form onSubmit={saveBio} className="space-y-4">
                <div>
                  <textarea rows={4} value={bioText} onChange={e => setBioText(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" placeholder="Digite a biografia do barbeiro..."></textarea>
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
                   Salvar Biografia
                </button>
             </form>
          </div>
        </div>
      )}

      {captionModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-lg">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Editar Legenda</h2>
                <button onClick={() => setCaptionModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-6 h-6"/></button>
             </div>
             <form onSubmit={saveCaption} className="space-y-4">
                <div>
                  <input type="text" value={captionText} onChange={e => setCaptionText(e.target.value)} className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" placeholder="Digite uma legenda para a imagem..." />
                </div>
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">
                   Salvar Legenda
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
