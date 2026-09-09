/** Deterministic, scroll-driven deciphering. No timer continues after a gesture. */
export function createScramble(heading: HTMLElement, seed: number) {
  const markup = heading.innerHTML;
  const label = heading.getAttribute('aria-label');
  const text = heading.textContent!.replace(/\s+/g, ' ').trim();
  let ink: HTMLElement | undefined;
  const reset = () => {
    if (!ink) return;
    heading.innerHTML = markup; ink = undefined;
    heading.removeAttribute('data-scrambling');
    if (label === null) heading.removeAttribute('aria-label'); else heading.setAttribute('aria-label', label);
  };
  return {
    reset,
    update(progress: number) {
      if (progress < 0 || progress >= 1) { reset(); return; }
      if (!ink) {
        const layout = document.createElement('span'); layout.className = 'scramble-layout'; layout.innerHTML = markup;
        ink = document.createElement('span'); ink.className = 'scramble-ink'; ink.setAttribute('aria-hidden', 'true');
        heading.replaceChildren(layout, ink); heading.dataset.scrambling = ''; heading.setAttribute('aria-label', text);
      }
      const glyphs = '01<>/{}[]+_abcdefghijk';
      const step = Math.floor(progress * 28);
      ink.textContent = [...text].map((char, i) => {
        if (/\s|[.,]/.test(char) || progress > (i + 1) / (text.length + 1)) return char;
        return glyphs[(i * 13 + step * 7 + seed * 11) % glyphs.length];
      }).join('');
    },
  };
}
