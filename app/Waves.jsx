'use client';

import { useEffect, useRef } from 'react';

// Interpolate the gradient at each corner of a Perlin noise cell.
function gradient(i, j, x, y) {
  let hash = Math.imul(i, 374761393) + Math.imul(j, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash & 1) ? x : -x) + ((hash & 2) ? y : -y);
}

const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;

function perlin(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  const u = x - i, v = y - j;
  const top = mix(gradient(i, j, u, v), gradient(i + 1, j, u - 1, v), fade(u));
  const bottom = mix(gradient(i, j + 1, u, v - 1), gradient(i + 1, j + 1, u - 1, v - 1), fade(u));
  return mix(top, bottom, fade(v));
}

export default function Waves() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const originX = Math.random() * 4096;
    const originY = Math.random() * 4096;
    let pointer = null;
    let lines = [];
    let previousTime;
    let visible = true;
    let frame;
    let width, height;

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      const step = Math.min(2, (time - (previousTime ?? time - 1000 / 60)) / (1000 / 60));
      previousTime = time;
      if (pointer) {
        const dx = pointer.x - pointer.lastX, dy = pointer.y - pointer.lastY;
        const smoothing = 1 - 0.9 ** step;
        pointer.sx = mix(pointer.sx, pointer.x, smoothing);
        pointer.sy = mix(pointer.sy, pointer.y, smoothing);
        pointer.speed = Math.min(100, mix(pointer.speed, Math.hypot(dx, dy) / Math.max(.1, step), smoothing));
        if (dx || dy) pointer.angle = Math.atan2(dy, dx);
        pointer.lastX = pointer.x;
        pointer.lastY = pointer.y;
      }
      const seconds = time / 1000;
      const damping = 0.925 ** step;
      for (const points of lines) {
        for (const [index, p] of points.entries()) {
          const u = originX + p.x * .0024;
          const v = originY + p.y * .002;
          const current = perlin(u * .65 - seconds * .09, v * .65 + seconds * .06);
          const swell = perlin(u + current * .7 + seconds * .04, v - current * .4);
          const ripple = perlin(u * 2.1 - seconds * .12, v * 1.8 + seconds * .08);
          const phase = swell * 9 + ripple * 2.2;
          if (pointer) {
            const distance = Math.hypot(p.x - pointer.sx, p.y - pointer.sy);
            if (distance < 175) {
              const force = Math.cos(distance * .001) * (175 - distance) * pointer.speed * .00065 * step;
              p.vx += Math.cos(pointer.angle) * force;
              p.vy += Math.sin(pointer.angle) * force;
            }
          }
          p.vx = (p.vx - p.offsetX * .005 * step) * damping;
          p.vy = (p.vy - p.offsetY * .005 * step) * damping;
          p.offsetX = Math.max(-100, Math.min(100, p.offsetX + p.vx * 2 * step));
          p.offsetY = Math.max(-100, Math.min(100, p.offsetY + p.vy * 2 * step));
          const x = p.x + Math.cos(phase) * (34 + current * 14) + p.offsetX;
          const y = p.y + Math.sin(phase) * (17 + ripple * 6) + p.offsetY;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
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
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      previousTime = undefined;
      pointer = null;
      const columns = Math.ceil((width + 200) / 10);
      const rows = Math.ceil((height + 96) / 32);
      lines = Array.from({ length: columns + 1 }, (_, i) =>
        Array.from({ length: rows + 1 }, (_, j) => ({
          x: (width - columns * 10) / 2 + i * 10,
          y: (height - rows * 32) / 2 + j * 32,
          offsetX: 0, offsetY: 0, vx: 0, vy: 0,
        }))
      );
      draw(motion.matches ? 0 : performance.now());
    }

    function move(event) {
      const x = event.offsetX, y = event.offsetY;
      if (!pointer) pointer = { sx: x, sy: y, lastX: x, lastY: y, speed: 0, angle: 0 };
      pointer.x = x;
      pointer.y = y;
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
