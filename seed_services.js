import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0254140623",
  appId: "1:721701647010:web:f241c5710de9007b2f5dfb",
  apiKey: "AIzaSyC0r3tXwA0G61IYyEOOGzOQuBqqLdwpjSE",
  authDomain: "gen-lang-client-0254140623.firebaseapp.com",
  storageBucket: "gen-lang-client-0254140623.firebasestorage.app",
  messagingSenderId: "721701647010"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-5c2ed8fc-bae9-41d8-81c1-1806d0f17a5a");

async function seed() {
  console.log("Fetching barbers...");
  const barbersSnap = await getDocs(collection(db, 'barbers'));
  const barberIds = barbersSnap.docs.map(d => d.id);
  console.log(`Found ${barberIds.length} barbers.`);

  if (barberIds.length === 0) {
    console.error("No barbers found! Run the previous seed first.");
    process.exit(1);
  }

  console.log("Fetching old services to delete...");
  const oldServicesSnap = await getDocs(collection(db, 'services'));
  
  const batch = writeBatch(db);
  let opCount = 0;

  oldServicesSnap.docs.forEach(d => {
    batch.delete(d.ref);
    opCount++;
  });

  const servicesData = [
    { name: "Barba tradicional", price: 20.00, durationMinutes: 25 },
    { name: "Barboterapia", price: 25.00, durationMinutes: 30 },
    { name: "Barboterapia + Matização", price: 40.00, durationMinutes: 40 },
    { name: "Corte + Barba + Realinhamento", price: 110.00, durationMinutes: 120 },
    { name: "Corte + Barba Tradicional", price: 45.00, durationMinutes: 60 },
    { name: "Corte + Barboterapia + Matização de Barba + Lavagem Grátis", price: 60.00, durationMinutes: 80 },
    { name: "Corte + Lavagem", description: "Além de um corte de qualidade, acompanha lavagem e uma modelagem para finalizar", price: 30.00, durationMinutes: 40 },
    { name: "Corte + Lavagem + Sobrancelha", description: "Alinhamento duplo, cabelo e sobrancelha (na navalha)", price: 35.00, durationMinutes: 40 },
    { name: "Corte + Realinhamento", price: 100.00, durationMinutes: 120 },
    { name: "Corte + Barboterapia + Lavagem Grátis", description: "Procedimento extremamente relaxante, além da toalha quente, a barba é finalizada com massagem, que ajuda a prevenir irritações", price: 50.00, durationMinutes: 60 },
    { name: "Matização de Barba", price: 15.00, durationMinutes: 15 },
    { name: "Modelagem", price: 15.00, durationMinutes: 15 },
    { name: "Pezinho", price: 10.00, durationMinutes: 15 },
    { name: "Realinhamento", price: 70.00, durationMinutes: 120 },
    { name: "Corte + Barboterapia + Matização Completo", price: 70.00, durationMinutes: 80 },
  ];

  for (const s of servicesData) {
    const sRef = doc(collection(db, 'services'));
    batch.set(sRef, {
      ...s,
      barberIds: barberIds,
      isActive: true
    });
    opCount++;
  }

  // Also let's update the barbers to include ALL of these services as their specialties.
  // The prompt says "os 3 barbeiros realizam exatamente os mesmos 15 serviços".
  const allServiceNames = servicesData.map(s => s.name);
  for (const barberDoc of barbersSnap.docs) {
    batch.update(barberDoc.ref, { specialties: allServiceNames });
    opCount++;
  }

  await batch.commit();
  console.log("Services seeded successfully.");
  process.exit(0);
}

seed();
