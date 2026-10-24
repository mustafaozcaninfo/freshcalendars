/**
 * Loader for Google's Preferred Sources button (components/PreferredSource.astro). Lives in NewsBase's
 * one shared inline script because pages may carry at most two inline scripts (audit 02-NO-JS-CONTENT).
 * Fetches news.google.com's publisher.js only when a box comes within 600px of the viewport.
 */
export const PREF_SRC_JS = `(() => {
    const boxes = document.querySelectorAll("[data-pref-src]");
    if (!boxes.length || window.__prefSrc) return;
    window.__prefSrc = true;
    // Google renders into a shadow root and sets data-initialized on the host. Once the button is
    // really drawn there, drop the fallback link so readers see one control.
    for (const b of boxes) {
      const btn = b.querySelector(".pref-btn");
      const drawn = () => btn.hasAttribute("data-initialized") && btn.shadowRoot && btn.shadowRoot.childElementCount > 0;
      const mark = () => { if (drawn()) { b.classList.add("ready"); return true; } return false; };
      new MutationObserver((_, mo) => { if (mark()) mo.disconnect(); else setTimeout(mark, 300); }).observe(btn, { attributes: true, attributeFilter: ["data-initialized"] });
    }
    const load = () => {
      if (document.querySelector('script[src*="news.google.com/swg/js/v1/publisher.js"]')) return;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://news.google.com/swg/js/v1/publisher.js";
      document.head.append(s);
    };
    if (!("IntersectionObserver" in window)) return load();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "600px 0px" });
    boxes.forEach((b) => io.observe(b));
  })();`;
