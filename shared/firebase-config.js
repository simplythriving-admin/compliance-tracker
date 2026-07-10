/*
  PEGA AQUÍ tu configuración de Firebase (la encuentras en:
  Firebase Console > Configuración del proyecto > Tus apps > SDK setup and configuration).

  Sigue las INSTRUCCIONES.md para crear el proyecto gratuito paso a paso.
*/

const firebaseConfig = {
  apiKey: "AIzaSyDwneAA5IRDgtIf0TaOEb3hmRbzXXa_EJs",
  authDomain: "medicaid-compliance-audit.firebaseapp.com",
  projectId: "medicaid-compliance-audit",
  storageBucket: "medicaid-compliance-audit.firebasestorage.app",
  messagingSenderId: "99985141516",
  appId: "1:99985141516:web:557de3843d786e0ec52329",
};

// Email autorizado para editar (debe coincidir con la regla de seguridad en Firestore)
const ADMIN_EMAIL = "admin-st@simplythriving.com";
