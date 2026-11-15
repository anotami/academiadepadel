# Pruebas de las reglas de Firestore

Verifican `firestore.rules` contra el emulador de Firestore (alumno, visitante anónimo, activación de cuenta y profesor).

```
cd scripts/reglas
npm init -y && npm i --legacy-peer-deps firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only firestore --project demo-gp "node reglas.test.mjs"
```

Hace falta Java. Si cambias `firestore.rules`, corre esto antes de publicarlas.
