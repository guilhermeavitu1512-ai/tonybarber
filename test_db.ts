import { app, db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  const productsSnap = await getDocs(collection(db, 'products'));
  const prods = productsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  console.log(JSON.stringify(prods, null, 2));
}
main().then(() => process.exit(0)).catch(console.error);
