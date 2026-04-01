import { ACCESS_MODES, initTheme, pickRandomQuote, showToast } from "./app-core.js";
import { getSession, login } from "./auth-core.js";
import { checkBackendHealth, describeSyncState } from "./site-core.js";
import { SUPABASE_READY } from "./supabase-config.js";

initTheme();

if (getSession()) {
  window.location.replace("./home.html");
}

const quote = pickRandomQuote();
document.getElementById("quoteText").textContent = quote.text;
document.getElementById("quoteAuthor").textContent = quote.author;

const backendStatusPill = document.getElementById("backendStatusPill");
const backendStatusText = document.getElementById("backendStatusText");
const previewReadersCard = document.getElementById("previewReadersCard");
const adminHintCard = document.getElementById("adminHintCard");

function paintBackendStatus(mode) {
  const backendStatus = describeSyncState(null, mode);
  backendStatusPill.className = `sync-pill sync-${backendStatus.tone}`;
  backendStatusPill.textContent = backendStatus.label;
  backendStatusText.textContent = backendStatus.detail;
}

paintBackendStatus(SUPABASE_READY ? "configured" : "preview");

if (SUPABASE_READY) {
  previewReadersCard.classList.add("hidden");
  adminHintCard.querySelector("p").textContent = "Use your configured live credentials for testing.";
  checkBackendHealth().then((result) => {
    paintBackendStatus(result.mode);
  });
}

let accessMode = ACCESS_MODES.USER;

const usernameInput = document.getElementById("usernameInput");
const submitButton = document.getElementById("submitButton");

document.querySelectorAll("[data-access-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    accessMode = button.dataset.accessMode;
    document.querySelectorAll("[data-access-mode]").forEach((chip) => {
      chip.classList.toggle("is-active", chip === button);
    });
    usernameInput.placeholder = accessMode === ACCESS_MODES.ADMIN ? "vr" : "anaya";
    submitButton.textContent = accessMode === ACCESS_MODES.ADMIN ? "Enter admin room" : "Enter library";
  });
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "Checking access...";

  try {
    const formData = new FormData(event.currentTarget);
    await login({
      username: String(formData.get("username") || ""),
      password: String(formData.get("password") || ""),
      accessMode,
    });
    showToast("Access granted. Opening your library.", "success");
    window.setTimeout(() => window.location.replace("./home.html"), 320);
  } catch (error) {
    showToast(error.message || "Login failed.", "warning");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = accessMode === ACCESS_MODES.ADMIN ? "Enter admin room" : "Enter library";
  }
});
