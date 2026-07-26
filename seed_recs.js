import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = initializeFirestore(app, {}, "ai-studio-5c2ed8fc-bae9-41d8-81c1-1806d0f17a5a");

async function run() {
  console.log("Fetching services...");
  const services = await getDocs(collection(db, "services"));
  const products = await getDocs(collection(db, "products"));
  
  const serviceList = services.docs.map(d => ({id: d.id, ...d.data()}));
  const productList = products.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log("Services:", serviceList.map(s => s.name));
  console.log("Products:", productList.map(p => p.name));
  
  if (productList.length === 0) {
    console.log("No products, creating some...");
    const p1 = await addDoc(collection(db, "products"), {
      name: "Pomada Modeladora Efeito Matte",
      description: "Fixação forte e sem brilho para o dia todo.",
      price: 45.90,
      stockAvailable: 20,
      stockPhysical: 20,
      stockReserved: 0,
      stockMinimum: 5,
      trackStock: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const p2 = await addDoc(collection(db, "products"), {
      name: "Óleo Hidratante para Barba",
      description: "Hidratação profunda e perfume suave amadeirado.",
      price: 35.00,
      stockAvailable: 15,
      stockPhysical: 15,
      stockReserved: 0,
      stockMinimum: 5,
      trackStock: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    productList.push({id: p1.id, name: "Pomada Modeladora Efeito Matte"});
    productList.push({id: p2.id, name: "Óleo Hidratante para Barba"});
  }

  let recsAdded = 0;
  for (let s of serviceList) {
    if (s.name.includes("Barba")) {
      for (let p of productList) {
        if (p.name.includes("Óleo")) {
          await addDoc(collection(db, "service_product_recommendations"), {
            serviceId: s.id,
            productId: p.id,
            priority: 10,
            label: "Essencial para sua barba",
            isActive: true
          });
          recsAdded++;
        }
      }
    } else {
       for (let p of productList) {
        if (p.name.includes("Pomada")) {
          await addDoc(collection(db, "service_product_recommendations"), {
            serviceId: s.id,
            productId: p.id,
            priority: 10,
            label: "Finalização perfeita",
            isActive: true
          });
          recsAdded++;
        }
      }
    }
  }
  console.log("Added recs:", recsAdded);
}

run().catch(console.error).finally(() => process.exit(0));
