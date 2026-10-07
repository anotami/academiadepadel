import { DIAS, FRANJAS } from "./portal-common.js?v=12";

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
DIAS.forEach((dia) => {
  FRANJAS.forEach((franja) => {
    const id = `av-${dia}-${franja}`.replace(/\s+/g, "");
    const label = document.createElement("label");
    label.className = "avail-slot";
    label.innerHTML = `<input type="checkbox" value="${dia}|${franja}" id="${id}"> ${dia} · ${franja}`;
    const input = label.querySelector("input");
    input.addEventListener("change", () => label.classList.toggle("checked", input.checked));
    disponibilidadWrap.appendChild(label);
  });
});

// --- Mostrar datos de apoderado si el alumno es menor de edad ---
const edadInput = document.getElementById("su-edad");
const apoderadoWrap = document.getElementById("su-apoderado-wrap");
edadInput.addEventListener("input", () => {
  const esMenor = Number(edadInput.value) > 0 && Number(edadInput.value) < 18;
  apoderadoWrap.hidden = !esMenor;
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

// --- Signup (alumno) ---
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
  const edad = Number(document.getElementById("su-edad").value);
  const nivel = document.getElementById("su-nivel").value;
  const referidoPor = document.getElementById("su-referido").value.trim();
  const password = document.getElementById("su-password").value;

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

  const disponibilidad = Array.from(
    disponibilidadWrap.querySelectorAll("input:checked")
  ).map((input) => {
    const [dia, franja] = input.value.split("|");
    return { dia, franja };
  });

  try {
    const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
    await fb.setDoc(fb.doc(fb.db, "usuarios", cred.user.uid), {
      rol: "alumno",
      nombre,
      email,
      telefono,
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
      disponibilidad,
      creadoEn: fb.serverTimestamp()
    });
    signupMsg.textContent = "¡Cuenta creada! Entrando...";
    signupMsg.className = "form-msg ok";
    window.location.href = "alumno.html";
  } catch (err) {
    signupMsg.textContent = err.code === "auth/email-already-in-use"
      ? "Ese correo ya tiene una cuenta. Prueba iniciar sesión."
      : "No pudimos crear tu cuenta: " + (err.message || "intenta de nuevo.");
    signupMsg.className = "form-msg error";
  }
});
