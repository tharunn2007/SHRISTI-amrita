'use client';

import { useEffect, useRef } from 'react';

export default function Waves() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let pointer = null;
    const started = performance.now();
    let visible = true;
    let frame;
    let width, height;

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      const phase = time / 1700;
      const reveal = motion.matches ? 1 : Math.min(1, Math.max(0, (time - started) / 1400));
      const end = width * (1 - (1 - reveal) ** 3);
      for (let baseline = -70; baseline < height + 70; baseline += 11) {
        for (let x = 0; x <= end + 8; x += 8) {
          const fold = Math.sin(x / 125 + baseline / 155 - phase);
          let y = baseline + 30 * fold + 16 * Math.sin(x / 70 - baseline / 80 + phase * .6);
          if (pointer && !motion.matches) {
            const distance = Math.hypot(x - pointer.x, y - pointer.y);
            const age = (time - pointer.time) / 1000;
            y += 28 * Math.exp(-distance / 95 - age * 1.8) * Math.cos(distance / 24 - age * 8);
          }
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = '#160000';
      ctx.stroke();
      if (visible && !motion.matches) frame = requestAnimationFrame(draw);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const scale = Math.min(devicePixelRatio, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      draw(motion.matches ? 0 : performance.now());
    }

    function move(event) {
      const x = event.offsetX, y = event.offsetY;
      pointer = { x, y, time: performance.now() };
    }
    function leave() { pointer = null; }
    const resize = new ResizeObserver(refresh);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      refresh();
    });
    resize.observe(canvas);
    visibility.observe(canvas);
    motion.addEventListener('change', refresh);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      motion.removeEventListener('change', refresh);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
    };
  }, []);
  return <canvas ref={ref} className="waves" aria-hidden="true" />;
}
