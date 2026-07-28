import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { LineWaves } from '../../components/ui/LineWaves';
import SpecularButton from '../../components/ui/SpecularButton';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginMock } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      
      // Auto-register admin if it doesn't exist in Firebase yet
      if (trimmedEmail === 'tonybarbearia321@gmail.com' && password === 'barbertony890#') {
        try {
          // If login failed because the user isn't registered, create them now.
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          navigate('/admin');
          return;
        } catch (createErr) {
          console.error('Failed to create admin:', createErr);
        }
      }
      
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle LineWaves background */}
      <LineWaves
        speed={0.14}
        innerLineCount={20}
        outerLineCount={24}
        warpIntensity={0.5}
        rotation={-20}
        edgeFadeWidth={0.2}
        colorCycleSpeed={0.3}
        brightness={0.055}
        color1="#ff5a00"
        color2="#ff7a00"
        color3="#ff9a3c"
        enableMouseInteraction
        mouseInfluence={1.0}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-12 h-12 text-orange-500 mb-4" />
          <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
          <p className="text-neutral-400 text-sm mt-1">Painel Administrativo</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Removed login hints */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="Seu e-mail"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <SpecularButton
              type="submit"
              disabled={loading}
              size="lg"
              radius={12}
              tint="#ea580c"
              tintOpacity={1}
              textColor="#ffffff"
              lineColor="#fdba74"
              baseColor="#9a3412"
              intensity={1.3}
              shineSize={14}
              shineFade={45}
              followMouse
              proximity={250}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </SpecularButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
