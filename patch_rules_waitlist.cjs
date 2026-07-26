const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
code = code.replace(
  "    match /waitlist_entries/{id} {\n      allow create: if true;\n      allow read, update, delete: if isAdmin();\n    }",
  "    match /waitlist_entries/{id} {\n      allow create: if true;\n      allow read: if true;\n      allow update, delete: if isAdmin();\n    }"
);
fs.writeFileSync('firestore.rules', code);
