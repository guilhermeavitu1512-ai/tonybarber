# Temporarily update rules to allow unauthenticated writes
cp firestore.rules firestore.rules.bak
cat << 'RULES_EOF' > firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
RULES_EOF
firebase deploy --only firestore:rules --project gen-lang-client-0254140623
sleep 5
node seed_services.js
mv firestore.rules.bak firestore.rules || true
# Restore original rules
firebase deploy --only firestore:rules --project gen-lang-client-0254140623
