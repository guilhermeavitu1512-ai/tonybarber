const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminSettings.tsx', 'utf8');

const targetWhatsApp = `<div className="bg-[#111] p-6 rounded-2xl border border-neutral-800 mt-8">
        <h2 className="text-xl font-bold mb-4">Configurações de WhatsApp (Cloud API)</h2>
        <div className="space-y-4 text-sm text-neutral-400">
           <p>Integração Ativa: <strong className="text-green-500">Sim</strong></p>
           <p>Número Remetente: <strong className="text-white">Configurado via .env</strong></p>
           <p>Nome do Template: <strong className="text-white">agendamento_confirmado_v1</strong></p>
           <p>Idioma: <strong className="text-white">pt_BR</strong></p>
           <p>Webhook: <strong className="text-white">/api/webhooks/whatsapp</strong></p>
        </div>
        <div className="mt-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
           <h3 className="font-bold text-white mb-2">Checklist para Produção</h3>
           <ul className="list-disc pl-5 space-y-1">
              <li>Conta empresarial na Meta</li>
              <li>Aplicativo no Meta for Developers</li>
              <li>Produto WhatsApp adicionado</li>
              <li>Token de acesso de produção (Vercel Secrets)</li>
              <li>Template aprovado</li>
              <li>Webhook configurado e assinado</li>
           </ul>
        </div>
      </div>`;

const newWhatsApp = `<div className="bg-[#111] p-6 rounded-2xl border border-neutral-800 mt-8">
        <h2 className="text-xl font-bold mb-4">Configuração do WhatsApp</h2>
        <p className="text-neutral-400 mb-4 text-sm">Configure o número oficial da barbearia para habilitar os botões de contato. O número deve ter código do país, DDD e apenas números.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">Número Oficial (Ex: 5581999999999)</label>
              <input 
                type="text" 
                value={location.whatsapp || ''} 
                onChange={e => setLocation({...location, whatsapp: e.target.value.replace(/\\D/g, '')})}
                className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-900 focus:border-orange-500" 
                placeholder="5581..."
              />
           </div>
        </div>
        
        <div className="mt-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-sm text-neutral-400">
           <p>Você também pode usar a variável de ambiente <strong className="text-white">VITE_WHATSAPP_BUSINESS_NUMBER</strong> se preferir não salvar no banco.</p>
        </div>
      </div>`;

code = code.replace(targetWhatsApp, newWhatsApp);
fs.writeFileSync('src/pages/admin/AdminSettings.tsx', code);
