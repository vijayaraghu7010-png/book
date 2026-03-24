const AUTH_STORAGE_KEYS = {
  auth: "elibrary.auth",
  username: "elibrary.username",
  password: "elibrary.password",
  loginAt: "elibrary.loginAt"
};

const AUTH_QUOTES = [
  "A reader lives a thousand lives before the final page closes.",
  "Every return to a story is a quiet kind of homecoming.",
  "One beautiful chapter can reset an entire day.",
  "The best shelves hold not only books, but versions of ourselves."
];

let authBooted = false;
let authClient = null;

window.ELibraryAuth = {
  boot
};

async function boot() {
  if (authBooted) {
    return;
  }

  authBooted = true;
  initializeLoader();

  if (localStorage.getItem(AUTH_STORAGE_KEYS.auth) === "true") {
    window.location.replace("home.html");
    return;
  }

  initializeLoginPage();
  window.setTimeout(() => {
    document.body.classList.add("page-ready");
  }, 60);
}

function initializeLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (!loader) {
    return;
  }

  const hideLoader = () => {
    window.setTimeout(() => loader.classList.add("is-hidden"), 220);
  };

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }
}

function initializeLoginPage() {
  const quoteText = document.getElementById("quoteText");
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");

  if (!loginForm || !usernameInput || !passwordInput) {
    return;
  }

  quoteText.textContent = AUTH_QUOTES[Math.floor(Math.random() * AUTH_QUOTES.length)];
  usernameInput.value = localStorage.getItem(AUTH_STORAGE_KEYS.username) || "";
  passwordInput.value = localStorage.getItem(AUTH_STORAGE_KEYS.password) || "";

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayUsername = String(usernameInput.value || "").trim();
    const username = normalizeUsername(displayUsername);
    const password = passwordInput.value.trim();

    if (!username) {
      usernameInput.focus();
      return;
    }

    if (!password) {
      passwordInput.focus();
      return;
    }

    try {
      await signInOrRegister(username, password, displayUsername);

      localStorage.setItem(AUTH_STORAGE_KEYS.auth, "true");
      localStorage.setItem(AUTH_STORAGE_KEYS.username, displayUsername);
      localStorage.setItem(AUTH_STORAGE_KEYS.password, password);

      if (!localStorage.getItem(AUTH_STORAGE_KEYS.loginAt)) {
        localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, new Date().toISOString());
      }

      document.body.classList.add("page-leaving");
      window.setTimeout(() => {
        window.location.href = "home.html";
      }, 220);
    } catch (error) {
      console.error(error);

      if (isRecoverableBackendError(error)) {
        localStorage.setItem(AUTH_STORAGE_KEYS.auth, "true");
        localStorage.setItem(AUTH_STORAGE_KEYS.username, displayUsername);
        localStorage.setItem(AUTH_STORAGE_KEYS.password, password);

        if (!localStorage.getItem(AUTH_STORAGE_KEYS.loginAt)) {
          localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, new Date().toISOString());
        }

        document.body.classList.add("page-leaving");
        window.setTimeout(() => {
          window.location.href = "home.html";
        }, 220);
        return;
      }

      alert(error.message || "Unable to sign in right now.");
    }
  });
}

async function signInOrRegister(username, password, displayUsername) {
  const client = getBackendClient();
  if (!client) {
    return { mode: "local" };
  }

  const passwordHash = await createPasswordHash(password);
  const authResponse = await client.rpc("authenticate_user", {
    p_username: username,
    p_password_hash: passwordHash
  });

  if (authResponse.error && !isRecoverableBackendError(authResponse.error)) {
    throw authResponse.error;
  }

  if (authResponse.data?.success) {
    return authResponse.data;
  }

  const registerResponse = await client.rpc("register_user", {
    p_username: username,
    p_display_name: displayUsername || username,
    p_password_hash: passwordHash
  });

  if (registerResponse.error) {
    throw registerResponse.error;
  }

  if (!registerResponse.data?.success) {
    throw new Error(registerResponse.data?.message || "Unable to create account.");
  }

  return registerResponse.data;
}

function getBackendClient() {
  const config = window.E_LIBRARY_SUPABASE_CONFIG;
  const library = window.supabase;

  if (
    !config ||
    !config.enabled ||
    !config.url ||
    !config.anonKey ||
    !library ||
    typeof library.createClient !== "function"
  ) {
    return null;
  }

  if (!authClient) {
    authClient = library.createClient(config.url, config.anonKey);
  }

  return authClient;
}

async function createPasswordHash(password) {
  const encoded = new TextEncoder().encode(String(password || ""));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");
}

function isRecoverableBackendError(error) {
  const message = String(error?.message || error?.details || error || "").toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("invalid jwt") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("apikey")
  );
}
