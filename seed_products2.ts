import { app, db } from './src/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const products = [
  { name: 'FOX FOR MEN - Anti-caspa', price: 40, sku: 'FOX-AC', stockPhysical: 50, stockReserved: 0, stockAvailable: 50, stockMinimum: 5, isActive: true, description: 'Shampoo anti-caspa', createdAt: new Date().toISOString() },
  { name: 'FOX FOR MEN - Cabelo e Barba', price: 35, sku: 'FOX-CB', stockPhysical: 50, stockReserved: 0, stockAvailable: 50, stockMinimum: 5, isActive: true, description: 'Shampoo cabelo e barba', createdAt: new Date().toISOString() },
  { name: 'Foxidil', price: 55, sku: 'FOX-DIL', stockPhysical: 50, stockReserved: 0, stockAvailable: 50, stockMinimum: 5, isActive: true, description: 'Loção de crescimento', createdAt: new Date().toISOString() },
  { name: 'Óleo Reparador', price: 30, sku: 'OLEO-REP', stockPhysical: 50, stockReserved: 0, stockAvailable: 50, stockMinimum: 5, isActive: true, description: 'Óleo reparador de pontas', createdAt: new Date().toISOString() },
  { name: 'Pomada Modeladora', price: 20, sku: 'POM-MOD', stockPhysical: 50, stockReserved: 0, stockAvailable: 50, stockMinimum: 5, isActive: true, description: 'Pomada modeladora efeito seco', createdAt: new Date().toISOString() }
];

async function seed() {
  const snap = await getDocs(collection(db, 'products'));
  if (snap.empty) {
    for (const p of products) {
      await addDoc(collection(db, 'products'), p);
      console.log('Added', p.name);
    }
  } else {
    console.log('Products already exist');
  }
}
seed().then(() => process.exit(0)).catch(console.error);
