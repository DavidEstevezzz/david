import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class AboutStory extends HTMLElement {
  private media?: ReturnType<typeof gsap.matchMedia>;
  private events?: AbortController;
  private frame = 0;

  connectedCallback() {
    this.events = new AbortController();
    const { signal } = this.events;
    const chapters = [...this.querySelectorAll<HTMLElement>('.about-chapter')];
    const index = this.querySelector<HTMLElement>('.about-index')!;
    const links = [...index.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    const update = () => {
      this.frame = 0;
      const top = chapters[0].getBoundingClientRect().top + scrollY - index.offsetHeight;
      const last = chapters[chapters.length - 1].getBoundingClientRect();
      const end = last.bottom + scrollY - innerHeight;
      const progress = Math.max(0, Math.min(1, (scrollY - top) / Math.max(1, end - top)));
      index.style.setProperty('--reading-progress', String(progress));
      let active = '';
      for (const chapter of chapters) {
        if (chapter.getBoundingClientRect().top <= index.offsetHeight + innerHeight * .25) active = chapter.id;
      }
      links.forEach(link => {
        if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const schedule = () => { if (!this.frame) this.frame = requestAnimationFrame(update); };
    addEventListener('scroll', schedule, { passive: true, signal });
    addEventListener('resize', schedule, { passive: true, signal });
    addEventListener('pageshow', schedule, { signal });

    // Native links remain usable without JS. Enhance only this page's anchors.
    this.addEventListener('click', event => {
      if (!(event instanceof MouseEvent) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      const target = link?.hash ? document.getElementById(link.hash.slice(1)) : null;
      if (!target) return;
      event.preventDefault();
      history.replaceState(history.state, '', link!.hash);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }, { signal });

    this.media = gsap.matchMedia();
    this.media.add('(prefers-reduced-motion: no-preference)', () => {
      this.querySelectorAll<HTMLElement>('[data-about-photo]').forEach(frame => {
        const img = frame.querySelector('img')!;
        gsap.fromTo(img, { scale: 1.06, yPercent: -2 }, {
          yPercent: 2, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: .5 },
        });
      });
      this.querySelectorAll<HTMLElement>('[data-about-reveal]').forEach(element => {
        gsap.from(element, {
          y: 24, opacity: .25, duration: .8, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        });
      });
      gsap.fromTo(this.querySelector('.about-process'), { '--process-progress': 0 }, {
        '--process-progress': 1, ease: 'none',
        scrollTrigger: { trigger: '.about-process', start: 'top 90%', end: 'bottom 55%', scrub: true },
      });
      gsap.fromTo(this.querySelector('.about-data'), { '--data-offset': 1 }, {
        '--data-offset': 0, ease: 'none',
        scrollTrigger: { trigger: '.about-data', start: 'top 85%', end: 'center 55%', scrub: .4 },
      });
    }, this);
    update();
    void document.fonts.ready.then(() => { if (!signal.aborted) { ScrollTrigger.refresh(); schedule(); } });
  }

  disconnectedCallback() {
    this.events?.abort();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.media?.revert();
  }
}

if (!customElements.get('about-story')) customElements.define('about-story', AboutStory);
