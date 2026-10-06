import {
  auth, db, CONFIG_IS_PLACEHOLDER,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  doc, setDoc, getDoc, serverTimestamp
} from "./firebase-app.js";
import { DIAS, FRANJAS } from "./portal-common.js";

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

function configWarning(el) {
  if (CONFIG_IS_PLACEHOLDER) {
    el.textContent = "El portal todavía no está conectado a una base de datos (falta configurar assets/js/firebase-config.js). Revisa README-PORTAL.md.";
    el.className = "form-msg error";
    return true;
  }
  return false;
}

async function redirigirSegunRol(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) {
    window.location.href = "login.html";
    return;
  }
  const rol = snap.data().rol;
  window.location.href = rol === "profesor" ? "profesor.html" : "alumno.html";
}

// --- Login ---
const formLogin = document.getElementById("form-login");
const loginMsg = document.getElementById("login-msg");
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "";
  loginMsg.className = "form-msg";
  if (configWarning(loginMsg)) return;

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    loginMsg.textContent = "¡Bienvenido! Entrando...";
    loginMsg.className = "form-msg ok";
    await redirigirSegunRol(cred.user.uid);
  } catch (err) {
    loginMsg.textContent = "No pudimos iniciar sesión: correo o contraseña incorrectos.";
    loginMsg.className = "form-msg error";
  }
});

// --- Signup (alumno) ---
const formSignup = document.getElementById("form-signup");
const signupMsg = document.getElementById("signup-msg");
formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupMsg.textContent = "";
  signupMsg.className = "form-msg";
  if (configWarning(signupMsg)) return;

  const nombre = document.getElementById("su-nombre").value.trim();
  const email = document.getElementById("su-email").value.trim();
  const telefono = document.getElementById("su-telefono").value.trim();
  const edad = Number(document.getElementById("su-edad").value);
  const nivel = document.getElementById("su-nivel").value;
  const password = document.getElementById("su-password").value;

  const disponibilidad = Array.from(
    disponibilidadWrap.querySelectorAll("input:checked")
  ).map((input) => {
    const [dia, franja] = input.value.split("|");
    return { dia, franja };
  });

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      rol: "alumno",
      nombre,
      email,
      telefono,
      edad,
      nivel,
      disponibilidad,
      creadoEn: serverTimestamp()
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
