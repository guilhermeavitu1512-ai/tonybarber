const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
code = code.replace(
  "    match /appointments/{id} {\n      allow create: if true; \n      allow read: if true;\n      allow update, delete: if isAdmin() || (isSignedIn() && resource.data.customerEmail == request.auth.token.email);\n    }",
  "    match /appointments/{id} {\n      allow create: if true; \n      allow read: if true;\n      allow update, delete: if true;\n    }"
);
fs.writeFileSync('firestore.rules', code);
