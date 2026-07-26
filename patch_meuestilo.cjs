const fs = require('fs');
let code = fs.readFileSync('src/pages/public/MeuEstilo.tsx', 'utf8');

const targetState = "  const [reviewComment, setReviewComment] = useState('');";
const replaceState = `  const [reviewComment, setReviewComment] = useState('');
  const [prefBarberName, setPrefBarberName] = useState('Não definido');
  const [prefServiceName, setPrefServiceName] = useState('Não definido');`;

code = code.replace(targetState, replaceState);

const targetLoad = `      setProfile(currentProfile);

      // Load history
      const apptQ = query(collection(db, 'appointments'), where('customerEmail', '==', userEmail));`;

const replaceLoad = `      setProfile(currentProfile);

      let bId = currentProfile.preferredBarberId;
      let sId = currentProfile.preferredServiceId;

      if (bId) {
         const bDoc = await getDoc(doc(db, 'barbers', bId));
         if (bDoc.exists()) setPrefBarberName(bDoc.data().name);
      }
      if (sId) {
         const sDoc = await getDoc(doc(db, 'services', sId));
         if (sDoc.exists()) setPrefServiceName(sDoc.data().name);
      }

      // Load history
      const apptQ = query(collection(db, 'appointments'), where('customerEmail', '==', userEmail));`;

code = code.replace(targetLoad, replaceLoad);

const targetUI1 = `                  <div className="text-sm text-neutral-500 mb-1">Barbeiro Preferido</div>
                  <div className="font-medium bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">Tony</div>`;

const replaceUI1 = `                  <div className="text-sm text-neutral-500 mb-1">Barbeiro Preferido</div>
                  <div className="font-medium bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">{prefBarberName}</div>`;

code = code.replace(targetUI1, replaceUI1);

const targetUI2 = `                  <div className="text-sm text-neutral-500 mb-1">Corte Frequente</div>
                  <div className="font-medium bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">Corte + Barba</div>`;

const replaceUI2 = `                  <div className="text-sm text-neutral-500 mb-1">Serviço Frequente</div>
                  <div className="font-medium bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800">{prefServiceName}</div>`;

code = code.replace(targetUI2, replaceUI2);

fs.writeFileSync('src/pages/public/MeuEstilo.tsx', code);
