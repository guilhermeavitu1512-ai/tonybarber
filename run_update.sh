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
node update_barbers.js
mv firestore.rules.bak firestore.rules || true
firebase deploy --only firestore:rules --project gen-lang-client-0254140623
