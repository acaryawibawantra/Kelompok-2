(function () {
  try {
    var root = document.documentElement;
    var storedTheme = localStorage.getItem("tc-theme");
    var mode = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = mode === "dark" || (mode === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
    root.dataset.theme = isDark ? "dark" : "light";

    var storedFont = localStorage.getItem("tc-title-font");
    if (storedFont === "modern" || storedFont === "serif" || storedFont === "handwritten") {
      root.dataset.titleFont = storedFont;
    } else {
      root.dataset.titleFont = "handwritten";
    }
  } catch (error) {
    /* ignore storage errors */
  }
})();
