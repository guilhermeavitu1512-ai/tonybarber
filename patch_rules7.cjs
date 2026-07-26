const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
code = code.replace(
  "    match /client_profiles/{id} {\n      allow read: if isAdmin() || (isSignedIn() && resource.data.authUserId == request.auth.uid);\n      allow write: if isAdmin() || (isSignedIn() && request.resource.data.authUserId == request.auth.uid);\n    }",
  "    match /client_profiles/{id} {\n      allow read: if true;\n      allow write: if true;\n    }"
);
fs.writeFileSync('firestore.rules', code);
