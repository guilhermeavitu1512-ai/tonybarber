import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BARBERSHOP_LOCATION as DEFAULT_LOCATION } from '../../lib/config';
import { Save } from 'lucide-react';

export function AdminSettings() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'location'));
        if (snap.exists()) {
          setLocation(snap.data() as typeof DEFAULT_LOCATION);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'location'), location);
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Configurações da Barbearia</h1>

      <form onSubmit={handleSave} className="bg-[#111] p-6 rounded-2xl border border-neutral-800 space-y-6">
        <h2 className="text-xl font-bold mb-4">Localização e Contato</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Nome do Estabelecimento</label>
            <input 
              required type="text" 
              value={location.name} onChange={e => setLocation({...location, name: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Telefone Fixo</label>
            <input 
              required type="text" 
              value={location.phone} onChange={e => setLocation({...location, phone: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">WhatsApp (apenas números ou formatado)</label>
            <input 
              required type="text" 
              value={location.whatsapp} onChange={e => setLocation({...location, whatsapp: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Horário de Funcionamento</label>
            <input 
              required type="text" 
              value={location.hours} onChange={e => setLocation({...location, hours: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
        </div>

        <h3 className="text-lg font-medium mt-6 mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-neutral-400">Rua</label>
            <input 
              required type="text" 
              value={location.street} onChange={e => setLocation({...location, street: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Número</label>
            <input 
              required type="text" 
              value={location.number} onChange={e => setLocation({...location, number: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Bairro / Referência</label>
            <input 
              required type="text" 
              value={location.reference} onChange={e => setLocation({...location, reference: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Cidade</label>
            <input 
              required type="text" 
              value={location.city} onChange={e => setLocation({...location, city: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">Estado / UF</label>
            <input 
              required type="text" 
              value={location.stateCode} onChange={e => setLocation({...location, stateCode: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">CEP</label>
            <input 
              required type="text" 
              value={location.postalCode} onChange={e => setLocation({...location, postalCode: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-400">País</label>
            <input 
              required type="text" 
              value={location.country} onChange={e => setLocation({...location, country: e.target.value})}
              className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>

      <div className="bg-[#111] p-6 rounded-2xl border border-neutral-800 mt-8">
        <h2 className="text-xl font-bold mb-4">Configuração do WhatsApp</h2>
        <p className="text-neutral-400 mb-4 text-sm">Configure o número oficial da barbearia para habilitar os botões de contato. O número deve ter código do país, DDD e apenas números.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">Número Oficial (Ex: 5581999999999)</label>
              <input 
                type="text" 
                value={location.whatsapp || ''} 
                onChange={e => setLocation({...location, whatsapp: e.target.value.replace(/\D/g, '')})}
                className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
                placeholder="5581..."
              />
           </div>
        </div>
        
        <div className="mt-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-sm text-neutral-400">
           <p>Você também pode usar a variável de ambiente <strong className="text-white">VITE_WHATSAPP_BUSINESS_NUMBER</strong> se preferir não salvar no banco.</p>
        </div>
      </div>
    </div>
  );
}
