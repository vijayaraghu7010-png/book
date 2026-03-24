const STORAGE_KEYS = {
  auth: "elibrary.auth",
  username: "elibrary.username",
  password: "elibrary.password",
  loginAt: "elibrary.loginAt",
  favorites: "elibrary.favorites",
  bookOverrides: "elibrary.bookOverrides",
  currentBook: "elibrary.currentBook",
  posterMigrations: "elibrary.posterMigrations"
};

const loginQuotes = [
  "A reader lives a thousand lives before the last page turns.",
  "Every login is an invitation to begin another beautiful chapter.",
  "Stories grow larger when you return to them with fresh eyes.",
  "Some evenings call for silence, a lamp glow, and one unforgettable book."
];

const backendState = {
  initialized: false,
  enabled: false,
  loading: false,
  error: null,
  books: {},
  channel: null,
  client: null
};

let appBooted = false;

const libraryBooks = [
  {
    id: "midnight-archive",
    title: "Uthirthal",
    image: "assets/midnight-archive-poster.jpeg",
    content: `By the time the city clocks reached midnight, the archive beneath Alder Street had already awakened. Cabinets clicked open on their own, drawers breathed out paper-cool air, and the brass lamps above the long reading tables flickered with a patience that felt almost human.

Mira descended the spiral staircase with one key in her hand and a question she had carried for years. Her grandfather had spoken once, softly, of a room where unfinished stories waited for someone brave enough to complete them. He called it a mercy and a burden in the same breath.

The room she found was wider than the street above it. Shelves curved like rings in a tree, each lined with thin black volumes stamped only with dates. When she opened the first one, the pages were blank except for a single sentence at the center: The city remembers what its people refuse to name.

She read it aloud, and the archive answered. Dust lifted, pages rustled, and the farthest lamp burned gold. Somewhere among those shelves, her own story had already been filed, waiting for her to decide whether she would read it or rewrite it.`
  },
  {
    id: "lanterns-over-kyoto",
    title: "Lanterns Over Kyoto",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
    content: `In the oldest district of Kyoto, there was a lane that appeared only after rain. Lanterns gathered there in perfect rows, each one carrying a memory that belonged to someone still living. No map recorded the place, but Aya found it anyway on the night she decided she could not keep grieving in the same shape forever.

An elderly lantern maker waited beneath the eaves of a cedar workshop, his sleeves rolled and his fingers glowing with paste and light. He asked Aya for no money. He asked only for a memory she was willing to see clearly.

She offered the sound of her mother's laughter in the kitchen during summer storms. The lantern maker folded the memory into paper, sealed it with crimson thread, and hung it above the lane. Instantly the rain softened, and the lantern glowed like a small second moon.

As Aya walked beneath the warm light, she understood that remembering was not the opposite of moving on. Sometimes it was the bridge that made moving on possible.`
  },
  {
    id: "sandglass-republic",
    title: "Sandglass Republic",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    content: `The republic was built inside a desert clock. At sunrise, its towers cast shadows in perfect angles, and by noon the streets themselves shifted with the turning of hidden gears. Citizens wore silver sand timers at their wrists so they would never forget that every law in their nation expired at dusk unless renewed by consent.

Tarin, the youngest cartographer in the council, was tasked with mapping a district that appeared only when time ran low. Everyone called it the Last Quarter, though no one admitted to having seen its center and returned unchanged.

He entered at evening with a compass, a flask, and a stubborn belief that systems could be understood if observed carefully enough. Instead he found children drawing future monuments in the dust and elders speaking of past events that had not yet happened.

When the great bell rang, Tarin realized the district was not broken. It was honest. It showed time the way people actually lived it: braided from memory, fear, hope, and the small defiant acts that made tomorrow imaginable.`
  },
  {
    id: "clockmakers-orchard",
    title: "The Clockmaker's Orchard",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
    content: `At the edge of a quiet valley stood an orchard where clocks grew instead of fruit. They hung from branches in brass shells and wooden frames, ticking softly among the leaves. Villagers came at dawn to listen, because each tree kept a different kind of time.

Elias inherited the orchard from an aunt he barely remembered and arrived expecting ruin. Instead he found rows of patient trees and a handwritten ledger that listed repairs not for machines, but for moments. Mend the hour before the apology. Restore the minute after the promise.

With every clock he polished, the valley shifted. Neighbors spoke more gently. Long-shuttered shops reopened. Even the river seemed less hurried, as if it had been granted permission to travel at its own pace.

Then Elias discovered one tree untouched and wrapped in black cloth. Beneath it hung a clock with no hands at all. In the ledger beside its entry, his aunt had written only this: Some moments are not meant to be measured. Only lived.`
  },
  {
    id: "aurora-station",
    title: "Beneath Aurora Station",
    image: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?auto=format&fit=crop&w=1200&q=80",
    content: `Aurora Station floated above the polar sea like a shard of blue fire. Scientists watched the sky there, but the station's oldest crew member insisted the real mystery was not above them. It was below, where lights moved beneath the ice in patterns too deliberate to be random.

Nila joined the winter rotation hoping the isolation would quiet the noise in her head. Instead the silence sharpened everything. She heard the low hum of the station walls, the groan of frozen currents, and, one night, a melody rising through the floor like a remembered lullaby.

Following it led her to an observation chamber long sealed from use. Beyond the glass, beneath thirty feet of ice, shapes moved in spirals of green and silver. They were not creatures, exactly. They looked more like messages written in light.

When the station lost power during a storm, Nila carried the melody back to the control room and sang it into the dark. One by one, the emergency systems blinked awake, as if the sea itself had decided she deserved an answer.`
  },
  {
    id: "saltwind-letters",
    title: "The Saltwind Letters",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    content: `On the coast of Marrow Bay, letters sometimes washed ashore in sealed glass bottles, though no ship nearby had ever reported throwing them. The ink never ran, and the paper always smelled faintly of cedar and storm rain.

Jonah, who repaired fishing nets by day and avoided his own feelings by habit, found the first bottle after a week of relentless tide. Inside was a letter addressed to him in handwriting he recognized immediately. It belonged to Clara, who had left the town seven years earlier with a promise to return before the autumn whales.

The letter did not explain where she had gone. Instead it described places Jonah had not yet visited, choices he had not yet made, and the exact sentence he would say to the baker's daughter two winters from now.

He should have dismissed it. But every bottle arrived exactly when his courage began to thin, and every page nudged him toward a life larger than routine. By the time the final letter surfaced, Jonah understood that some messages are less about the sender than the version of yourself they ask you to become.`
  },
  {
    id: "hollow-peak",
    title: "Ember at Hollow Peak",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    content: `The mountain village of Hollow Peak survived each winter by guarding a single ember. Carried in an iron lantern and never allowed to die, it was said to have burned since the first settlers crossed the ridge with frost in their lungs and nothing but stubbornness in their pockets.

When the lantern vanished during the coldest night in a generation, suspicion moved through the village faster than the wind. Lysa, apprentice to the firekeeper, was blamed first because she had argued that tradition was not the same as truth.

Rather than defend herself, she went after the ember alone. Tracks led past the watch towers, through cedar snowfields, and into a cave where warm air pulsed from the stone itself. At the center she found not a thief, but a child feeding the lantern with dry moss and whispered songs.

The ember had not been stolen. It had been called. And when Lysa carried that knowledge home, the village learned that some sacred things endure not because they are locked away, but because they are shared.`
  },
  {
    id: "paper-rain",
    title: "City of Paper Rain",
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    content: `Every spring, the capital prepared for paper rain. Clouds thickened over the rooftops, the wind turned sweet with starch and ink, and by evening thousands of folded pages drifted from the sky. Some landed blank. Others carried poems, sketches, recipes, and confessions no one admitted to writing.

Iven worked as a municipal sorter, cataloging whatever the gutters delivered. It was careful work, monotonous enough to hide inside. Then one morning he found a page with his own signature at the bottom and no memory of having written it.

The message was simple: Meet me where the river forgets its name. Beneath it, a map of alleyways shifted slightly whenever he looked away.

Following it led him beyond the city's official edges to neighborhoods erased from record but alive with studios, rooftop gardens, and people who had learned to live outside the categories they were assigned. When the next paper rain came, Iven did not go back to sorting. He stepped into the street, raised both hands, and finally began to receive what the sky had been sending him for years.`
  },
  {
    id: "last-cartographer",
    title: "The Last Cartographer",
    image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80",
    content: `Maps used to be drawn on paper, but by the end of the century they were grown in glass. Surveyors fed light, weather, and memory into transparent tablets that bloomed with landscapes more accurate than the world itself. Then the north began to move.

Valen was the last cartographer licensed to chart unstable terrain. He traveled with a case of dormant maps and a machine that translated birdsong into coordinates. Everyone believed the northern drift was a geological event. Valen believed it was a decision.

For weeks he followed valleys that folded overnight and cliffs that relocated by dawn. At the edge of the ice fields, he found markers placed by earlier expeditions, all bent inward like compass needles toward one invisible center.

There he uncovered a plain untouched by satellite or memory, a place the world had hidden from being used. Valen closed his instruments and sat in silence, understanding for the first time that the highest form of mapping was sometimes restraint.`
  },
  {
    id: "sky-of-tides",
    title: "A Sky Made of Tides",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
    content: `In the harbor city of Olen, the tides had begun to rise into the sky. Fishermen looked up to see waves suspended above chimneys, and children learned to predict weather by watching clouds ripple with foam. No scholar could explain it, though every explanation sounded smaller than the wonder itself.

Tessa repaired sails in a workshop painted the color of old shells. She had spent years refusing adventure on practical grounds, which is another way of saying she was frightened of wanting more than she could keep.

When a ship arrived with masts designed for upward oceans, its captain asked Tessa to help rig canvas for a voyage no harbor records acknowledged. Against her better judgment, she said yes. Together they climbed above the rooftops into bright floating currents where silver fish flashed between stormlight and stars.

By morning, Olen looked different from above: less like a place trapping its people and more like one teaching them how to leave well. Tessa laughed into the wind and let the impossible carry her farther than caution ever had.`
  }
];

const legacyBookImages = {
  "midnight-archive": [
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80"
  ]
};

const pinnedBookPosters = {
  "midnight-archive": "assets/midnight-archive-poster.jpeg"
};

const legacyBookTitles = {
  "midnight-archive": [
    "The Midnight Archive"
  ]
};

const pinnedBookTitles = {
  "midnight-archive": "Uthirthal"
};

window.ELibraryApp = {
  boot
};

function boot() {
  if (appBooted) {
    return;
  }

  appBooted = true;
  initializeLoader();
  runPinnedBookMigrations();
  const page = document.body.dataset.page || "";

  if (!handleRouteAccess(page)) {
    return;
  }

  initializePageTransitions();
  initializeLogoutActions();
  populateUserIdentity();

  switch (page) {
    case "login":
      initializeLoginPage();
      break;
    case "home":
      initializeAppShell();
      initializeHomePage();
      break;
    case "reader":
      initializeReaderPage();
      break;
    case "profile":
      initializeAppShell();
      initializeProfilePage();
      break;
    default:
      break;
  }

  if (page !== "login") {
    initializeCloudSync();
  }

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
    window.setTimeout(() => loader.classList.add("is-hidden"), 320);
  };

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }
}

function handleRouteAccess(page) {
  const authenticated = isAuthenticated();

  if (page === "login") {
    if (authenticated) {
      window.location.replace("home.html");
      return false;
    }

    return true;
  }

  if (!authenticated) {
    window.location.replace("index.html");
    return false;
  }

  return true;
}

function initializePageTransitions() {
  const links = document.querySelectorAll("a[data-route]");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      event.preventDefault();
      navigateTo(href);
    });
  });
}

function initializeLogoutActions() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.auth);
      localStorage.removeItem(STORAGE_KEYS.currentBook);
      navigateTo("index.html");
    });
  });
}

function navigateTo(url) {
  document.body.classList.add("page-leaving");
  window.setTimeout(() => {
    window.location.href = url;
  }, 240);
}

function initializeLoginPage() {
  const quoteText = document.getElementById("quoteText");
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const storedUsername = localStorage.getItem(STORAGE_KEYS.username) || "";
  const storedPassword = localStorage.getItem(STORAGE_KEYS.password) || "";

  if (quoteText) {
    quoteText.textContent = loginQuotes[Math.floor(Math.random() * loginQuotes.length)];
  }

  if (!loginForm || !usernameInput || !passwordInput) {
    return;
  }

  usernameInput.value = storedUsername;
  passwordInput.value = storedPassword;

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username) {
      usernameInput.focus();
      return;
    }

    if (!password) {
      passwordInput.focus();
      return;
    }

    localStorage.setItem(STORAGE_KEYS.auth, "true");
    localStorage.setItem(STORAGE_KEYS.username, username);
    localStorage.setItem(STORAGE_KEYS.password, password);

    if (!localStorage.getItem(STORAGE_KEYS.loginAt)) {
      localStorage.setItem(STORAGE_KEYS.loginAt, new Date().toISOString());
    }

    navigateTo("home.html");
  });
}

function initializeAppShell() {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (!sidebar || !sidebarToggle) {
    return;
  }

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    document.body.classList.remove("sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", "false");
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove("visible");
    }
  };

  const openSidebar = () => {
    sidebar.classList.add("open");
    document.body.classList.add("sidebar-open");
    sidebarToggle.setAttribute("aria-expanded", "true");
    if (sidebarOverlay) {
      sidebarOverlay.classList.add("visible");
    }
  };

  sidebarToggle.addEventListener("click", () => {
    if (window.innerWidth > 960) {
      return;
    }

    if (sidebar.classList.contains("open")) {
      closeSidebar();
      return;
    }

    openSidebar();
  });

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  document.querySelectorAll(".sidebar a, .sidebar button").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 960) {
        closeSidebar();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      closeSidebar();
    }
  });
}

function initializeHomePage() {
  const searchInput = document.getElementById("searchInput");
  const showAllBooks = document.getElementById("showAllBooks");
  const showFavoriteBooks = document.getElementById("showFavoriteBooks");

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = "true";
    searchInput.addEventListener("input", () => {
      refreshHomePageView();
    });
  }

  if (showAllBooks && showFavoriteBooks && !showAllBooks.dataset.bound) {
    showAllBooks.dataset.bound = "true";
    showFavoriteBooks.dataset.bound = "true";

    showAllBooks.addEventListener("click", () => {
      showAllBooks.classList.add("active");
      showFavoriteBooks.classList.remove("active");
      refreshHomePageView();
    });

    showFavoriteBooks.addEventListener("click", () => {
      showFavoriteBooks.classList.add("active");
      showAllBooks.classList.remove("active");
      refreshHomePageView();
    });
  }

  if (!document.body.dataset.cloudRefreshBound) {
    document.body.dataset.cloudRefreshBound = "true";
    window.addEventListener("elibrary:cloud-sync", () => {
      refreshHomePageView();
    });
  }

  refreshHomePageView();
}

function refreshHomePageView() {
  const searchInput = document.getElementById("searchInput");
  const showFavoriteBooks = document.getElementById("showFavoriteBooks");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const favoritesOnly = Boolean(showFavoriteBooks && showFavoriteBooks.classList.contains("active"));

  updateDashboardStats();
  renderBookGrid({
    containerId: "booksGrid",
    emptyStateId: "booksEmptyState",
    books: filterBooks(query, favoritesOnly),
    withFavoriteState: true
  });
}

function initializeProfilePage() {
  const totalBooks = libraryBooks.length;
  const favorites = getFavorites();
  const favoriteBooks = libraryBooks.filter((book) => favorites.includes(book.id));
  const editedBooks = getEditedBooks();

  setTextContent("profileTotalBooks", String(totalBooks));
  setTextContent("profileFavoriteBooks", String(favorites.length));
  setTextContent("profileEditedBooks", String(editedBooks.length));

  const memberSince = document.getElementById("memberSince");
  const loginAt = localStorage.getItem(STORAGE_KEYS.loginAt);
  if (memberSince && loginAt) {
    memberSince.textContent = `Member since ${new Date(loginAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    })}`;
  }

  renderBookGrid({
    containerId: "favoriteBooksGrid",
    emptyStateId: "favoriteEmptyState",
    books: favoriteBooks,
    withFavoriteState: true
  });

  renderEditedStories(editedBooks);

  if (!document.body.dataset.cloudRefreshBound) {
    document.body.dataset.cloudRefreshBound = "true";
    window.addEventListener("elibrary:cloud-sync", () => {
      initializeProfilePage();
    });
  }
}

function initializeReaderPage() {
  const storyContent = document.getElementById("storyContent");
  const readerTitle = document.getElementById("readerTitle");
  const storyTitleInput = document.getElementById("storyTitleInput");
  const storyEditor = document.getElementById("storyEditor");
  const editorPanel = document.getElementById("editorPanel");
  const toggleEditorBtn = document.getElementById("toggleEditorBtn");
  const changeTitleBtn = document.getElementById("changeTitleBtn");
  const saveStoryBtn = document.getElementById("saveStoryBtn");
  const insertImageBtn = document.getElementById("insertImageBtn");
  const changePosterBtn = document.getElementById("changePosterBtn");
  const imageUpload = document.getElementById("imageUpload");
  const posterUpload = document.getElementById("posterUpload");
  const saveNote = document.getElementById("saveNote");
  const readerModeStatus = document.getElementById("readerModeStatus");
  const menuToggle = document.getElementById("menuToggle");
  const readerMenu = document.getElementById("readerMenu");

  if (!storyContent || !readerTitle || !storyEditor || !storyTitleInput || !editorPanel) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const fallbackId = localStorage.getItem(STORAGE_KEYS.currentBook);
  const bookId = params.get("book") || fallbackId || libraryBooks[0].id;
  const book = getMergedBook(bookId);

  if (!book) {
    navigateTo("home.html");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.currentBook, book.id);

  const state = {
    bookId: book.id,
    title: book.title,
    poster: book.image,
    contentDraft: book.content,
    images: cloneImages(book.images),
    editing: false,
    syncBound: false
  };

  readerTitle.textContent = book.title;
  storyTitleInput.value = state.title;
  storyEditor.value = state.contentDraft;

  const setFeedback = (message, tone = "") => {
    if (!saveNote) {
      return;
    }

    saveNote.textContent = message;
    saveNote.style.color = tone === "success" ? "var(--success)" : "";
  };

  const setEditingState = (isEditing) => {
    state.editing = isEditing;
    editorPanel.classList.toggle("active", isEditing);
    readerModeStatus.textContent = isEditing ? "Editing" : "Viewing";
    toggleEditorBtn.textContent = isEditing ? "Hide Editor" : "Toggle Editor";
  };

  const persistBookState = () => {
    saveBookOverride(state.bookId, {
      title: state.title,
      image: state.poster,
      content: state.contentDraft,
      images: cloneImages(state.images)
    });
  };

  const renderStoryPreview = () => {
    storyContent.innerHTML = createReaderMarkup(state.title, state.contentDraft, state.images, state.poster);
    bindReaderMediaActions(state, storyContent, {
      onPersist: persistBookState,
      onFeedback: (message) => setFeedback(message, "success")
    });
  };

  const saveStoryChanges = (message) => {
    state.title = storyTitleInput.value.trim() || getBookById(state.bookId)?.title || state.title;
    state.contentDraft = storyEditor.value;
    readerTitle.textContent = state.title;
    storyTitleInput.value = state.title;
    persistBookState();
    renderStoryPreview();
    setEditingState(false);
    setFeedback(message || `Saved locally at ${formatShortTime(new Date())}.`, "success");
  };

  renderStoryPreview();

  if (!state.syncBound) {
    state.syncBound = true;
    window.addEventListener("elibrary:cloud-sync", () => {
      const latestBook = getMergedBook(state.bookId);
      if (!latestBook || state.editing) {
        return;
      }

      state.title = latestBook.title;
      state.poster = latestBook.image;
      state.contentDraft = latestBook.content;
      state.images = cloneImages(latestBook.images);
      readerTitle.textContent = latestBook.title;
      storyTitleInput.value = latestBook.title;
      storyEditor.value = latestBook.content;
      renderStoryPreview();
      setFeedback(backendState.enabled ? "Shared update received." : "Story updated.");
    });
  }

  toggleEditorBtn.addEventListener("click", () => {
    setEditingState(!state.editing);
  });
  changeTitleBtn?.addEventListener("click", () => {
    setEditingState(true);
    storyTitleInput.focus();
    storyTitleInput.select();
  });

  saveStoryBtn.addEventListener("click", saveStoryChanges);

  storyTitleInput.addEventListener("input", (event) => {
    state.title = event.target.value.trim() || getBookById(state.bookId)?.title || state.title;
    readerTitle.textContent = state.title;
    renderStoryPreview();
  });

  storyEditor.addEventListener("input", (event) => {
    state.contentDraft = event.target.value;
    renderStoryPreview();
  });

  const openImagePicker = () => imageUpload.click();
  const openPosterPicker = () => posterUpload?.click();
  insertImageBtn.addEventListener("click", openImagePicker);
  changePosterBtn?.addEventListener("click", openPosterPicker);

  imageUpload.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      createManagedImage(String(reader.result || ""), storyContent.clientWidth || 720, (imageData) => {
        state.images = [...state.images, imageData];
        persistBookState();
        renderStoryPreview();
        setEditingState(true);
        setFeedback("Image inserted. Drag the lower-right handle to resize it.", "success");
      });
    };
    reader.readAsDataURL(file);
    imageUpload.value = "";
  });

  posterUpload?.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      state.poster = String(reader.result || "");
      persistBookState();
      renderStoryPreview();
      setFeedback("Poster updated and saved for this book.", "success");
    };
    reader.readAsDataURL(file);
    posterUpload.value = "";
  });

  if (menuToggle && readerMenu) {
    menuToggle.addEventListener("click", () => {
      readerMenu.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(readerMenu.classList.contains("open")));
    });

    readerMenu.addEventListener("click", (event) => {
      const trigger = event.target.closest("button[data-action]");
      if (!trigger) {
        return;
      }

      const action = trigger.dataset.action;
      readerMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");

      if (action === "edit") {
        setEditingState(true);
      }

      if (action === "title") {
        setEditingState(true);
        storyTitleInput.focus();
        storyTitleInput.select();
      }

      if (action === "save") {
        saveStoryChanges();
      }

      if (action === "image") {
        openImagePicker();
      }

      if (action === "poster") {
        openPosterPicker();
      }
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".menu-box")) {
        readerMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
}

function renderBookGrid({ containerId, emptyStateId, books, withFavoriteState }) {
  const container = document.getElementById(containerId);
  const emptyState = document.getElementById(emptyStateId);

  if (!container) {
    return;
  }

  if (!books.length) {
    container.innerHTML = "";
    if (emptyState) {
      emptyState.classList.remove("hidden");
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add("hidden");
  }

  const favorites = getFavorites();
  const overrides = getBookOverrides();

  container.innerHTML = books.map((book, index) => {
    const mergedBook = getMergedBook(book.id);
    const isFavorite = favorites.includes(book.id);
    const isEdited = Boolean(overrides[book.id]);
    return `
      <article class="book-card glass-panel" data-book-id="${book.id}" style="animation-delay:${index * 60}ms">
        <button
          type="button"
          class="favorite-btn ${withFavoriteState && isFavorite ? "is-favorite" : ""}"
          aria-label="Toggle favorite for ${escapeAttribute(book.title)}"
          data-favorite-id="${book.id}"
        >
          &#10084;
        </button>
        <div class="book-cover">
          <img
            src="${escapeAttribute(mergedBook.image || book.image)}"
            alt="${escapeAttribute(book.title)} cover"
            loading="lazy"
            decoding="async"
          >
        </div>
        <div class="book-card-body">
          <div class="book-card-head">
            <div>
              <h3>${escapeHtml(book.title)}</h3>
              <p>${escapeHtml(createPreview(mergedBook.content))}</p>
            </div>
            ${isEdited ? '<span class="book-tag">Edited</span>' : ""}
          </div>
          <div class="book-card-actions">
            <span class="eyebrow">${isFavorite ? "Favorite" : "Story"}</span>
            <button type="button" class="secondary-btn" data-open-reader="${book.id}">Open Reader</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindBookCardActions(container);
}

function bindBookCardActions(container) {
  container.querySelectorAll("[data-open-reader]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const bookId = event.currentTarget.dataset.openReader;
      openReader(bookId);
    });
  });

  container.querySelectorAll(".book-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-favorite-id]") || event.target.closest("[data-open-reader]")) {
        return;
      }

      openReader(card.dataset.bookId);
    });
  });

  container.querySelectorAll("[data-favorite-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const bookId = event.currentTarget.dataset.favoriteId;
      toggleFavorite(bookId);

      const page = document.body.dataset.page;
      if (page === "home") {
        refreshHomePageView();
      }

      if (page === "profile") {
        initializeProfilePage();
      }
    });
  });
}

function updateDashboardStats() {
  const favoriteCount = getFavorites().length;
  const editedCount = getEditedBooks().length;

  setTextContent("totalBooksStat", String(libraryBooks.length));
  setTextContent("favoriteBooksStat", String(favoriteCount));
  setTextContent("editedBooksStat", String(editedCount));
}

function renderEditedStories(editedBooks) {
  const list = document.getElementById("editedBooksList");
  const emptyState = document.getElementById("editedEmptyState");

  if (!list) {
    return;
  }

  if (!editedBooks.length) {
    list.innerHTML = "";
    if (emptyState) {
      emptyState.classList.remove("hidden");
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add("hidden");
  }

  list.innerHTML = editedBooks.map(({ book, updatedAt }) => `
    <article class="edited-item">
      <div>
        <h3>${escapeHtml(book.title)}</h3>
        <time datetime="${escapeAttribute(updatedAt || "")}">Updated ${formatDateTime(updatedAt)}</time>
      </div>
      <button type="button" class="secondary-btn" data-open-reader="${book.id}">Resume Reading</button>
    </article>
  `).join("");

  list.querySelectorAll("[data-open-reader]").forEach((button) => {
    button.addEventListener("click", (event) => {
      openReader(event.currentTarget.dataset.openReader);
    });
  });
}

function openReader(bookId) {
  localStorage.setItem(STORAGE_KEYS.currentBook, bookId);
  navigateTo(`reader.html?book=${encodeURIComponent(bookId)}`);
}

function filterBooks(query, favoritesOnly) {
  const favorites = getFavorites();
  return libraryBooks.filter((book) => {
    const matchesQuery = !query || book.title.toLowerCase().includes(query);
    const matchesFavorite = !favoritesOnly || favorites.includes(book.id);
    return matchesQuery && matchesFavorite;
  });
}

function populateUserIdentity() {
  const username = localStorage.getItem(STORAGE_KEYS.username) || "Reader";
  const initial = username.trim().charAt(0).toUpperCase() || "R";

  document.querySelectorAll("[data-username]").forEach((element) => {
    element.textContent = username;
  });

  document.querySelectorAll("[data-user-initial]").forEach((element) => {
    element.textContent = initial;
  });
}

function getMergedBook(bookId) {
  const baseBook = getBookById(bookId);
  if (!baseBook) {
    return null;
  }

  const cloudOverride = backendState.books[bookId] || {};
  const localOverride = getBookOverrides()[bookId] || {};
  const overrideSource = backendState.enabled && Object.keys(cloudOverride).length ? cloudOverride : localOverride;
  const hasCustomContent = Object.prototype.hasOwnProperty.call(overrideSource, "content");

  return {
    ...baseBook,
    title: resolveBookTitle(bookId, overrideSource.title, baseBook.title),
    image: resolveBookImage(bookId, overrideSource.image, baseBook.image),
    content: hasCustomContent ? overrideSource.content : baseBook.content,
    images: Array.isArray(overrideSource.images) ? cloneImages(overrideSource.images) : []
  };
}

function getBookById(bookId) {
  return libraryBooks.find((book) => book.id === bookId) || null;
}

function runPinnedBookMigrations() {
  const migrationState = readJson(STORAGE_KEYS.posterMigrations, {});
  const overrides = getBookOverrides();
  let hasOverrideChanges = false;

  Object.keys({ ...pinnedBookPosters, ...pinnedBookTitles }).forEach((bookId) => {
    const pinnedImage = pinnedBookPosters[bookId];
    const pinnedTitle = pinnedBookTitles[bookId];
    const nextSignature = JSON.stringify({
      image: pinnedImage || "",
      title: pinnedTitle || ""
    });

    if (migrationState[bookId] === nextSignature) {
      return;
    }

    const currentOverride = overrides[bookId] || {};
    const currentTitle = String(currentOverride.title || "").trim();
    const shouldApplyPinnedTitle = pinnedTitle && (!currentTitle || currentTitle === getBookById(bookId)?.title || (legacyBookTitles[bookId] || []).includes(currentTitle));
    overrides[bookId] = {
      ...currentOverride,
      ...(pinnedImage ? { image: pinnedImage } : {}),
      ...(shouldApplyPinnedTitle ? { title: pinnedTitle } : {}),
      updatedAt: new Date().toISOString()
    };
    migrationState[bookId] = nextSignature;
    hasOverrideChanges = true;
  });

  if (hasOverrideChanges) {
    localStorage.setItem(STORAGE_KEYS.bookOverrides, JSON.stringify(overrides));
  }

  localStorage.setItem(STORAGE_KEYS.posterMigrations, JSON.stringify(migrationState));
}

function resolveBookTitle(bookId, overrideTitle, baseTitle) {
  const nextTitle = String(overrideTitle || "").trim();
  const legacyTitles = legacyBookTitles[bookId] || [];
  const pinnedTitle = pinnedBookTitles[bookId];

  if (!nextTitle) {
    return pinnedTitle || baseTitle;
  }

  if (pinnedTitle && legacyTitles.includes(nextTitle)) {
    return pinnedTitle;
  }

  return nextTitle;
}

function resolveBookImage(bookId, overrideImage, baseImage) {
  const nextImage = String(overrideImage || "").trim();
  if (!nextImage) {
    return baseImage;
  }

  const legacyImages = legacyBookImages[bookId] || [];
  if (legacyImages.includes(nextImage) && nextImage !== baseImage) {
    return baseImage;
  }

  return nextImage;
}

function saveBookOverride(bookId, value) {
  const overrides = getBookOverrides();
  overrides[bookId] = {
    ...(overrides[bookId] || {}),
    ...value,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEYS.bookOverrides, JSON.stringify(overrides));

  syncBookOverrideToCloud(bookId, overrides[bookId]);
}

function getBookOverrides() {
  return readJson(STORAGE_KEYS.bookOverrides, {});
}

function getFavorites() {
  const favorites = readJson(STORAGE_KEYS.favorites, []);
  return Array.isArray(favorites) ? favorites : [];
}

function toggleFavorite(bookId) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.includes(bookId)
    ? favorites.filter((id) => id !== bookId)
    : [...favorites, bookId];

  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updatedFavorites));
}

function isAuthenticated() {
  return localStorage.getItem(STORAGE_KEYS.auth) === "true";
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createPreview(text) {
  const compactText = String(text || "").replace(/\s+/g, " ").trim();
  return compactText.length > 150 ? `${compactText.slice(0, 147)}...` : compactText;
}

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function formatDateTime(value) {
  if (!value) {
    return "recently";
  }

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getEditedBooks() {
  const localEntries = Object.entries(getBookOverrides());
  const cloudEntries = Object.entries(backendState.books).filter(([bookId]) => !Object.prototype.hasOwnProperty.call(getBookOverrides(), bookId));

  return [...localEntries, ...cloudEntries]
    .filter(([, value]) => value && (
      (typeof value.image === "string" && value.image.trim()) ||
      (value.content && value.content.trim()) ||
      (Array.isArray(value.images) && value.images.length)
    ))
    .map(([bookId, value]) => ({
      book: getBookById(bookId),
      updatedAt: value.updatedAt
    }))
    .filter((item) => item.book)
    .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0));
}

function createReaderMarkup(title, content, images, poster) {
  const paragraphs = splitStory(content);
  const imageQueue = [...images];
  const blocks = [];

  paragraphs.forEach((paragraph, index) => {
    blocks.push(`<p class="story-paragraph">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`);

    if (imageQueue.length && (index % 2 === 1 || index === paragraphs.length - 1)) {
      blocks.push(renderReaderImage(imageQueue.shift(), title));
    }
  });

  while (imageQueue.length) {
    blocks.push(renderReaderImage(imageQueue.shift(), title));
  }

  return `
    <div class="story-header">
      <div class="story-cover">
        <img src="${escapeAttribute(poster)}" alt="${escapeAttribute(title)} poster" loading="lazy" decoding="async">
      </div>
      <span class="book-tag">Live Reader</span>
      <h2>${escapeHtml(title)}</h2>
      <p>Edit the story, insert images, change the poster, and save your personalized version for every return visit.</p>
    </div>
    <div class="story-body">
      ${blocks.length ? blocks.join("") : '<div class="story-empty"><p>Your story is empty right now. Open the editor and start writing.</p></div>'}
    </div>
  `;
}

function renderReaderImage(image, title) {
  const width = clamp(Number(image.width) || 420, 220, 1200);
  const height = clamp(Number(image.height) || 260, 160, 1200);

  return `
    <section class="story-media-item">
      <div class="story-media-frame" data-image-id="${escapeAttribute(image.id)}" style="width:${width}px; height:${height}px;">
        <button
          type="button"
          class="image-remove-btn"
          data-remove-image="${escapeAttribute(image.id)}"
          aria-label="Remove image"
        >
          &times;
        </button>
        <img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(title)} illustration" loading="lazy" decoding="async">
        <div class="resize-handle" aria-hidden="true"></div>
      </div>
    </section>
  `;
}

function bindReaderMediaActions(state, storyContent, callbacks) {
  const { onPersist, onFeedback } = callbacks;

  storyContent.querySelectorAll(".story-media-frame").forEach((frame) => {
    const imageId = frame.dataset.imageId;
    const imageRecord = state.images.find((image) => image.id === imageId);

    if (!imageRecord) {
      return;
    }

    frame.querySelector("[data-remove-image]")?.addEventListener("click", () => {
      state.images = state.images.filter((image) => image.id !== imageId);
      onPersist();
      storyContent.innerHTML = createReaderMarkup(state.title, state.contentDraft, state.images, state.poster);
      bindReaderMediaActions(state, storyContent, callbacks);
      onFeedback("Image removed and saved locally.");
    });

    frame.querySelector(".resize-handle")?.addEventListener("pointerdown", (event) => {
      event.preventDefault();

      const bounds = frame.getBoundingClientRect();
      const startX = event.clientX;
      const startWidth = bounds.width;
      const aspectRatio = imageRecord.width && imageRecord.height
        ? imageRecord.height / imageRecord.width
        : bounds.height / bounds.width;
      const containerWidth = storyContent.clientWidth || window.innerWidth;
      const maxWidth = Math.max(260, containerWidth - 56);

      document.body.classList.add("is-resizing");

      const onPointerMove = (moveEvent) => {
        const nextWidth = clamp(startWidth + (moveEvent.clientX - startX), 220, maxWidth);
        const nextHeight = Math.max(160, Math.round(nextWidth * aspectRatio));

        frame.style.width = `${nextWidth}px`;
        frame.style.height = `${nextHeight}px`;
      };

      const onPointerUp = () => {
        document.body.classList.remove("is-resizing");
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);

        imageRecord.width = Math.round(frame.getBoundingClientRect().width);
        imageRecord.height = Math.round(frame.getBoundingClientRect().height);
        onPersist();
        onFeedback("Image size updated and saved locally.");
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    });
  });
}

function splitStory(content) {
  return String(content || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function createManagedImage(source, containerWidth, callback) {
  const image = new Image();
  image.onload = () => {
    const maxWidth = Math.max(240, Math.min(containerWidth - 64, 520));
    const width = Math.min(maxWidth, image.naturalWidth || maxWidth);
    const ratio = image.naturalHeight / image.naturalWidth || 0.65;

    callback({
      id: `img-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      src: source,
      width: Math.round(width),
      height: Math.round(width * ratio)
    });
  };
  image.src = source;
}

function cloneImages(images) {
  return (Array.isArray(images) ? images : []).map((image) => ({ ...image }));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function initializeCloudSync() {
  if (backendState.initialized || backendState.loading) {
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    backendState.initialized = true;
    return;
  }

  backendState.loading = true;
  backendState.initialized = true;
  backendState.enabled = true;
  backendState.client = client;

  try {
    await loadSharedStoriesFromBackend();

    const tableName = getStoriesTableName();
    backendState.channel = client
      .channel("elibrary-stories-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        async () => {
          await loadSharedStoriesFromBackend();
        }
      )
      .subscribe();
  } catch (error) {
    backendState.error = error;
    console.error("Supabase initialization failed:", error);
    if (isRecoverableBackendError(error)) {
      disableBackendMode();
    }
  } finally {
    backendState.loading = false;
  }
}

async function loadSharedStoriesFromBackend() {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const { data, error } = await client
    .from(getStoriesTableName())
    .select("book_id,title,image,content,images,updated_at,updated_by_name");

  if (error) {
    backendState.error = error;
    console.error("Shared story load failed:", error);
    if (isRecoverableBackendError(error)) {
      disableBackendMode();
    }
    return;
  }

  const nextBooks = {};
  const pinnedUpdates = [];
  (data || []).forEach((row) => {
    const pinnedImage = pinnedBookPosters[row.book_id];
    const pinnedTitle = pinnedBookTitles[row.book_id];
    const legacyTitles = legacyBookTitles[row.book_id] || [];
    if (pinnedImage && row.image !== pinnedImage) {
      pinnedUpdates.push({
        bookId: row.book_id,
        title: resolveBookTitle(row.book_id, row.title, getBookById(row.book_id)?.title || row.title || ""),
        image: pinnedImage,
        content: row.content || "",
        images: Array.isArray(row.images) ? row.images : []
      });
    }
    if (pinnedTitle && (!row.title || legacyTitles.includes(row.title))) {
      pinnedUpdates.push({
        bookId: row.book_id,
        title: pinnedTitle,
        image: pinnedImage || row.image || "",
        content: row.content || "",
        images: Array.isArray(row.images) ? row.images : []
      });
    }

    nextBooks[row.book_id] = {
      title: resolveBookTitle(row.book_id, row.title, getBookById(row.book_id)?.title || row.title || ""),
      image: pinnedImage || row.image || "",
      content: row.content || "",
      images: Array.isArray(row.images) ? row.images : [],
      updatedAt: row.updated_at || null,
      updatedBy: row.updated_by_name || "Reader"
    };
  });

  backendState.books = nextBooks;
  window.dispatchEvent(new CustomEvent("elibrary:cloud-sync"));
  syncPinnedPostersToCloud(pinnedUpdates);
}

async function syncBookOverrideToCloud(bookId, override) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  if (!backendState.enabled && !backendState.loading) {
    await initializeCloudSync();
  }

  const baseBook = getBookById(bookId);
  if (!baseBook) {
    return;
  }

  const payload = {
    book_id: bookId,
    title: resolveBookTitle(bookId, override.title, baseBook.title),
    image: resolveBookImage(bookId, override.image, baseBook.image),
    content: override.content ?? baseBook.content,
    images: Array.isArray(override.images) ? override.images : [],
    updated_at: new Date().toISOString(),
    updated_by_name: localStorage.getItem(STORAGE_KEYS.username) || "Reader"
  };

  const { error } = await client
    .from(getStoriesTableName())
    .upsert(payload, { onConflict: "book_id" });

  if (error) {
    console.error("Shared story save failed:", error);
    if (isRecoverableBackendError(error)) {
      disableBackendMode();
    }
  }
}

async function syncPinnedPostersToCloud(pinnedUpdates = []) {
  const client = getSupabaseClient();
  if (!client || !backendState.enabled) {
    return;
  }

  pinnedUpdates.forEach(({ bookId, title, image, content, images }) => {
    syncBookOverrideToCloud(bookId, {
      title,
      image,
      content,
      images: cloneImages(images)
    });
  });
}

function getSupabaseClient() {
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

  if (!backendState.client) {
    backendState.client = library.createClient(config.url, config.anonKey);
  }

  return backendState.client;
}

function getStoriesTableName() {
  return window.E_LIBRARY_SUPABASE_CONFIG?.storiesTable || "stories";
}

function isRecoverableBackendError(error) {
  const message = String(error?.message || error?.details || error || "").toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("invalid jwt") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("email rate limit exceeded") ||
    message.includes("rate limit") ||
    message.includes("network") ||
    message.includes("unauthorized") ||
    message.includes("apikey")
  );
}

function disableBackendMode() {
  backendState.enabled = false;
  backendState.loading = false;
  backendState.initialized = true;
  backendState.channel = null;
  backendState.client = null;
  if (window.E_LIBRARY_SUPABASE_CONFIG) {
    window.E_LIBRARY_SUPABASE_CONFIG.enabled = false;
  }
}
