(function () {
  try {
    var root = document.documentElement;
    var settings = {};
    try {
      var raw = localStorage.getItem("tc-settings");
      if (raw) {
        var parsed = JSON.parse(raw);
        settings = parsed && parsed.state ? parsed.state : parsed || {};
      }
    } catch (error) {
      settings = {};
    }

    var mode = settings.theme;
    if (mode !== "light" && mode !== "dark") mode = "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = mode === "dark" || (mode === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
    root.dataset.theme = isDark ? "dark" : "light";

    var font = settings.titleFont;
    if (font !== "modern" && font !== "serif" && font !== "handwritten") font = "handwritten";
    root.dataset.titleFont = font;
  } catch (error) {
    /* abaikan error storage */
  }
})();
