const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const importStatement = `import { releaseProductsForAppointment, commitProductSale } from '../../lib/inventoryLogic';\n`;
if (!code.includes('inventoryLogic')) {
  code = code.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\n" + importStatement);
}

const oldUpdateStatus = `  async function updateStatus(id: string, newStatus: string) {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  }`;

const newUpdateStatus = `  async function updateStatus(id: string, newStatus: string) {
    try {
      const appt = appointments.find(a => a.id === id);
      if (appt && appt.productIds && appt.productIds.length > 0) {
        if (newStatus === 'completed') {
          await commitProductSale(appt.productIds, id, 'admin');
        } else if (newStatus === 'cancelled' || newStatus === 'no_show') {
          await releaseProductsForAppointment(appt.productIds, id, 'admin', \`Status alterado para \${newStatus}\`);
        }
      }
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  }`;

code = code.replace(oldUpdateStatus, newUpdateStatus);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', code);
