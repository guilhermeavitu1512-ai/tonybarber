import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0254140623",
  appId: "1:721701647010:web:f241c5710de9007b2f5dfb",
  apiKey: "AIzaSyC0r3tXwA0G61IYyEOOGzOQuBqqLdwpjSE",
  authDomain: "gen-lang-client-0254140623.firebaseapp.com",
  storageBucket: "gen-lang-client-0254140623.firebasestorage.app",
  messagingSenderId: "721701647010"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-5c2ed8fc-bae9-41d8-81c1-1806d0f17a5a");


export const storage = getStorage(app);