const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminBarbers.tsx', 'utf8');

const stateStr = `  const [expandedBarber, setExpandedBarber] = useState<string | null>(null);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});`;
const newStateStr = `  const [expandedBarber, setExpandedBarber] = useState<string | null>(null);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [bioText, setBioText] = useState('');
  
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [captionText, setCaptionText] = useState('');`;
code = code.replace(stateStr, newStateStr);

const handleBioStr = `  const handleEditBio = async (barber: Barber) => {
    const bio = prompt("Digite a biografia do barbeiro:", (barber as any).bio || "");
    if (bio !== null) {
       await updateDoc(doc(db, 'barbers', barber.id), { bio });
       loadData();
    }
  };`;
const newHandleBioStr = `  const handleEditBio = (barber: Barber) => {
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
  };`;
code = code.replace(handleBioStr, newHandleBioStr);

const handleCaptionStr = `  const handleEditCaption = async (item: PortfolioItem) => {
    const caption = prompt("Legenda:", item.caption);
    if (caption !== null) {
      await updateDoc(doc(db, 'barber_portfolio_items', item.id), { caption });
      loadData();
    }
  };`;
const newHandleCaptionStr = `  const handleEditCaption = (item: PortfolioItem) => {
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
  };`;
code = code.replace(handleCaptionStr, newHandleCaptionStr);

const modalRenderStr = `    </div>
  );
}`;
const newModalRenderStr = `
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
}`;
code = code.replace(modalRenderStr, newModalRenderStr);

// We also need to import X from lucide-react if not already
if (!code.includes('X,') && !code.includes(', X')) {
  code = code.replace('} from \'lucide-react\'', ', X } from \'lucide-react\'');
}

fs.writeFileSync('src/pages/admin/AdminBarbers.tsx', code);
