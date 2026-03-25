const AUTH_STORAGE_KEYS = {
  auth: "elibrary.auth",
  username: "elibrary.username",
  password: "elibrary.password",
  loginAt: "elibrary.loginAt",
  role: "elibrary.role",
  accessMode: "elibrary.accessMode"
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
  sanitizeLegacyAuthState();
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
  const accessModeInput = document.getElementById("accessModeInput");
  const accessEyebrow = document.getElementById("accessEyebrow");
  const accessDescription = document.getElementById("accessDescription");
  const accessButtons = document.querySelectorAll("[data-access-mode]");

  if (!loginForm || !usernameInput || !passwordInput || !accessModeInput || !accessEyebrow || !accessDescription) {
    return;
  }

  if (quoteText) {
    quoteText.textContent = AUTH_QUOTES[Math.floor(Math.random() * AUTH_QUOTES.length)];
  }
  usernameInput.value = localStorage.getItem(AUTH_STORAGE_KEYS.username) || "";
  passwordInput.value = localStorage.getItem(AUTH_STORAGE_KEYS.password) || "";
  setAccessMode(localStorage.getItem(AUTH_STORAGE_KEYS.accessMode) || "user");

  accessButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAccessMode(button.dataset.accessMode || "user");
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayUsername = String(usernameInput.value || "").trim();
    const username = normalizeUsername(displayUsername);
    const password = passwordInput.value.trim();
    const accessMode = accessModeInput.value === "admin" ? "admin" : "user";

    if (!username) {
      usernameInput.focus();
      return;
    }

    if (!password) {
      passwordInput.focus();
      return;
    }

    try {
      const authResult = await signInOrRegister(username, password, displayUsername, accessMode);

      localStorage.setItem(AUTH_STORAGE_KEYS.auth, "true");
      localStorage.setItem(AUTH_STORAGE_KEYS.username, displayUsername);
      localStorage.setItem(AUTH_STORAGE_KEYS.password, password);
      localStorage.setItem(AUTH_STORAGE_KEYS.role, authResult.role || "user");
      localStorage.setItem(AUTH_STORAGE_KEYS.accessMode, accessMode);

      if (!localStorage.getItem(AUTH_STORAGE_KEYS.loginAt)) {
        localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, new Date().toISOString());
      }

      document.body.classList.add("page-leaving");
      window.setTimeout(() => {
        window.location.href = "home.html";
      }, 220);
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to sign in right now.");
    }
  });

  function setAccessMode(mode) {
    const nextMode = mode === "admin" ? "admin" : "user";
    accessModeInput.value = nextMode;
    localStorage.setItem(AUTH_STORAGE_KEYS.accessMode, nextMode);

    accessButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.accessMode === nextMode);
    });

    accessEyebrow.textContent = nextMode === "admin" ? "Admin Access" : "User Access";
    accessDescription.textContent = nextMode === "admin"
      ? "Sign in as the admin to edit titles, stories, posters, and shared content for every reader."
      : "Sign in as a user to read stories, browse favorites, and explore the library in read-only mode.";
  }
}

function sanitizeLegacyAuthState() {
  localStorage.removeItem("elibrary.token");

  if (localStorage.getItem(AUTH_STORAGE_KEYS.auth) !== "true") {
    return;
  }

  const storedUsername = localStorage.getItem(AUTH_STORAGE_KEYS.username);
  if (!storedUsername) {
    localStorage.removeItem(AUTH_STORAGE_KEYS.auth);
    localStorage.removeItem(AUTH_STORAGE_KEYS.role);
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessMode);
  }
}

async function signInOrRegister(username, password, displayUsername, accessMode) {
  const client = await waitForBackendClient();
  if (!client) {
    throw new Error("Login service is still loading on this device. Please wait a moment and try again.");
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
    if (accessMode === "admin" && authResponse.data.role !== "admin") {
      throw new Error("This account does not have admin access.");
    }
    return authResponse.data;
  }

  if (authResponse.error && isRecoverableBackendError(authResponse.error)) {
    throw authResponse.error;
  }

  if (accessMode === "admin") {
    throw new Error("Invalid admin username or password.");
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

async function waitForBackendClient(timeoutMs = 7000, intervalMs = 160) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const client = getBackendClient();
    if (client) {
      return client;
    }

    await delay(intervalMs);
  }

  return null;
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
