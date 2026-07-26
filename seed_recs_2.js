import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, addDoc, query, where, writeBatch } from 'firebase/firestore';
import fs from 'fs';

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, "ai-studio-5c2ed8fc-bae9-41d8-81c1-1806d0f17a5a");

async function run() {
  const services = await getDocs(collection(db, "services"));
  const products = await getDocs(collection(db, "products"));
  
  const serviceList = services.docs.map(d => ({id: d.id, name: d.data().name}));
  const productList = products.docs.map(d => ({id: d.id, name: d.data().name}));
  
  let recsAdded = 0;
  for (let s of serviceList) {
    if (s.name.includes("Barba")) {
      for (let p of productList) {
        if (p.name.includes("Foxidil") || p.name.includes("Cabelo e Barba")) {
          await addDoc(collection(db, "service_product_recommendations"), {
            serviceId: s.id,
            productId: p.id,
            priority: 8,
            label: "Tratamento completo para sua barba",
            isActive: true
          });
          recsAdded++;
        }
      }
    } else {
       for (let p of productList) {
        if (p.name.includes("Anti-caspa") || p.name.includes("Cabelo e Barba")) {
          await addDoc(collection(db, "service_product_recommendations"), {
            serviceId: s.id,
            productId: p.id,
            priority: 8,
            label: "Cuidado extra para o seu cabelo",
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
