// Helper JS injected into every page via page.addInitScript, so surface
// checks running in page.evaluate can use these utilities uniformly.

export const PAGE_HELPERS_SCRIPT = `
(() => {
  if (window.__firaHelpers) return;

  const classTokens = (el) =>
    new Set(((el && el.getAttribute('class')) || '').trim().split(/\\s+/).filter(Boolean));

  const missingClassTokens = (el, required) => {
    const have = classTokens(el);
    return required.filter((t) => !have.has(t));
  };

  const describe = (el) => {
    if (!el) return 'null';
    const id = el.id ? '#' + el.id : '';
    const testId = el.getAttribute && el.getAttribute('data-testid');
    const tag = el.tagName ? el.tagName.toLowerCase() : '?';
    return tag + id + (testId ? '[data-testid="' + testId + '"]' : '');
  };

  const has = (el) => !!(el && el.nodeType === 1);

  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const first = (selector, root = document) => root.querySelector(selector);

  const hasInlineStyle = (el, needles) => {
    const s = (el && el.getAttribute('style')) || '';
    return needles.every((n) => s.includes(n));
  };

  const attrEq = (el, name, value) =>
    el && el.getAttribute(name) === value;

  const attrMatches = (el, name, regex) => {
    const v = el && el.getAttribute(name);
    return typeof v === 'string' && regex.test(v);
  };

  window.__firaHelpers = {
    classTokens,
    missingClassTokens,
    describe,
    has,
    all,
    first,
    hasInlineStyle,
    attrEq,
    attrMatches,
  };
})();
`
