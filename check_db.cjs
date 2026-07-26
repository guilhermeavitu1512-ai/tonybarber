const admin = require("firebase-admin");
const serviceAccount = require("./firebase-applet-config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const services = await db.collection("services").get();
  console.log("Services:", services.docs.map(d => ({id: d.id, name: d.data().name})));
  
  const products = await db.collection("products").get();
  console.log("Products:", products.docs.map(d => ({id: d.id, name: d.data().name})));
}

run().catch(console.error).finally(() => process.exit(0));
