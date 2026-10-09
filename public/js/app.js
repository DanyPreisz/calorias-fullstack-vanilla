import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#meal-form");
const formError = document.querySelector("#form-error");
const dayInput = document.querySelector("#day");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api(`/api/meals?day=${dayInput.value || ""}`);
  if (!dayInput.value) dayInput.value = data.day;
  document.querySelector("#total").textContent = data.total;
  document.querySelector("#goal").textContent = `de ${data.goal} kcal`;
  document.querySelector("#bar").style.width = `${Math.min(100, Math.round((data.total / data.goal) * 100))}%`;
  listEl.innerHTML = "";
  if (!data.meals.length) {
    const empty = document.createElement("li");
    empty.textContent = "No hay comidas este dia.";
    listEl.append(empty);
    return;
  }
  data.meals.forEach((meal) => {
    const li = document.createElement("li");
    li.className = "item";
    const name = document.createElement("span");
    name.textContent = meal.name;
    const calories = document.createElement("strong");
    calories.textContent = `${meal.calories} kcal`;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/meals/${meal.id}`, { method: "DELETE" }); await refresh(); });
    li.append(name, calories, del);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
dayInput.addEventListener("change", refresh);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/meals", { method: "POST", body: JSON.stringify({ day: dayInput.value, name: document.querySelector("#name").value.trim(), calories: document.querySelector("#calories").value }) });
    document.querySelector("#name").value = "";
    document.querySelector("#calories").value = "";
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
