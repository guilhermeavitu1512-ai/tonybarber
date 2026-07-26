const fs = require('fs');
let code = fs.readFileSync('src/pages/public/CancellationPage.tsx', 'utf8');

const importStr = `import { releaseProductsForAppointment } from '../../lib/inventoryLogic';\n`;
if (!code.includes('inventoryLogic')) {
  code = code.replace("import { doc, getDoc, updateDoc } from 'firebase/firestore';", "import { doc, getDoc, updateDoc } from 'firebase/firestore';\n" + importStr);
}

const oldCancel = `      const docRef = doc(db, 'appointments', id);
      await updateDoc(docRef, { status: 'cancelled' });
      setSuccess(true);
      setAppointment({ ...appointment, status: 'cancelled' });`;

const newCancel = `      const docRef = doc(db, 'appointments', id);
      if (appointment.productIds && appointment.productIds.length > 0) {
        await releaseProductsForAppointment(appointment.productIds, id, appointment.customerName, 'Cancelado pelo cliente');
      }
      await updateDoc(docRef, { status: 'cancelled' });
      setSuccess(true);
      setAppointment({ ...appointment, status: 'cancelled' });`;

code = code.replace(oldCancel, newCancel);
fs.writeFileSync('src/pages/public/CancellationPage.tsx', code);
