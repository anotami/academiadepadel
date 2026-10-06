// Configuración de Firebase del proyecto de la academia.
//
// 1. Crea un proyecto gratis en https://console.firebase.google.com
// 2. Dentro del proyecto: Authentication -> Sign-in method -> habilita "Correo/Contraseña".
// 3. Dentro del proyecto: Firestore Database -> crear base de datos (modo producción).
// 4. Project settings -> General -> "Tus apps" -> agrega una app web (</>) y copia aquí el objeto firebaseConfig.
//
// Ver README-PORTAL.md para la guía completa paso a paso.

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
