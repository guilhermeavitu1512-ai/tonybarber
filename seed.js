import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, query, where } from 'firebase/firestore';

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
  const barbersSnap = await getDocs(collection(db, 'barbers'));
  if (barbersSnap.empty || barbersSnap.size < 3) {
    console.log("Seeding barbers...");
    const batch = writeBatch(db);

    const tonyRef = doc(collection(db, 'barbers'));
    const emersonRef = doc(collection(db, 'barbers'));
    const tiagoRef = doc(collection(db, 'barbers'));

    const svc1Ref = doc(collection(db, 'services'));
    batch.set(svc1Ref, {
      name: 'Corte Clássico',
      durationMinutes: 45,
      price: 60,
      barberIds: [tonyRef.id, emersonRef.id, tiagoRef.id], 
      isActive: true
    });
    
    const svc2Ref = doc(collection(db, 'services'));
    batch.set(svc2Ref, {
      name: 'Barba Terapia',
      durationMinutes: 30,
      price: 40,
      barberIds: [tonyRef.id, emersonRef.id],
      isActive: true
    });

    const schedule = {
      0: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
      1: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      2: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      3: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      4: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      5: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
      6: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    };

    batch.set(tonyRef, {
      name: 'Tony Barber',
      specialties: ['Corte Clássico', 'Barba Terapia'],
      schedule,
      isActive: true,
      photoUrl: ''
    });

    batch.set(emersonRef, {
      name: 'Emerson Barber',
      specialties: ['Corte Clássico', 'Barba Terapia'],
      schedule,
      isActive: true,
      photoUrl: ''
    });

    batch.set(tiagoRef, {
      name: 'Tiago Gonçalves',
      specialties: ['Corte Clássico'],
      schedule,
      isActive: true,
      photoUrl: ''
    });

    await batch.commit();
    console.log("Seeding complete!");
  } else {
    console.log("Already seeded:", barbersSnap.size);
  }
  process.exit(0);
}

seed();
