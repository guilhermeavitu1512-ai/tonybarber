import React, { useState, useEffect } from 'react';
import { MapPin, Copy, Check, MessageCircle, Navigation2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../lib/useSettings';

export function LocationSection() {
  const [copied, setCopied] = useState(false);
  const { location: BARBERSHOP_LOCATION } = useSettings();
  
  const fullAddress = `${BARBERSHOP_LOCATION.street}, ${BARBERSHOP_LOCATION.number} — ${BARBERSHOP_LOCATION.reference}, ${BARBERSHOP_LOCATION.city} — ${BARBERSHOP_LOCATION.stateCode}, ${BARBERSHOP_LOCATION.postalCode}, ${BARBERSHOP_LOCATION.country}`;
  const encodedAddress = encodeURIComponent(`${BARBERSHOP_LOCATION.street}, ${BARBERSHOP_LOCATION.number}, ${BARBERSHOP_LOCATION.reference}, ${BARBERSHOP_LOCATION.city}, ${BARBERSHOP_LOCATION.stateCode}, ${BARBERSHOP_LOCATION.postalCode}, ${BARBERSHOP_LOCATION.country} (${BARBERSHOP_LOCATION.name})`);
  const mapsUrl = `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodedAddress}&t=&z=16&ie=UTF8&iwloc=B&output=embed`;
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const whatsappUrl = `https://wa.me/${BARBERSHOP_LOCATION.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20agendamento.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <section id="localizacao" className="py-24 px-4 relative overflow-hidden bg-black border-t border-neutral-900">
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.05),transparent_50%)]"></div>
      
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Onde seu próximo estilo <span className="text-orange-500">começa</span></h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Encontre a {BARBERSHOP_LOCATION.name} em {BARBERSHOP_LOCATION.city} e trace a melhor rota até o seu atendimento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 order-2 lg:order-1 flex flex-col gap-8"
          >
            <div className="bg-[#111] border border-neutral-800 p-8 rounded-3xl shadow-xl">
               <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20">
                 <MapPin className="w-6 h-6" />
               </div>
               
               <h3 className="text-2xl font-bold mb-6 text-white">{BARBERSHOP_LOCATION.name}</h3>
               
               <div className="space-y-2 text-neutral-300 text-lg mb-8 leading-relaxed">
                 <p>{BARBERSHOP_LOCATION.street}, nº {BARBERSHOP_LOCATION.number}</p>
                 <p>{BARBERSHOP_LOCATION.reference}</p>
                 <p>{BARBERSHOP_LOCATION.city} — {BARBERSHOP_LOCATION.stateCode}</p>
                 <p>CEP {BARBERSHOP_LOCATION.postalCode}</p>
                 <p>{BARBERSHOP_LOCATION.country}</p>
                 
                 <div className="pt-4 mt-4 border-t border-neutral-800 space-y-2 text-base text-neutral-400">
                    <p className="flex items-center gap-2"><span className="text-orange-500 w-4 h-4 inline-block rounded-full bg-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span> {BARBERSHOP_LOCATION.hours}</p>
                    <p className="flex items-center gap-2">WhatsApp: {BARBERSHOP_LOCATION.phone}</p>
                 </div>
               </div>
               
               <div className="flex flex-col gap-3">
                  <a 
                    href={routeUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    aria-label={`Abrir rota para a ${BARBERSHOP_LOCATION.name} no aplicativo de mapas`}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                     <Navigation2 className="w-5 h-5" /> Traçar rota
                  </a>
                  <button 
                    onClick={handleCopy}
                    aria-label="Copiar endereço completo"
                    className={`w-full px-6 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${copied ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800'}`}
                  >
                     {copied ? <><Check className="w-5 h-5" /> Endereço copiado</> : <><Copy className="w-5 h-5" /> Copiar endereço</>}
                  </button>
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    aria-label={`Falar no WhatsApp oficial da ${BARBERSHOP_LOCATION.name}`}
                    className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] px-6 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                     <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
                  </a>
               </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-7 order-1 lg:order-2 h-[400px] lg:h-[650px] relative rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900 group"
          >
            <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center text-neutral-500 -z-10">
               <p>Carregando mapa...</p>
            </div>
            
            <iframe 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               scrolling="no" 
               marginHeight={0} 
               marginWidth={0} 
               src={mapsUrl}
               className="w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-80 group-hover:opacity-100 mix-blend-luminosity hover:mix-blend-normal"
               title={`Mapa indicando a localização da ${BARBERSHOP_LOCATION.name}`}
               loading="lazy"
               onError={(e) => {
                  const target = e.target as HTMLIFrameElement;
                  target.style.display = 'none';
               }}
            ></iframe>
            
            {/* Fallback overlay (only visible if iframe completely fails, although iframe onerror is tricky, we provide instructions just in case) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ zIndex: -2 }}>
               <div className="bg-[#111] p-6 rounded-2xl text-center border border-neutral-800 max-w-sm">
                  <MapPin className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
                  <h4 className="text-white font-bold mb-2">Não foi possível carregar o mapa.</h4>
                  <p className="text-neutral-400 text-sm">Você ainda pode copiar o endereço ou abrir a rota diretamente no aplicativo de mapas utilizando os botões.</p>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
