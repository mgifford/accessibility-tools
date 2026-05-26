/**
 * PageScripts service — pure JS, identical to Electron version,
 * no DB access required.
 */
class PageScriptsService {
  static getFocusScript(selector) {
    selector = selector.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `(() => {
      try {
        const element = document.querySelector("${selector}");
        if (!element) return;
        element.style.outline = '2px solid #ff0000';
        element.focus();
        try {
          const elTop = Math.round(element.getBoundingClientRect().top);
          const elLeft = Math.round(element.getBoundingClientRect().left);
          const targetY = elTop + window.scrollY - 150;
          const targetX = elLeft + window.scrollX;
          if (elTop === 0 && elLeft === 0) {
            window.scrollTo({ top: 0, left: 0 });
          } else {
            window.scrollTo({ top: targetY, left: targetX });
          }
        } catch (e) {
          element.scrollIntoView(true);
        }
      } catch (e) {}
    })()`;
  }

  static getRemoveFocusScript(selector) {
    selector = selector.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `(() => {
      try {
        const element = document.querySelector("${selector}");
        if (!element) return;
        element.style.outline = 'none';
      } catch {}
    })()`;
  }
}

export default PageScriptsService;
