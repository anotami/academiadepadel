// Login/signup exclusivo para árbitros — cuenta independiente de la de
// alumnos (mismo Firebase Auth, pero usuarios/{uid}.rol = "arbitro" y sin
// los campos de alumno como edad, apoderado o disponibilidad).

// El cambio de pestañas es pura UI local: se conecta primero y sin depender
// de que Firebase cargue bien, para que la página nunca quede "muerta" si
// falla la red.
const tabs = document.querySelectorAll(".auth-tab");
const panels = {
  login: document.getElementById("panel-login"),
  signup: document.getElementById("panel-signup")
};
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    Object.values(panels).forEach((p) => p.classList.remove("active"));
    panels[tab.dataset.tab].classList.add("active");
  });
});

const formLogin = document.getElementById("form-login");
const loginMsg = document.getElementById("login-msg");
const formSignup = document.getElementById("form-signup");
const signupMsg = document.getElementById("signup-msg");

function mostrarSinConexion(el) {
  el.textContent = "No se pudo conectar (revisa tu internet) — inténtalo de nuevo en un momento.";
  el.className = "form-msg error";
}

let fb = null;
import("./firebase-app.js?v=12")
  .then((mod) => { fb = mod; })
  .catch(() => { fb = null; });

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "";
  loginMsg.className = "form-msg";
  if (!fb) { mostrarSinConexion(loginMsg); return; }
  if (fb.CONFIG_IS_PLACEHOLDER) {
    loginMsg.textContent = "El portal todavía no está conectado a una base de datos (falta configurar assets/js/firebase-config.js). Revisa README-PORTAL.md.";
    loginMsg.className = "form-msg error";
    return;
  }

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    await fb.signInWithEmailAndPassword(fb.auth, email, password);
    loginMsg.textContent = "¡Bienvenido! Entrando...";
    loginMsg.className = "form-msg ok";
    window.location.href = "arbitro.html";
  } catch (err) {
    loginMsg.textContent = "No pudimos iniciar sesión: correo o contraseña incorrectos.";
    loginMsg.className = "form-msg error";
  }
});

formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupMsg.textContent = "";
  signupMsg.className = "form-msg";
  if (!fb) { mostrarSinConexion(signupMsg); return; }
  if (fb.CONFIG_IS_PLACEHOLDER) {
    signupMsg.textContent = "El portal todavía no está conectado a una base de datos (falta configurar assets/js/firebase-config.js). Revisa README-PORTAL.md.";
    signupMsg.className = "form-msg error";
    return;
  }

  const nombre = document.getElementById("su-nombre").value.trim();
  const email = document.getElementById("su-email").value.trim();
  const telefono = document.getElementById("su-telefono").value.trim();
  const club = document.getElementById("su-club").value.trim();
  const password = document.getElementById("su-password").value;

  try {
    const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
    await fb.setDoc(fb.doc(fb.db, "usuarios", cred.user.uid), {
      rol: "arbitro",
      nombre,
      email,
      telefono,
      club,
      creadoEn: fb.serverTimestamp()
    });
    signupMsg.textContent = "¡Cuenta creada! Entrando...";
    signupMsg.className = "form-msg ok";
    window.location.href = "arbitro.html";
  } catch (err) {
    signupMsg.textContent = err.code === "auth/email-already-in-use"
      ? "Ese correo ya tiene una cuenta. Prueba iniciar sesión."
      : "No pudimos crear tu cuenta: " + (err.message || "intenta de nuevo.");
    signupMsg.className = "form-msg error";
  }
});
