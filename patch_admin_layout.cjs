const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldNav = `<nav className="p-4 space-y-2 flex-1">
          <Link to="/admin" className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 text-orange-500 font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/admin/estoque" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Estoque
          </Link>
          <Link to="/admin/pacotes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Pacotes
          </Link>
          <Link to="/admin/barbeiros" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Portfólio
          </Link>
          <Link to="/admin/configuracoes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            Configurações
          </Link>
        </nav>`;

const newNav = `<nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <Link to="/admin" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <div className="text-xs font-bold text-neutral-600 uppercase tracking-wider pt-4 pb-2 px-3">Gestão</div>
          <Link to="/admin/barbeiros" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Barbeiros & Portfólio
          </Link>
          <Link to="/admin/estoque" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Produtos & Estoque
          </Link>
          <Link to="/admin/pacotes" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Pacotes
          </Link>
          <div className="text-xs font-bold text-neutral-600 uppercase tracking-wider pt-4 pb-2 px-3">Sistema</div>
          <Link to="/admin/configuracoes" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" /> Configurações
          </Link>
        </nav>`;

code = code.replace(oldNav, newNav);

fs.writeFileSync('src/App.tsx', code);
