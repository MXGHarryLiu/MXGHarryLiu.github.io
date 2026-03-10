const THEME_STORAGE_KEY = "preferred-theme";
const THEME_MODES = ["auto", "light", "dark"];
let activeThemeMode = "auto";

function isThemeMode(value) {
    return THEME_MODES.indexOf(value) >= 0;
}

function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function resolveInitialThemeMode() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : "auto";
}

function getNextThemeMode(themeMode) {
    const currentIndex = THEME_MODES.indexOf(themeMode);
    return THEME_MODES[(currentIndex + 1) % THEME_MODES.length];
}

function resolveAppliedTheme(themeMode) {
    return themeMode === "auto" ? getSystemTheme() : themeMode;
}

function updateThemeToggleIcon(themeMode) {
    const toggleButton = document.getElementById("themeToggle");
    if (!toggleButton) {
        return;
    }
    const iconClassByMode = {
        auto: "bi-circle-half",
        light: "bi-sun-fill",
        dark: "bi-moon-stars-fill"
    };
    const nextMode = getNextThemeMode(themeMode);
    const i18nGet = window.i18nManager && typeof window.i18nManager.getContent === "function"
        ? window.i18nManager.getContent.bind(window.i18nManager)
        : null;
    const nextLabelByMode = {
        auto: i18nGet ? i18nGet("button/themeAuto", "Switch to auto mode") : "Switch to auto mode",
        light: i18nGet ? i18nGet("button/themeLight", "Switch to light mode") : "Switch to light mode",
        dark: i18nGet ? i18nGet("button/themeDark", "Switch to dark mode") : "Switch to dark mode"
    };
    toggleButton.innerHTML = '<i class="bi ' + (iconClassByMode[themeMode] || "bi-circle-half") + '" aria-hidden="true"></i>';
    toggleButton.setAttribute("aria-label", nextLabelByMode[nextMode]);
    toggleButton.setAttribute("title", nextLabelByMode[nextMode]);
}

function applyThemeMode(themeMode, options) {
    const shouldPersist = !options || options.persist !== false;
    const resolvedMode = isThemeMode(themeMode) ? themeMode : "auto";
    activeThemeMode = resolvedMode;
    document.documentElement.setAttribute("data-bs-theme", resolveAppliedTheme(resolvedMode));
    document.documentElement.setAttribute("data-theme-mode", resolvedMode);
    if (shouldPersist) {
        localStorage.setItem(THEME_STORAGE_KEY, resolvedMode);
    }
    updateThemeToggleIcon(resolvedMode);
}

function initializeThemeToggle() {
    document.documentElement.classList.add("theme-toggle-ready");
    applyThemeMode(resolveInitialThemeMode());

    document.addEventListener("click", function (event) {
        const clickTarget = event.target instanceof Element ? event.target : null;
        const themeToggle = clickTarget ? clickTarget.closest("#themeToggle") : null;
        if (!themeToggle) {
            return;
        }
        event.preventDefault();
        applyThemeMode(getNextThemeMode(activeThemeMode));
    });

    if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", function () {
            if (activeThemeMode === "auto") {
                applyThemeMode("auto", { persist: false });
            }
        });
    }

    document.addEventListener("nav-component-ready", function () {
        updateThemeToggleIcon(activeThemeMode);
    });

    document.addEventListener(window.I18N_READY_EVENT || "i18n-ready", function () {
        updateThemeToggleIcon(activeThemeMode);
    });
}

window.addEventListener("DOMContentLoaded", initializeThemeToggle);
