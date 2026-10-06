import { auth, db, onAuthStateChanged, collection, getDocs } from "./firebase-app.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const wrap = document.getElementById("lista-pistas");
  const snap = await getDocs(collection(db, "pistas"));
  if (snap.empty) {
    wrap.innerHTML = '<p class="empty-state">Aún no hay pistas cargadas.</p>';
    return;
  }
  wrap.innerHTML = snap.docs.map((d) => {
    const p = d.data();
    return `
      <div class="court-card">
        <h3>${p.nombre}</h3>
        <p>${p.direccion}</p>
        <p class="court-meta">📞 ${p.telefono || "No publicado"} · 🕒 ${p.horario || "Por confirmar"}</p>
        ${p.notas ? `<p class="court-meta">${p.notas}</p>` : ""}
      </div>`;
  }).join("");
});
