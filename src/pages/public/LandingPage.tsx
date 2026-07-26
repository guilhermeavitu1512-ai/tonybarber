import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Scissors, Star, Users, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef, useEffect as useReactEffect } from 'react';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Barber } from '../../types';
import { Logo } from '../../components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { LocationSection } from '../../components/LocationSection';

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, r: number, vx: number, vy: number, alpha: number }[] = [];
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;

    const createParticles = () => {
       const particleCount = window.innerWidth < 768 ? 30 : 80;
       particles = [];
       for (let i = 0; i < particleCount; i++) {
         particles.push({
           x: Math.random() * width,
           y: Math.random() * height,
           r: Math.random() * 2 + 0.5,
           vx: (Math.random() - 0.5) * 0.2,
           vy: (Math.random() - 0.5) * 0.2 - 0.05,
           alpha: Math.random() * 0.4 + 0.1
         });
       }
    };

    createParticles();

    let mouseX = width / 2;
    let mouseY = height / 2;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        // Slight interaction with mouse on desktop
        if (width >= 768) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            p.x -= dx * 0.01;
            p.y -= dy * 0.01;
          }
        }
        
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${p.alpha})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      createParticles();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export function LandingPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useReactEffect(() => {
    async function loadBarbers() {
      try {
        const snap = await getDocs(query(collection(db, 'barbers')));
        setBarbers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Barber)).filter(b => b.isActive));
      } catch (e) {
         console.error(e);
      }
    }
    loadBarbers();
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      
      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#0A0A0A] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <Logo className="w-10 h-10" />
            <span>Barbearia <span className="text-orange-500">Tony</span></span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
             <button 
                onClick={() => {
                   document.getElementById('localizacao')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-neutral-400 hover:text-orange-500 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg px-2 py-1"
             >
                Localização
             </button>
             <Link 
                to="/agendar" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg shadow-orange-500/20"
             >
                Agendar
             </Link>
          </nav>
          
          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden p-2 text-neutral-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Alternar menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
             <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-neutral-800 bg-[#0A0A0A] overflow-hidden"
             >
                <div className="flex flex-col p-4 gap-4">
                   <button 
                      onClick={() => {
                         setMobileMenuOpen(false);
                         setTimeout(() => {
                            document.getElementById('localizacao')?.scrollIntoView({ behavior: 'smooth' });
                         }, 100);
                      }}
                      className="text-left text-neutral-300 hover:text-orange-500 font-medium py-2 px-4 rounded-xl hover:bg-neutral-900 transition-colors"
                   >
                      Localização
                   </button>
                   <Link 
                      to="/agendar" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                   >
                      Agendar Agora
                   </Link>
                </div>
             </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        <Particles />
        
        {/* Cinematic Orange Gradient Background */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-orange-500/10 blur-[120px] md:blur-[150px] rounded-full pointer-events-none z-0"
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full">
          {/* 1. Headline first */}
          <motion.h1 
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white order-2 mt-8"
          >
            Seu estilo, <br className="hidden md:block"/> nossa <span className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">assinatura.</span>
          </motion.h1>

          {/* 2. Logo second (visually above headline, so order-1) */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
            className="order-1 flex flex-col items-center"
          >
            <Logo className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_20px_rgba(249,115,22,0.2)]" />
          </motion.div>

          {/* 3. Subtitle & Button third */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}
            className="order-3 flex flex-col items-center mt-6"
          >
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Cortes precisos, toalha quente e um ambiente preparado para o seu momento. Agende seu horário online e garanta sua vaga.
            </p>
            
            <Link 
              to="/agendar" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)]"
            >
              <Calendar className="w-5 h-5" />
              Agendar Agora
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Barbers Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">Nossa <span className="text-orange-500">Equipe</span></h2>
             <p className="text-neutral-400 max-w-2xl mx-auto">Conheça nossos profissionais, veja os portfolios e agende com o barbeiro que mais combina com seu estilo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {barbers.map(barber => (
               <Link 
                 to={`/barbeiros/${barber.id}`}
                 key={barber.id}
                 className="group bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300"
               >
                 <div className="aspect-[4/3] bg-neutral-800 overflow-hidden relative">
                    <img src={barber.photoUrl || "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800"} alt={barber.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 </div>
                 <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{barber.name}</h3>
                    <p className="text-neutral-400 text-sm mb-4">Especialista em cortes, barba e cuidados masculinos.</p>
                    <div className="text-orange-500 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                       Agendar com este profissional <span className="opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </div>
                 </div>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      {featuredPackages.length > 0 && (
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Nossos <span className="text-orange-500">Pacotes</span></h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Garanta seu visual sempre em dia com nossos pacotes promocionais.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPackages.map(pkg => (
              <div key={pkg.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all group">
                 <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
                 <p className="text-neutral-400 mb-6 h-12">{pkg.description}</p>
                 <div className="text-4xl font-bold text-orange-500 mb-6">R$ {pkg.price.toFixed(2)}</div>
                 <div className="text-sm text-neutral-500 mb-8 border-t border-neutral-800 pt-4">
                    Validade de {pkg.validityDays} dias
                 </div>
                 <Link to="/agendar" className="block w-full bg-neutral-800 group-hover:bg-orange-500 group-hover:text-white text-center text-white py-3 rounded-xl font-bold transition-colors">
                    Adquirir Pacote
                 </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Meu Estilo Promo */}
      <section className="py-20 px-4 relative overflow-hidden bg-neutral-900/10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }} 
          viewport={{ once: true }} 
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Seu estilo fica salvo. Seu próximo agendamento fica <span className="text-orange-500">mais rápido.</span></h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
            Guarde seu barbeiro, serviço, referências e preferências para repetir seu atendimento sem começar do zero.
          </p>
          <Link 
            to="/meu-estilo" 
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all inline-flex items-center gap-2 border border-neutral-700"
          >
            Acessar Meu Estilo
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-neutral-900/30 py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, staggerChildren: 0.2 }} 
          viewport={{ once: true, margin: "-50px" }} 
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-neutral-900/50 shadow-sm border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900/80 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Sem Filas</h3>
            <p className="text-neutral-400 leading-relaxed">Atendimento com hora marcada. Chegue e seja atendido na hora.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-neutral-900/50 shadow-sm border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900/80 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
              <Star className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Profissionais de Elite</h3>
            <p className="text-neutral-400 leading-relaxed">Nossos barbeiros são especialistas nas técnicas mais modernas.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center text-center p-8 rounded-2xl bg-neutral-900/50 shadow-sm border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-900/80 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fácil Acesso</h3>
            <p className="text-neutral-400 leading-relaxed">Localização central com estacionamento exclusivo para clientes.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Location Section */}
      <LocationSection />

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 text-center text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} Barbearia Tony. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
