import { db } from './firebase';
import { doc, runTransaction, collection, addDoc } from 'firebase/firestore';

export async function reserveProductsForAppointment(productIds: string[], appointmentId: string, createdBy: string = 'system') {
  if (!productIds || productIds.length === 0) return;
  
  const productCounts = productIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  try {
    await runTransaction(db, async (transaction) => {
      const productDocs = [];
      for (const pId of Object.keys(productCounts)) {
        const pRef = doc(db, 'products', pId);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists()) {
          throw new Error(`Produto ${pId} não encontrado`);
        }
        productDocs.push({ ref: pRef, snap: pSnap, qty: productCounts[pId] });
      }

      for (const p of productDocs) {
        const data = p.snap.data();
        const newReserved = (data.stockReserved || 0) + p.qty;
        const newAvailable = data.stockPhysical - newReserved;
        
        if (newAvailable < 0) {
          throw new Error(`Estoque insuficiente para o produto ${data.name}`);
        }

        transaction.update(p.ref, {
          stockReserved: newReserved,
          stockAvailable: newAvailable
        });
      }
    });

    // Note: Inventory movements can be added outside the transaction to reduce contention,
    // or inside if we don't expect much. We'll just do it outside.
    for (const pId of Object.keys(productCounts)) {
      await addDoc(collection(db, 'inventory_movements'), {
        productId: pId,
        appointmentId,
        movementType: 'reservation',
        quantity: productCounts[pId],
        reason: 'Reserva para agendamento',
        createdBy,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erro na reserva:", error);
    throw error;
  }
}

export async function releaseProductsForAppointment(productIds: string[], appointmentId: string, createdBy: string = 'system', reason: string = 'Cancelamento') {
  if (!productIds || productIds.length === 0) return;
  
  const productCounts = productIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  try {
    await runTransaction(db, async (transaction) => {
      const productDocs = [];
      for (const pId of Object.keys(productCounts)) {
        const pRef = doc(db, 'products', pId);
        const pSnap = await transaction.get(pRef);
        if (pSnap.exists()) {
          productDocs.push({ ref: pRef, snap: pSnap, qty: productCounts[pId] });
        }
      }

      for (const p of productDocs) {
        const data = p.snap.data();
        const newReserved = Math.max(0, (data.stockReserved || 0) - p.qty);
        const newAvailable = data.stockPhysical - newReserved;

        transaction.update(p.ref, {
          stockReserved: newReserved,
          stockAvailable: newAvailable
        });
      }
    });

    for (const pId of Object.keys(productCounts)) {
      await addDoc(collection(db, 'inventory_movements'), {
        productId: pId,
        appointmentId,
        movementType: 'release',
        quantity: productCounts[pId],
        reason,
        createdBy,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erro na liberação:", error);
  }
}

export async function commitProductSale(productIds: string[], appointmentId: string, createdBy: string = 'system') {
  if (!productIds || productIds.length === 0) return;
  
  const productCounts = productIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  try {
    await runTransaction(db, async (transaction) => {
      const productDocs = [];
      for (const pId of Object.keys(productCounts)) {
        const pRef = doc(db, 'products', pId);
        const pSnap = await transaction.get(pRef);
        if (pSnap.exists()) {
          productDocs.push({ ref: pRef, snap: pSnap, qty: productCounts[pId] });
        }
      }

      for (const p of productDocs) {
        const data = p.snap.data();
        const newPhysical = Math.max(0, data.stockPhysical - p.qty);
        const newReserved = Math.max(0, (data.stockReserved || 0) - p.qty);
        const newAvailable = newPhysical - newReserved;

        transaction.update(p.ref, {
          stockPhysical: newPhysical,
          stockReserved: newReserved,
          stockAvailable: newAvailable
        });
      }
    });

    for (const pId of Object.keys(productCounts)) {
      await addDoc(collection(db, 'inventory_movements'), {
        productId: pId,
        appointmentId,
        movementType: 'sale',
        quantity: productCounts[pId],
        reason: 'Venda concluída (agendamento)',
        createdBy,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erro no commit da venda:", error);
  }
}
