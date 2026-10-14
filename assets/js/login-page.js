import { construirGrillaDisponibilidad } from "./portal-common.js?v=14";

// El cambio de pestañas, la grilla de disponibilidad y el campo de
// apoderado son pura UI local: se conectan primero y sin depender de que
// Firebase cargue bien, para que la página nunca quede "muerta" si falla
// la red (el login en sí sí necesita Firebase, pero el resto no debería).
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

// --- Grilla de disponibilidad para el signup ---
const disponibilidadWrap = document.getElementById("su-disponibilidad");
const disponibilidadGrid = construirGrillaDisponibilidad(disponibilidadWrap);
document.getElementById("su-disp-todo")?.addEventListener("click", () => disponibilidadGrid.seleccionarTodo(true));
document.getElementById("su-disp-ninguno")?.addEventListener("click", () => disponibilidadGrid.seleccionarTodo(false));

// --- Mostrar datos de apoderado si el alumno es menor de edad ---
const edadInput = document.getElementById("su-edad");
const apoderadoWrap = document.getElementById("su-apoderado-wrap");
edadInput.addEventListener("input", () => {
  const esMenor = Number(edadInput.value) > 0 && Number(edadInput.value) < 18;
  apoderadoWrap.hidden = !esMenor;
});

// --- Rol en el signup: alumno (todos los campos) o profesor (datos mínimos;
// el resto —especialidad, costo/hora, bio, disponibilidad— se completa luego
// en "Mis datos" dentro de profesor.html) ---
let rolSignup = "alumno";
const roleButtons = document.querySelectorAll("#su-role-select .role-pill");
const camposSoloAlumno = [
  document.getElementById("su-campo-edad"),
  document.getElementById("su-campo-nivel"),
  document.getElementById("su-campo-referido"),
  document.getElementById("su-disponibilidad-wrap")
];
const profesorHint = document.getElementById("su-profesor-hint");
roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    rolSignup = btn.dataset.role;
    roleButtons.forEach((b) => b.classList.toggle("active", b === btn));
    const esAlumno = rolSignup === "alumno";
    camposSoloAlumno.forEach((campo) => { campo.hidden = !esAlumno; });
    edadInput.required = esAlumno;
    profesorHint.hidden = esAlumno;
    if (!esAlumno) apoderadoWrap.hidden = true;
  });
});

const formLogin = document.getElementById("form-login");
const loginMsg = document.getElementById("login-msg");
const formSignup = document.getElementById("form-signup");
const signupMsg = document.getElementById("signup-msg");

// --- Validación visible de la contraseña (mínimo 8 caracteres) ---
const passwordInput = document.getElementById("su-password");
const passwordHint = document.getElementById("su-password-hint");
passwordInput.addEventListener("input", () => {
  const ok = passwordInput.value.length >= 8;
  passwordHint.textContent = ok ? "✓ Mínimo 8 caracteres" : `Mínimo 8 caracteres (llevas ${passwordInput.value.length})`;
  passwordHint.className = "field-hint" + (passwordInput.value.length === 0 ? "" : ok ? " valido" : " invalido");
});

function mostrarSinConexion(el) {
  el.textContent = "No se pudo conectar (revisa tu internet) — inténtalo de nuevo en un momento.";
  el.className = "form-msg error";
}

let fb = null;
import("./firebase-app.js?v=15")
  .then((mod) => { fb = mod; })
  .catch(() => { fb = null; });

async function redirigirSegunRol(uid) {
  const snap = await fb.getDoc(fb.doc(fb.db, "usuarios", uid));
  if (!snap.exists()) {
    window.location.href = "login.html";
    return;
  }
  const rol = snap.data().rol;
  if (rol === "profesor") window.location.href = "profesor.html";
  else if (rol === "arbitro") window.location.href = "arbitro.html";
  else window.location.href = "alumno.html";
}

// --- Login ---
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
    const cred = await fb.signInWithEmailAndPassword(fb.auth, email, password);
    loginMsg.textContent = "¡Bienvenido! Entrando...";
    loginMsg.className = "form-msg ok";
    await redirigirSegunRol(cred.user.uid);
  } catch (err) {
    loginMsg.textContent = "No pudimos iniciar sesión: correo o contraseña incorrectos.";
    loginMsg.className = "form-msg error";
  }
});

// --- ¿Olvidaste tu contraseña? ---
document.getElementById("btn-olvide-clave").addEventListener("click", async () => {
  loginMsg.className = "form-msg";
  if (!fb) { mostrarSinConexion(loginMsg); return; }
  if (fb.CONFIG_IS_PLACEHOLDER) {
    loginMsg.textContent = "El portal todavía no está conectado a una base de datos.";
    loginMsg.className = "form-msg error";
    return;
  }
  const email = document.getElementById("login-email").value.trim();
  if (!email) {
    loginMsg.textContent = "Escribe tu correo arriba y vuelve a tocar \"¿Olvidaste tu contraseña?\".";
    loginMsg.className = "form-msg error";
    return;
  }
  try {
    await fb.sendPasswordResetEmail(fb.auth, email);
    loginMsg.textContent = `Te enviamos un correo a ${email} con un link para crear una contraseña nueva. Revisa también spam.`;
    loginMsg.className = "form-msg ok";
  } catch (err) {
    // No confirmamos ni negamos si el correo existe, para no filtrar esa info.
    loginMsg.textContent = `Si ${email} tiene una cuenta, te llegará un correo para restablecer la contraseña. Revisa también spam.`;
    loginMsg.className = "form-msg ok";
  }
});

// --- Signup (alumno o profesor) ---
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
  const password = document.getElementById("su-password").value;

  let datosRol = {};
  if (rolSignup === "alumno") {
    const edad = Number(document.getElementById("su-edad").value);
    const nivel = document.getElementById("su-nivel").value;
    const referidoPor = document.getElementById("su-referido").value.trim();

    if (edad < 18) {
      const nombreApoderado = document.getElementById("su-apoderado-nombre").value.trim();
      const telefonoApoderado = document.getElementById("su-apoderado-telefono").value.trim();
      const autoriza = document.getElementById("su-apoderado-autoriza").checked;
      if (!nombreApoderado || !telefonoApoderado || !autoriza) {
        signupMsg.textContent = "Al ser menor de edad, completa los datos del apoderado y marca la autorización.";
        signupMsg.className = "form-msg error";
        return;
      }
    }

    const disponibilidad = disponibilidadGrid.obtenerSeleccion();

    datosRol = {
      edad,
      nivel,
      referidoPor,
      ...(edad < 18
        ? {
            apoderado: {
              nombre: document.getElementById("su-apoderado-nombre").value.trim(),
              telefono: document.getElementById("su-apoderado-telefono").value.trim(),
              autorizo: true
            }
          }
        : {}),
      disponibilidad
    };
  }

  try {
    const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
    await fb.setDoc(fb.doc(fb.db, "usuarios", cred.user.uid), {
      rol: rolSignup,
      nombre,
      email,
      telefono,
      ...datosRol,
      creadoEn: fb.serverTimestamp()
    });
    try { await fb.sendEmailVerification(cred.user); } catch (e) { /* no bloquea el alta si falla el envío */ }
    signupMsg.textContent = "¡Cuenta creada! Te enviamos un correo para confirmar tu email. Entrando...";
    signupMsg.className = "form-msg ok";
    window.location.href = rolSignup === "profesor" ? "profesor.html" : "alumno.html";
  } catch (err) {
    // Mensaje genérico a propósito: no decimos si el correo ya tenía cuenta
    // ni mostramos el error crudo de Firebase, para no filtrar esa info a
    // quien esté probando direcciones de correo al azar.
    signupMsg.textContent = "No pudimos crear tu cuenta con esos datos. Revisa el correo y la contraseña, o inicia sesión si ya tienes una cuenta.";
    signupMsg.className = "form-msg error";
  }
});
