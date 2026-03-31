const SITE_STORAGE_KEYS = {
  theme: "elibrary.theme",
  musicEnabled: "elibrary.musicEnabled",
  musicVolume: "elibrary.musicVolume"
};

let siteBooted = false;
let siteAudioController = null;

window.ELibrarySite = {
  boot,
  getTheme,
  applyTheme,
  isMusicEnabled
};

boot();

function boot() {
  if (siteBooted) {
    return;
  }

  siteBooted = true;
  applyTheme(getTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSiteEnhancements, { once: true });
    return;
  }

  initializeSiteEnhancements();
}

function initializeSiteEnhancements() {
  injectSettingsUI();
  bindSettingsUI();
  syncSettingsUI();
  initializeAmbientMusic();
}

function getTheme() {
  return localStorage.getItem(SITE_STORAGE_KEYS.theme) === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  localStorage.setItem(SITE_STORAGE_KEYS.theme, nextTheme);
  document.documentElement.setAttribute("data-theme", nextTheme);
  document.body?.classList.toggle("theme-light", nextTheme === "light");
  window.dispatchEvent(new CustomEvent("elibrary:theme-change", {
    detail: { theme: nextTheme }
  }));
}

function isMusicEnabled() {
  return localStorage.getItem(SITE_STORAGE_KEYS.musicEnabled) === "true";
}

function getMusicVolume() {
  const rawValue = Number(localStorage.getItem(SITE_STORAGE_KEYS.musicVolume));
  if (!Number.isFinite(rawValue)) {
    return 0.34;
  }

  return clampSiteValue(rawValue, 0.08, 0.8);
}

function setMusicEnabled(enabled) {
  localStorage.setItem(SITE_STORAGE_KEYS.musicEnabled, enabled ? "true" : "false");
  syncSettingsUI();
  initializeAmbientMusic();
}

function setMusicVolume(value) {
  localStorage.setItem(SITE_STORAGE_KEYS.musicVolume, String(clampSiteValue(value, 0.08, 0.8)));
  syncSettingsUI();
  siteAudioController?.setVolume(getMusicVolume());
}

function injectSettingsUI() {
  if (document.getElementById("siteSettingsToggle")) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "site-settings-shell";
  wrapper.innerHTML = `
    <button
      type="button"
      class="site-settings-toggle icon-btn"
      id="siteSettingsToggle"
      aria-label="Open site settings"
      aria-expanded="false"
    >
      &#9881;
    </button>
    <aside class="site-settings-drawer glass-panel" id="siteSettingsDrawer" aria-hidden="true">
      <div class="site-settings-head">
        <div>
          <p class="eyebrow">Site Controls</p>
          <h2>Personalize your library</h2>
        </div>
        <button type="button" class="icon-btn site-settings-close" id="siteSettingsClose" aria-label="Close settings">
          &times;
        </button>
      </div>

      <section class="site-setting-block">
        <div class="site-setting-copy">
          <strong>Theme</strong>
          <p>Switch between the signature dark reading lounge and a lighter daytime mode.</p>
        </div>
        <div class="site-theme-switch" role="tablist" aria-label="Theme selection">
          <button type="button" class="filter-chip" data-theme-choice="dark">Dark</button>
          <button type="button" class="filter-chip" data-theme-choice="light">Light</button>
        </div>
      </section>

      <section class="site-setting-block">
        <div class="site-setting-copy">
          <strong>Background Music</strong>
          <p>Turn on the ambient soundtrack for a calmer reading atmosphere.</p>
        </div>
        <div class="site-music-controls">
          <button type="button" class="filter-chip" id="musicToggleBtn">Music Off</button>
          <label class="site-volume-control">
            <span>Volume</span>
            <input type="range" id="musicVolumeInput" min="0.08" max="0.8" step="0.02" value="0.34">
          </label>
        </div>
        <p class="site-settings-note" id="musicSettingsNote">Music starts after your interaction on this device.</p>
      </section>
    </aside>
  `;

  document.body.appendChild(wrapper);
}

function bindSettingsUI() {
  const toggleButton = document.getElementById("siteSettingsToggle");
  const closeButton = document.getElementById("siteSettingsClose");
  const drawer = document.getElementById("siteSettingsDrawer");
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicVolumeInput = document.getElementById("musicVolumeInput");

  if (!toggleButton || !drawer || toggleButton.dataset.bound === "true") {
    return;
  }

  toggleButton.dataset.bound = "true";

  const closeDrawer = () => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    toggleButton.setAttribute("aria-expanded", "false");
  };

  const openDrawer = () => {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    toggleButton.setAttribute("aria-expanded", "true");
  };

  toggleButton.addEventListener("click", () => {
    if (drawer.classList.contains("open")) {
      closeDrawer();
      return;
    }

    openDrawer();
  });

  closeButton?.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (event) => {
    const themeButton = event.target.closest("[data-theme-choice]");
    if (themeButton) {
      applyTheme(themeButton.dataset.themeChoice || "dark");
      syncSettingsUI();
      return;
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-settings-shell")) {
      closeDrawer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  musicToggleBtn?.addEventListener("click", async () => {
    const nextEnabled = !isMusicEnabled();
    setMusicEnabled(nextEnabled);

    if (nextEnabled) {
      await siteAudioController?.ensureStarted();
    }
  });

  musicVolumeInput?.addEventListener("input", (event) => {
    setMusicVolume(Number(event.target.value));
  });
}

function syncSettingsUI() {
  const currentTheme = getTheme();
  const musicEnabled = isMusicEnabled();
  const volume = getMusicVolume();
  const musicToggleBtn = document.getElementById("musicToggleBtn");
  const musicVolumeInput = document.getElementById("musicVolumeInput");
  const note = document.getElementById("musicSettingsNote");

  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeChoice === currentTheme);
  });

  if (musicToggleBtn) {
    musicToggleBtn.textContent = musicEnabled ? "Music On" : "Music Off";
    musicToggleBtn.classList.toggle("active", musicEnabled);
  }

  if (musicVolumeInput) {
    musicVolumeInput.value = String(volume);
    musicVolumeInput.disabled = !musicEnabled;
  }

  if (note) {
    note.textContent = musicEnabled
      ? "Ambient music is enabled. It may start after your next interaction on this browser."
      : "Music is currently off.";
  }
}

function initializeAmbientMusic() {
  if (!siteAudioController) {
    siteAudioController = createAmbientMusicController();
  }

  siteAudioController.setVolume(getMusicVolume());

  if (!isMusicEnabled()) {
    siteAudioController.stop();
    return;
  }

  siteAudioController.armForUserGesture();
}

function createAmbientMusicController() {
  let context = null;
  let masterGain = null;
  let filterNode = null;
  let oscillators = [];
  let gains = [];
  let lfo = null;
  let lfoGain = null;
  let started = false;
  let arming = false;

  const stopNodes = () => {
    try {
      oscillators.forEach((oscillator) => oscillator.stop());
      lfo?.stop();
    } catch (error) {
      // Ignore already-stopped nodes.
    }

    oscillators = [];
    gains = [];
    lfo = null;
    lfoGain = null;
    masterGain = null;
    filterNode = null;
    context?.close?.();
    context = null;
    started = false;
  };

  const buildNodes = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }

    context = new AudioContextClass();
    masterGain = context.createGain();
    masterGain.gain.value = 0.0001;

    filterNode = context.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 720;
    filterNode.Q.value = 0.6;

    lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.045;
    lfoGain = context.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filterNode.frequency);

    const voices = [
      { type: "sine", frequency: 174.61, gain: 0.18 },
      { type: "triangle", frequency: 220, gain: 0.11 },
      { type: "sine", frequency: 261.63, gain: 0.08 }
    ];

    voices.forEach((voice) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.value = voice.frequency;
      gainNode.gain.value = voice.gain;
      oscillator.connect(gainNode);
      gainNode.connect(filterNode);
      oscillators.push(oscillator);
      gains.push(gainNode);
    });

    filterNode.connect(masterGain);
    masterGain.connect(context.destination);

    oscillators.forEach((oscillator) => oscillator.start());
    lfo.start();

    await context.resume();
    masterGain.gain.linearRampToValueAtTime(getMusicVolume() * 0.12, context.currentTime + 1.2);
    started = true;
    return true;
  };

  const ensureStarted = async () => {
    if (!isMusicEnabled()) {
      return false;
    }

    if (started && context) {
      await context.resume();
      return true;
    }

    return buildNodes();
  };

  const armForUserGesture = () => {
    if (started || arming) {
      return;
    }

    arming = true;
    const startOnGesture = async () => {
      if (!isMusicEnabled()) {
        arming = false;
        return;
      }

      await ensureStarted();
      arming = false;
      window.removeEventListener("pointerdown", startOnGesture);
      window.removeEventListener("keydown", startOnGesture);
    };

    window.addEventListener("pointerdown", startOnGesture, { once: true });
    window.addEventListener("keydown", startOnGesture, { once: true });
  };

  const stop = () => {
    if (masterGain && context) {
      masterGain.gain.cancelScheduledValues(context.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.35);
      window.setTimeout(stopNodes, 420);
      return;
    }

    stopNodes();
  };

  const setVolume = (volume) => {
    if (!masterGain || !context) {
      return;
    }

    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.linearRampToValueAtTime(clampSiteValue(volume, 0.08, 0.8) * 0.12, context.currentTime + 0.24);
  };

  return {
    ensureStarted,
    armForUserGesture,
    stop,
    setVolume
  };
}

function clampSiteValue(value, min, max) {
  return Math.min(Math.max(Number(value) || min, min), max);
}
