const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const target = "      setCreatedAppointmentId(newApptRef.id);\n            \n      setStep(5);";

const replacement = `      setCreatedAppointmentId(newApptRef.id);
      
      if (user) {
         try {
            const { updateDoc } = await import('firebase/firestore');
            const profileSnap = await getDocs(query(collection(db, 'client_profiles'), where('authUserId', '==', user.uid)));
            if (!profileSnap.empty) {
               const pDoc = profileSnap.docs[0];
               await updateDoc(doc(db, 'client_profiles', pDoc.id), {
                  preferredBarberId: targetBarberId,
                  preferredServiceId: selectedService.id
               });
            }
         } catch (e) {
            console.error("Error updating preferences", e);
         }
      }

      setStep(5);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
