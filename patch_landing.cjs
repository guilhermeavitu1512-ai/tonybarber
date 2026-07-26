const fs = require('fs');
let code = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf8');

const target = `<h3 className="text-xl font-bold mb-2">{barber.name}</h3>
                    <p className="text-neutral-400 text-sm mb-4">{barber.specialties.join(' • ')}</p>
                    <div className="text-orange-500 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                       Ver perfil completo <span className="opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </div>`;

const replacement = `<h3 className="text-xl font-bold mb-2">{barber.name}</h3>
                    <p className="text-neutral-400 text-sm mb-4">Especialista em cortes, barba e cuidados masculinos.</p>
                    <div className="text-orange-500 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                       Agendar com este profissional <span className="opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/public/LandingPage.tsx', code);
