import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

async function run() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@barbearia.com', 'admin123');
    console.log("Admin user created successfully:", userCredential.user.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Admin user already exists.");
    } else {
      console.error("Error creating user:", error);
    }
  }
}

run().catch(console.error).finally(() => process.exit(0));
