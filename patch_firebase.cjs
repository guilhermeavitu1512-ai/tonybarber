const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
if (!code.includes('getStorage')) {
  code = code.replace("import { initializeFirestore } from 'firebase/firestore';", "import { initializeFirestore } from 'firebase/firestore';\nimport { getStorage } from 'firebase/storage';");
  code = code + "\nexport const storage = getStorage(app);";
  fs.writeFileSync('src/lib/firebase.ts', code);
}
