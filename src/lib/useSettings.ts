import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BARBERSHOP_LOCATION as DEFAULT_LOCATION } from './config';

export function useSettings() {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'location'));
        if (snap.exists()) {
          setLocation(snap.data() as typeof DEFAULT_LOCATION);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { location, loading };
}
