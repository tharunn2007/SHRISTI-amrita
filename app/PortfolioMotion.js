import { useEffect } from 'react';

// Scope every timeline and listener to this mounted page and motion preference.
export function usePortfolioMotion(root) {
  useEffect(() => {
    const page = root.current;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let stop = () => {};

    function setup() {
      stop();
      if (preference.matches) return;
      const events = new AbortController();
      const options = { signal: events.signal };
      const active = new Set();
      const ease = 'cubic-bezier(.16,1,.3,1)';
      function animate(element, frames, duration, delay = 0) {
        const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
        active.add(animation);
        animation.onfinish = () => active.delete(animation);
      }

      const letters = [...page.querySelectorAll('.glyph')];
      letters.forEach((letter, i) => animate(letter, [
        { transform: 'translateY(105%)' }, { transform: 'translateY(0)' }
      ], 1150, 420 + i * 38));
      page.querySelectorAll('header > button, header > .brand, .strip').forEach((item, i) => animate(item, [
        { opacity: 0, transform: 'translateY(-1rem)' }, { opacity: 1, transform: 'translateY(0)' }
      ], 850, 60 + i * 85));
      animate(page.querySelector('.hero-mark'), [
        { transform: 'scale(0) rotate(-135deg)' }, { transform: 'scale(1) rotate(0)' }
      ], 1450, 650);

      function roll(letter) {
        if (letter.getAnimations().length) return;
        animate(letter, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], 620);
      }
      letters.forEach(letter => letter.parentElement.addEventListener('pointerenter', () => roll(letter), options));

      const hero = page.querySelector('.hero');
      let heroVisible = true;
      const heroObserver = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; });
      heroObserver.observe(hero);
      const codes = page.querySelectorAll('.binary');
      const timer = setInterval(() => {
        if (!heroVisible || document.hidden) return;
        roll(letters[Math.floor(Math.random() * letters.length)]);
        for (const code of codes) {
          code.textContent = (Math.random() * 256 | 0).toString(2).padStart(8, '0');
        }
      }, 1050);

      const reveal = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animate(entry.target, [
            { opacity: .1, transform: 'translateY(2.8rem)', clipPath: 'inset(0 0 45% 0)' },
            { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' }
          ], 900);
          reveal.unobserve(entry.target);
        }
      }, { threshold: .12 });
      page.querySelectorAll('.section-label, .about h2, .about p, .index details, footer').forEach(el => reveal.observe(el));

      const about = page.querySelector('.about');
      let frame = 0;
      function position() {
        frame = 0;
        const rect = about.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (innerHeight - rect.top * 2 - rect.height) / (innerHeight + rect.height)));
        about.style.setProperty('--drift', (progress * 65) + 'px');
        about.style.setProperty('--tilt', (progress * 12) + 'deg');
      }
      function queue() { if (!frame) frame = requestAnimationFrame(position); }
      position();
      window.addEventListener('scroll', queue, { passive: true, ...options });
      window.addEventListener('resize', queue, options);
      stop = () => {
        events.abort();
        reveal.disconnect();
        heroObserver.disconnect();
        clearInterval(timer);
        cancelAnimationFrame(frame);
        active.forEach(animation => animation.cancel());
        about.style.removeProperty('--drift');
        about.style.removeProperty('--tilt');
      };
    }
    setup();
    preference.addEventListener('change', setup);
    return () => { stop(); preference.removeEventListener('change', setup); };
  }, [root]);
}
