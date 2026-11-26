'use client';

import { useEffect, useRef, useState } from 'react';

export default function TitleCard() {
  const frame = useRef(null);
  const [visible, setVisible] = useState(false);

  const [fading, setFading] = useState(false);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) return;

    function finish(event) {
      if (event.origin === location.origin && event.source === frame.current?.contentWindow &&
          event.data === 'srishti-intro-ended') setFading(true);
    }

    function reduceMotion() {
      if (motion.matches) setVisible(false);
    }

    window.addEventListener('message', finish);
    motion.addEventListener('change', reduceMotion);
    setVisible(true);
    return () => {
      window.removeEventListener('message', finish);
      motion.removeEventListener('change', reduceMotion);
    };
  }, []);

  return <>
    <link rel="stylesheet" href="/title-card.css" precedence="default" />
    {visible && <iframe ref={frame} className="title-card" data-fading={fading}
      onAnimationEnd={() => setVisible(false)} title="Srishti Club intro"
      src="/glitch_logo.html?intro" tabIndex={-1} aria-hidden="true" />}
  </>;
}
