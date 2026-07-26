const fs = require('fs');
let code = fs.readFileSync('src/pages/public/BookingFlow.tsx', 'utf8');

const target = `        if (repeatVal) {
          if (user) {
            const profileSnap = await getDocs(query(collection(db, 'client_profiles'), where('authUserId', '==', user.uid)));
            if (!profileSnap.empty) {
              const profile = profileSnap.docs[0].data();
              if (profile.preferredBarberId) setSelectedBarberId(profile.preferredBarberId);
              if (profile.preferredServiceId) setSelectedService(loadedServices.find(s => s.id === profile.preferredServiceId) || null);
            }
          }
        }`;

const replacement = `        if (repeatVal) {
          let foundBarber = null;
          let foundService = null;
          
          if (repeatVal !== "true") {
             try {
                const apptDoc = await getDoc(doc(db, 'appointments', repeatVal));
                if (apptDoc.exists()) {
                   const appt = apptDoc.data();
                   foundBarber = appt.barberId;
                   foundService = loadedServices.find(s => s.id === appt.serviceId) || null;
                }
             } catch (e) {
                console.error("Error fetching repeat appointment", e);
             }
          }

          if (!foundBarber || !foundService) {
             if (user) {
               const profileSnap = await getDocs(query(collection(db, 'client_profiles'), where('authUserId', '==', user.uid)));
               if (!profileSnap.empty) {
                 const profile = profileSnap.docs[0].data();
                 if (profile.preferredBarberId) foundBarber = profile.preferredBarberId;
                 if (profile.preferredServiceId) foundService = loadedServices.find(s => s.id === profile.preferredServiceId) || null;
               }
             }
          }
          
          if (foundBarber) setSelectedBarberId(foundBarber);
          if (foundService) setSelectedService(foundService);
          
          if (foundBarber && foundService) {
             setStep(3);
          }
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/public/BookingFlow.tsx', code);
