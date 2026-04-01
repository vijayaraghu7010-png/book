import { SUPABASE_CONFIG, SUPABASE_READY } from "./supabase-config.js";
import {
  APP_NAME,
  DEFAULT_SETTINGS,
  PREVIEW_BOOKS,
  STORAGE_KEYS,
  buildReaderLink,
  escapeHtml,
  formatDate,
  formatDateTime,
  getSettings,
  pluralize,
  readJson,
  resolveCover,
  resolvePoster,
  safeStoryMarkup,
  saveSettings,
  showToast,
  syncMusic,
  writeJson,
} from "./app-core.js";

let supabaseClient = null;

function createClient() {
  if (!SUPABASE_READY || !window.supabase?.createClient) return null;
  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    db: { schema: SUPABASE_CONFIG.schema },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export function getBackendMode(session) {
  if (session?.provider === "supabase") return "cloud";
  return SUPABASE_READY ? "offline" : "preview";
}

export function describeSyncState(session, overrideMode) {
  const mode = overrideMode || getBackendMode(session);
  if (mode === "configured") {
    return {
      tone: "neutral",
      label: "Cloud configured",
      detail: "Supabase is connected in this build. Live status will update when the first request completes.",
    };
  }
  if (mode === "cloud") {
    return {
      tone: "success",
      label: "Cloud sync live",
      detail: "Shared library changes are connected to Supabase.",
    };
  }
  if (mode === "offline") {
    return {
      tone: "warning",
      label: "Cloud unavailable",
      detail: "The interface is loaded, but live syncing could not be reached.",
    };
  }
  return {
    tone: "neutral",
    label: "Preview mode",
    detail: "The app is using local preview data until Supabase is configured.",
  };
}

export async function checkBackendHealth() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, mode: "preview" };
  }
  try {
    const { error } = await client.rpc("list_books");
    if (error) {
      return { ok: false, mode: "offline", message: error.message || "Cloud request failed." };
    }
    return { ok: true, mode: "cloud" };
  } catch (error) {
    return {
      ok: false,
      mode: "offline",
      message: error.message || "Cloud request failed.",
    };
  }
}

async function rpc(name, params) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }
  const { data, error } = await client.rpc(name, params);
  if (error) {
    throw new Error(error.message || "Supabase request failed.");
  }
  return data;
}

function normalizeBook(book) {
  return {
    ...book,
    cover_url: book.cover_url || resolveCover(book),
    poster_url: book.poster_url || resolvePoster(book),
    story_html: safeStoryMarkup(book.story_html || book.content || ""),
  };
}

function normalizeBooks(books) {
  return (books || []).map(normalizeBook);
}

function getPreviewBooks() {
  const stored = readJson(STORAGE_KEYS.PREVIEW_BOOKS, null);
  return normalizeBooks(stored || PREVIEW_BOOKS);
}

function savePreviewBooks(books) {
  writeJson(STORAGE_KEYS.PREVIEW_BOOKS, books);
}

function getPreviewFavoriteMap() {
  return readJson(STORAGE_KEYS.PREVIEW_FAVORITES, {});
}

function savePreviewFavoriteMap(map) {
  writeJson(STORAGE_KEYS.PREVIEW_FAVORITES, map);
}

function getPreviewEditMap() {
  return readJson(STORAGE_KEYS.PREVIEW_EDITS, {});
}

function savePreviewEditMap(map) {
  writeJson(STORAGE_KEYS.PREVIEW_EDITS, map);
}

function getFavoriteIdsForUser(userId) {
  const favoriteMap = getPreviewFavoriteMap();
  return favoriteMap[userId] || [];
}

function getEditHistoryForUser(userId) {
  const editMap = getPreviewEditMap();
  return editMap[userId] || [];
}

function rememberBooksCache(books) {
  const cache = readJson(STORAGE_KEYS.CACHE, {});
  writeJson(STORAGE_KEYS.CACHE, { ...cache, books });
}

function getCachedBooks() {
  const cache = readJson(STORAGE_KEYS.CACHE, {});
  return normalizeBooks(cache.books || []);
}

export async function fetchBooksState(session) {
  if (session?.provider === "supabase") {
    try {
      const payload = await rpc("list_books", { p_session_token: session.session_token });
      const books = normalizeBooks(payload.books);
      rememberBooksCache(books);
      return {
        books,
        favoriteIds: payload.favorite_ids || [],
        editedBookIds: payload.edited_book_ids || [],
        syncMode: "cloud",
      };
    } catch (error) {
      return {
        books: getCachedBooks().length ? getCachedBooks() : getPreviewBooks(),
        favoriteIds: getFavoriteIdsForUser(session.user.id),
        editedBookIds: getEditHistoryForUser(session.user.id).map((entry) => entry.book_id),
        syncMode: "offline",
        error,
      };
    }
  }

  return {
    books: getPreviewBooks(),
    favoriteIds: getFavoriteIdsForUser(session?.user.id),
    editedBookIds: getEditHistoryForUser(session?.user.id).map((entry) => entry.book_id),
    syncMode: "preview",
  };
}

function buildPreviewProfile(session) {
  const books = getPreviewBooks();
  const favoriteIds = getFavoriteIdsForUser(session.user.id);
  const edits = getEditHistoryForUser(session.user.id);
  const favoriteBooks = books.filter((book) => favoriteIds.includes(book.id));
  const editedBooks = books.filter((book) => edits.some((entry) => entry.book_id === book.id));
  return {
    profile: session.user,
    favoriteBooks,
    editedBooks,
    stats: {
      favorite_count: favoriteBooks.length,
      edited_count: editedBooks.length,
      book_count: books.length,
    },
  };
}

export async function fetchProfileState(session) {
  if (session?.provider === "supabase") {
    try {
      const payload = await rpc("list_profile", { p_session_token: session.session_token });
      return {
        profile: payload.user,
        favoriteBooks: normalizeBooks(payload.favorite_books),
        editedBooks: normalizeBooks(payload.edited_books),
        stats: payload.stats,
        syncMode: "cloud",
      };
    } catch (error) {
      return { ...buildPreviewProfile(session), syncMode: "offline", error };
    }
  }

  return { ...buildPreviewProfile(session), syncMode: "preview" };
}

export async function updateFavorite(session, bookId, shouldFavorite) {
  if (session?.provider === "supabase") {
    const payload = await rpc("set_favorite", {
      p_session_token: session.session_token,
      p_book_id: bookId,
      p_is_favorite: shouldFavorite,
    });
    return payload.favorite_ids || [];
  }

  const map = getPreviewFavoriteMap();
  const current = new Set(map[session.user.id] || []);
  if (shouldFavorite) current.add(bookId);
  else current.delete(bookId);
  map[session.user.id] = [...current];
  savePreviewFavoriteMap(map);
  return map[session.user.id];
}

export async function saveBookChanges(session, payload) {
  if (session.user.role !== "admin") {
    throw new Error("Only admin accounts can edit books.");
  }

  const nextPayload = { ...payload, story_html: safeStoryMarkup(payload.story_html) };

  if (session?.provider === "supabase") {
    const response = await rpc("save_book", {
      p_session_token: session.session_token,
      p_book_id: nextPayload.id,
      p_title: nextPayload.title,
      p_cover_url: nextPayload.cover_url,
      p_poster_url: nextPayload.poster_url,
      p_excerpt: nextPayload.excerpt,
      p_genre: nextPayload.genre,
      p_reading_time: Number(nextPayload.reading_time) || 0,
      p_story_html: nextPayload.story_html,
    });
    if (!response?.success) {
      throw new Error("The book could not be saved to Supabase.");
    }
    return normalizeBook(response.book);
  }

  const books = getPreviewBooks();
  savePreviewBooks(books.map((book) => (book.id === nextPayload.id ? normalizeBook(nextPayload) : book)));

  const edits = getPreviewEditMap();
  const history = edits[session.user.id] || [];
  edits[session.user.id] = [
    { book_id: nextPayload.id, edited_at: new Date().toISOString() },
    ...history.filter((entry) => entry.book_id !== nextPayload.id),
  ];
  savePreviewEditMap(edits);
  return normalizeBook(nextPayload);
}

export function getBookById(books, bookId) {
  return books.find((book) => book.id === bookId) || books[0] || null;
}

export function rememberLastReader(bookId) {
  window.localStorage.setItem(STORAGE_KEYS.LAST_READER, bookId);
}

export function getLastReader(bookIdFallback) {
  return window.localStorage.getItem(STORAGE_KEYS.LAST_READER) || bookIdFallback;
}

function buildNavMarkup(activePage, bookId) {
  const readerLink = bookId ? buildReaderLink(bookId) : "./home.html";
  return [
    { label: "Home", href: "./home.html", icon: "⌂", active: activePage === "home" },
    { label: "Reader", href: readerLink, icon: "◫", active: activePage === "reader" },
    { label: "Profile", href: "./profile.html", icon: "◎", active: activePage === "profile" },
  ];
}

export function mountShell({ activePage, session, bookId }) {
  const sidebar = document.getElementById("sidebarMount");
  const mobileNav = document.getElementById("mobileNavMount");
  const navItems = buildNavMarkup(activePage, bookId);
  const syncState = describeSyncState(session);

  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar-panel glass-card">
        <div class="brand-lockup">
          <img src="./assets/library-mark.svg" alt="${escapeHtml(APP_NAME)} logo" class="brand-mark">
          <div>
            <p class="eyebrow">Premium E-Library</p>
            <h1>${escapeHtml(APP_NAME)}</h1>
          </div>
        </div>
        <div class="sidebar-user">
          <div class="sidebar-avatar">${escapeHtml(
            session.user.display_name?.[0] || session.user.username?.[0] || "V"
          )}</div>
          <div>
            <strong>${escapeHtml(session.user.display_name || session.user.username)}</strong>
            <p>${escapeHtml(session.user.role === "admin" ? "Admin curator" : "Reader member")}</p>
          </div>
        </div>
        <div class="sync-pill sync-${syncState.tone}" data-sync-badge>${escapeHtml(syncState.label)}</div>
        <nav class="sidebar-nav">
          ${navItems
            .map(
              (item) => `
                <a class="nav-link ${item.active ? "is-active" : ""}" href="${item.href}">
                  <span class="nav-icon" aria-hidden="true">${item.icon}</span>
                  <span>${item.label}</span>
                </a>
              `
            )
            .join("")}
        </nav>
        <button class="ghost-button wide-button" id="openSettingsButton" type="button">Atmosphere & Theme</button>
      </div>
    `;
  }

  if (mobileNav) {
    mobileNav.innerHTML = `
      <div class="mobile-nav glass-card">
        ${navItems
          .map(
            (item) => `
              <a class="mobile-nav-link ${item.active ? "is-active" : ""}" href="${item.href}">
                <span class="nav-icon" aria-hidden="true">${item.icon}</span>
                <span>${item.label}</span>
              </a>
            `
          )
          .join("")}
      </div>
    `;
  }

  mountSettingsDrawer(session);
  bindSettingsButtons();
}

function mountSettingsDrawer(session) {
  const drawer = document.getElementById("settingsDrawer");
  if (!drawer) return;
  const settings = { ...DEFAULT_SETTINGS, ...getSettings() };
  drawer.innerHTML = `
    <div class="settings-backdrop" data-close-settings></div>
    <section class="settings-panel glass-card" aria-label="Theme and music settings">
      <div class="settings-header">
        <div>
          <p class="eyebrow">Atmosphere</p>
          <h2>Theme & music</h2>
        </div>
        <button class="icon-button" type="button" data-close-settings aria-label="Close settings">✕</button>
      </div>
      <div class="settings-group">
        <p class="settings-label">Theme</p>
        <div class="choice-row">
          <button type="button" class="choice-chip ${settings.theme === "dark" ? "is-active" : ""}" data-theme-choice="dark">Dark</button>
          <button type="button" class="choice-chip ${settings.theme === "light" ? "is-active" : ""}" data-theme-choice="light">Light</button>
        </div>
      </div>
      <div class="settings-group">
        <div class="settings-toggle-row">
          <div>
            <p class="settings-label">Background music</p>
            <p class="settings-caption">A soft ambient layer generated in the browser.</p>
          </div>
          <label class="switch">
            <input type="checkbox" id="musicToggle" ${settings.musicEnabled ? "checked" : ""}>
            <span class="switch-track"></span>
          </label>
        </div>
        <label class="range-label" for="musicVolume">Volume</label>
        <input type="range" id="musicVolume" min="0" max="0.8" step="0.01" value="${settings.musicVolume}">
      </div>
      <div class="settings-group settings-footnote">
        <p>${escapeHtml(describeSyncState(session).detail)}</p>
      </div>
    </section>
  `;

  drawer.querySelectorAll("[data-close-settings]").forEach((element) => {
    element.addEventListener("click", () => drawer.classList.remove("is-open"));
  });
  drawer.querySelectorAll("[data-theme-choice]").forEach((element) => {
    element.addEventListener("click", async () => {
      const nextSettings = { ...getSettings(), theme: element.dataset.themeChoice };
      saveSettings(nextSettings);
      await syncMusic(nextSettings);
      mountSettingsDrawer(session);
      drawer.classList.add("is-open");
    });
  });

  const musicToggle = drawer.querySelector("#musicToggle");
  const musicVolume = drawer.querySelector("#musicVolume");
  const syncSettings = async () => {
    const nextSettings = {
      ...getSettings(),
      musicEnabled: musicToggle.checked,
      musicVolume: Number(musicVolume.value),
    };
    saveSettings(nextSettings);
    await syncMusic(nextSettings);
  };
  musicToggle?.addEventListener("change", syncSettings);
  musicVolume?.addEventListener("input", syncSettings);
}

function bindSettingsButtons() {
  const drawer = document.getElementById("settingsDrawer");
  [document.getElementById("openSettingsButton"), document.getElementById("openSettingsButtonInline")].forEach(
    (button) => {
      button?.addEventListener("click", () => drawer?.classList.add("is-open"));
    }
  );
}

export function paintSyncBadges(session, syncMode) {
  const state = describeSyncState(session, syncMode);
  document.querySelectorAll("[data-sync-badge]").forEach((badge) => {
    badge.className = `sync-pill sync-${state.tone}`;
    badge.textContent = state.label;
  });
  document.querySelectorAll("[data-sync-text]").forEach((element) => {
    element.textContent = state.detail;
  });
}

function bindBookCardEvents(container, options) {
  container.querySelectorAll("[data-book-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-favorite-toggle]")) return;
      const bookId = card.dataset.bookId;
      if (!bookId) return;
      window.location.href = buildReaderLink(bookId);
    });
  });

  container.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      options.onFavorite?.(button.dataset.bookId);
    });
  });
}

export function renderBookCards(container, books, favoriteIds = [], options = {}) {
  if (!container) return;
  if (!books.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No books matched this view.</h3>
        <p>Try a broader title search or explore the full shelf.</p>
      </div>
    `;
    return;
  }
  const favorites = new Set(favoriteIds);
  container.innerHTML = books
    .map(
      (book) => `
        <article class="book-card glass-card" data-book-card data-book-id="${book.id}">
          <button class="favorite-button ${favorites.has(book.id) ? "is-active" : ""}" type="button" data-favorite-toggle data-book-id="${book.id}" aria-label="Toggle favorite">
            ${favorites.has(book.id) ? "★" : "☆"}
          </button>
          <div class="book-cover-shell">
            <img class="book-cover" src="${resolveCover(book)}" alt="${escapeHtml(book.title)} cover" loading="lazy" decoding="async">
          </div>
          <div class="book-card-body">
            <div class="book-chip-row">
              <span class="meta-chip">${escapeHtml(book.genre)}</span>
              <span class="meta-chip">${Number(book.reading_time) || 0} min</span>
            </div>
            <h3>${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(book.excerpt || "A beautifully formatted story ready to read.")}</p>
            <a class="book-link" href="${buildReaderLink(book.id)}">Open Reader</a>
          </div>
        </article>
      `
    )
    .join("");
  bindBookCardEvents(container, options);
}

export function renderProfileBooks(container, books, emptyMessage) {
  if (!container) return;
  if (!books.length) {
    container.innerHTML = `<div class="empty-state compact-empty"><p>${escapeHtml(emptyMessage)}</p></div>`;
    return;
  }
  container.innerHTML = books
    .map(
      (book) => `
        <a class="profile-book-row glass-inline-card" href="${buildReaderLink(book.id)}">
          <img src="${resolveCover(book)}" alt="${escapeHtml(book.title)} cover" loading="lazy" decoding="async">
          <div>
            <strong>${escapeHtml(book.title)}</strong>
            <p>${escapeHtml(book.genre)} · ${Number(book.reading_time) || 0} min read</p>
          </div>
        </a>
      `
    )
    .join("");
}

export function hydrateSummaryCards(state) {
  const favoriteCount = state.favoriteIds?.length ?? state.stats?.favorite_count ?? 0;
  const editCount = state.editedBookIds?.length ?? state.stats?.edited_count ?? 0;
  const bookCount = state.books?.length ?? state.stats?.book_count ?? PREVIEW_BOOKS.length;
  document.querySelectorAll("[data-stat-favorites]").forEach((item) => (item.textContent = String(favoriteCount)));
  document.querySelectorAll("[data-stat-edits]").forEach((item) => (item.textContent = String(editCount)));
  document.querySelectorAll("[data-stat-books]").forEach((item) => (item.textContent = String(bookCount)));
}

export function fillUserSummary(session, profileState) {
  const profile = profileState?.profile || session.user;
  document.querySelectorAll("[data-username]").forEach((item) => {
    item.textContent = profile.display_name || profile.username;
  });
  document.querySelectorAll("[data-role-label]").forEach((item) => {
    item.textContent = profile.role === "admin" ? "Admin curator" : "Reader member";
  });
  document.querySelectorAll("[data-member-since]").forEach((item) => {
    item.textContent = `Member since ${formatDate(profile.member_since)}`;
  });
  document.querySelectorAll("[data-member-bio]").forEach((item) => {
    item.textContent = profile.bio || "A premium member of the reading room.";
  });
}

export function renderEditedMeta(container, editedBooks) {
  if (!container) return;
  container.textContent = editedBooks.length
    ? `${pluralize(editedBooks.length, "book")} edited and synced to the shared shelf.`
    : "No shared books have been edited yet.";
}

export function updateStatusText(element, session, syncMode) {
  if (element) {
    element.textContent = describeSyncState(session, syncMode).label;
  }
}

export function serializeBookForForm(book) {
  return {
    id: book.id,
    title: book.title || "",
    excerpt: book.excerpt || "",
    genre: book.genre || "",
    cover_url: book.cover_url || "",
    poster_url: book.poster_url || "",
    reading_time: Number(book.reading_time) || 0,
    story_html: book.story_html || "",
  };
}

export function editorMarkup(book) {
  return `
    <div class="sheet-backdrop" data-close-editor></div>
    <section class="editor-sheet glass-card">
      <div class="settings-header">
        <div>
          <p class="eyebrow">Admin tools</p>
          <h2>Edit story</h2>
        </div>
        <button class="icon-button" type="button" data-close-editor aria-label="Close editor">✕</button>
      </div>
      <form id="editorForm" class="editor-form">
        <label>Title<input name="title" type="text" value="${escapeHtml(book.title)}" required></label>
        <label>Excerpt<textarea name="excerpt" rows="3">${escapeHtml(book.excerpt || "")}</textarea></label>
        <div class="editor-grid">
          <label>Genre<input name="genre" type="text" value="${escapeHtml(book.genre || "")}"></label>
          <label>Reading time<input name="reading_time" type="number" min="1" value="${Number(book.reading_time) || 0}"></label>
        </div>
        <label>Cover image URL<input name="cover_url" type="url" value="${escapeHtml(book.cover_url || "")}" placeholder="https://example.com/cover.jpg"></label>
        <label>Reader poster URL<input name="poster_url" type="url" value="${escapeHtml(book.poster_url || "")}" placeholder="https://example.com/poster.jpg"></label>
        <div class="editor-toolbar">
          <input id="inlineImageUrl" type="url" placeholder="https://example.com/scene.jpg">
          <input id="inlineImageCaption" type="text" placeholder="Caption">
          <button type="button" class="secondary-button" id="insertImageButton">Insert image block</button>
        </div>
        <label>Story content<textarea name="story_html" id="storyEditorField" rows="16">${escapeHtml(book.story_html || "")}</textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" data-close-editor>Cancel</button>
          <button type="submit" class="primary-button">Save changes</button>
        </div>
      </form>
    </section>
  `;
}

export function readerMenuMarkup({ isFavorite, isAdmin }) {
  return `
    <div class="sheet-backdrop" data-close-menu></div>
    <section class="menu-sheet glass-card">
      <button class="menu-action" type="button" data-menu-action="favorite">${isFavorite ? "Remove from favorites" : "Add to favorites"}</button>
      <button class="menu-action" type="button" data-menu-action="profile">Open profile</button>
      <button class="menu-action" type="button" id="openSettingsButtonInline">Theme & music</button>
      ${isAdmin ? '<button class="menu-action menu-action-accent" type="button" data-menu-action="edit">Edit story</button>' : ""}
      <button class="menu-action" type="button" data-close-menu>Close</button>
    </section>
  `;
}

export function decorateProfileMetrics(state, session) {
  const stats = state.stats || {
    favorite_count: state.favoriteBooks.length,
    edited_count: state.editedBooks.length,
    book_count: PREVIEW_BOOKS.length,
  };
  document.querySelectorAll("[data-profile-favorites]").forEach((node) => (node.textContent = String(stats.favorite_count)));
  document.querySelectorAll("[data-profile-edits]").forEach((node) => (node.textContent = String(stats.edited_count)));
  document.querySelectorAll("[data-profile-books]").forEach((node) => (node.textContent = String(stats.book_count)));
  document.querySelectorAll("[data-last-sync]").forEach((node) => {
    node.textContent = describeSyncState(session, state.syncMode).detail;
  });
}

export function formatEditedStamp(value) {
  return formatDateTime(value);
}

export { showToast };
