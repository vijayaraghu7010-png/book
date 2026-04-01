import { ACCESS_MODES, PREVIEW_USERS, STORAGE_KEYS, readJson, writeJson } from "./app-core.js";
import { getSupabaseClient } from "./site-core.js";
import { SUPABASE_READY } from "./supabase-config.js";

export function getSession() {
  return readJson(STORAGE_KEYS.SESSION, null);
}

export function isAdmin(session = getSession()) {
  return session?.user?.role === "admin";
}

export function persistSession(session) {
  writeJson(STORAGE_KEYS.SESSION, session);
  return session;
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function buildPreviewSession(user) {
  return {
    provider: "preview",
    access_mode: user.role,
    session_token: `preview-${user.id}`,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      member_since: user.member_since,
      bio: user.bio,
    },
  };
}

function loginPreview({ username, password, accessMode }) {
  const user = PREVIEW_USERS.find(
    (entry) => entry.username.toLowerCase() === username.toLowerCase().trim() && entry.password === password
  );
  if (!user) {
    throw new Error("Incorrect username or password.");
  }
  if (accessMode === ACCESS_MODES.ADMIN && user.role !== "admin") {
    throw new Error("That account does not have admin access.");
  }
  if (accessMode === ACCESS_MODES.USER && user.role === "admin") {
    throw new Error("Use Admin Login for this account.");
  }
  return persistSession(buildPreviewSession(user));
}

export async function login({ username, password, accessMode }) {
  const client = getSupabaseClient();
  if (!client) {
    return loginPreview({ username, password, accessMode });
  }

  try {
    const { data, error } = await client.rpc("app_login", {
      p_username: username.trim(),
      p_password: password,
      p_access_mode: accessMode,
    });
    if (error) {
      throw new Error(error.message || "Login failed.");
    }
    if (!data?.success) {
      throw new Error(data?.message || "Login failed.");
    }
    return persistSession({
      provider: "supabase",
      access_mode: accessMode,
      session_token: data.session_token,
      user: data.user,
    });
  } catch (error) {
    const lowered = (error.message || "").toLowerCase();
    if (
      !SUPABASE_READY &&
      (lowered.includes("failed to fetch") || lowered.includes("network") || lowered.includes("timed out"))
    ) {
      return loginPreview({ username, password, accessMode });
    }
    if (lowered.includes("failed to fetch") || lowered.includes("network") || lowered.includes("timed out")) {
      throw new Error("Cloud login is unavailable right now. Please check Supabase and try again.");
    }
    throw error;
  }
}

export async function logout() {
  const session = getSession();
  const client = getSupabaseClient();
  if (session?.provider === "supabase" && client) {
    try {
      await client.rpc("app_logout", { p_session_token: session.session_token });
    } catch (error) {
      // Ignore logout transport issues; local session should still clear.
    }
  }
  clearSession();
}

export function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.replace("./index.html");
    return null;
  }
  return session;
}
