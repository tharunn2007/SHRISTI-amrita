'use client';

import { useEffect, useRef } from 'react';

const controls = 'a[href], button:enabled, summary';
const clickable = `${controls}, .menu-backdrop`;
const approachRadius = 56;
const shapeCenter = 12;
const pointerCorners = [[3, 2], [21, 15.5], [7, 22]];
const circleRadius = 8;
const arcHandle = (4 / 3) * Math.tan(Math.PI / 6) * circleRadius;

// Three matching Bézier segments let each rounded corner tighten into a point.
const circleCorners = pointerCorners.map((_, index) => {
  const angle = -3 * Math.PI / 4 + index * 2 * Math.PI / 3;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  return [shapeCenter + x * circleRadius, shapeCenter + y * circleRadius, -y * arcHandle, x * arcHandle];
});

function cursorPath(amount) {
  const blend = (round, sharp) => round + (sharp - round) * amount;
  const [startX, startY] = circleCorners[0];
  const [tipX, tipY] = pointerCorners[0];
  let path = `M ${blend(startX, tipX)} ${blend(startY, tipY)}`;
  for (let index = 0; index < circleCorners.length; index++) {
    const next = (index + 1) % circleCorners.length;
    const [x, y, handleX, handleY] = circleCorners[index];
    const [endX, endY, endHandleX, endHandleY] = circleCorners[next];
    const [ax, ay] = pointerCorners[index];
    const [bx, by] = pointerCorners[next];
    path += ` C ${blend(x + handleX, (2 * ax + bx) / 3)} ${blend(y + handleY, (2 * ay + by) / 3)}`;
    path += ` ${blend(endX - endHandleX, (ax + 2 * bx) / 3)} ${blend(endY - endHandleY, (ay + 2 * by) / 3)}`;
    path += ` ${blend(endX, bx)} ${blend(endY, by)}`;
  }
  return `path("${path} Z")`;
}

function targetSharpness({ x, y }) {
  if (document.elementFromPoint(x, y)?.closest(clickable)) return 1;

  let nearest = approachRadius;
  for (const control of document.querySelectorAll(controls)) {
    if (control.closest('[inert]')) continue;
    for (const rect of control.getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      const nearX = Math.max(rect.left + .5, Math.min(rect.right - .5, x));
      const nearY = Math.max(rect.top + .5, Math.min(rect.bottom - .5, y));
      const distance = Math.hypot(nearX - x, nearY - y);
      if (distance < nearest && control.contains(document.elementFromPoint(nearX, nearY))) {
        nearest = distance;
      }
    }
  }
  const approach = 1 - nearest / approachRadius;
  return approach * approach * (3 - 2 * approach);
}

export default function ClubCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const shape = cursor.firstElementChild;
    const root = document.documentElement;
    const preference = matchMedia(
      '(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)'
    );
    const listeners = new AbortController();
    const options = { passive: true, signal: listeners.signal };
    const pointer = { x: 0, y: 0 };
    const spring = { x: 0, y: 0, vx: 0, vy: 0 };
    const morph = { value: 0, velocity: 0, target: 0 };
    let active = false;
    let frame = 0;
    let previousTime = 0;
    let needsHitTest = false;

    function paint(speed) {
      const sharpness = Math.max(0, Math.min(1, morph.value));
      const lagX = spring.x - pointer.x;
      const lagY = spring.y - pointer.y;
      // Keep the cursor close to the actual click position during fast moves.
      const lagScale = Math.min(1, 8 / Math.max(1, Math.hypot(lagX, lagY))) * (1 - .8 * sharpness);
      const x = pointer.x + lagX * lagScale;
      const y = pointer.y + lagY * lagScale;
      const stretch = Math.min(speed / 4000, .28) * (1 - sharpness);
      const [tipX, tipY] = pointerCorners[0];
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      cursor.style.setProperty('--cursor-angle', `${Math.atan2(spring.vy, spring.vx)}rad`);
      cursor.style.setProperty('--cursor-stretch', 1 + stretch);
      cursor.style.setProperty('--cursor-squeeze', 1 - stretch * .6);
      shape.style.clipPath = cursorPath(sharpness);
      shape.style.translate = `${(shapeCenter - tipX) * sharpness}px ${(shapeCenter - tipY) * sharpness}px`;
    }

    function tick(time) {
      frame = 0;
      if (needsHitTest) {
        morph.target = targetSharpness(pointer);
        needsHitTest = false;
      }

      const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 1 / 30) : 1 / 60;
      previousTime = time;
      const steps = Math.max(1, Math.ceil(elapsed * 120));
      const step = elapsed / steps;
      for (let i = 0; i < steps; i++) {
        spring.vx += (1800 * (pointer.x - spring.x) - 58 * spring.vx) * step;
        spring.vy += (1800 * (pointer.y - spring.y) - 58 * spring.vy) * step;
        spring.x += spring.vx * step;
        spring.y += spring.vy * step;
        morph.velocity += (240 * (morph.target - morph.value) - 30 * morph.velocity) * step;
        morph.value += morph.velocity * step;
      }

      const speed = Math.hypot(spring.vx, spring.vy);
      const distance = Math.hypot(pointer.x - spring.x, pointer.y - spring.y);
      const shapeSettled = Math.abs(morph.target - morph.value) < .001 && Math.abs(morph.velocity) < .02;
      if (distance < .15 && speed < 4 && shapeSettled) {
        Object.assign(spring, pointer, { vx: 0, vy: 0 });
        morph.value = morph.target;
        morph.velocity = 0;
        previousTime = 0;
        paint(0);
        return;
      }
      paint(speed);
      frame = requestAnimationFrame(tick);
    }

    function refresh() {
      if (!active) return;
      needsHitTest = true;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function hide() {
      if (!active) return;
      active = false;
      root.removeAttribute('data-club-cursor');
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }

    function move(event) {
      const { clientX, clientY, pointerType } = event;
      if (!preference.matches || pointerType !== 'mouse' ||
          clientX < 0 || clientY < 0 || clientX >= root.clientWidth || clientY >= root.clientHeight) {
        hide();
        return;
      }
      pointer.x = clientX;
      pointer.y = clientY;
      if (!active) {
        active = true;
        Object.assign(spring, pointer, { vx: 0, vy: 0 });
        morph.target = targetSharpness(pointer);
        morph.value = morph.target;
        morph.velocity = 0;
        paint(0);
        root.setAttribute('data-club-cursor', '');
        return;
      }
      refresh();
    }

    document.addEventListener('pointermove', move, options);
    root.addEventListener('pointerleave', hide, options);
    window.addEventListener('blur', hide, options);
    preference.addEventListener('change', hide, options);
    for (const event of ['scroll', 'resize', 'click', 'focusin', 'transitionend', 'animationend']) {
      window.addEventListener(event, refresh, { ...options, capture: true });
    }

    return () => {
      listeners.abort();
      hide();
    };
  }, []);

  return <>
    <link rel="stylesheet" href="/club-cursor.css" precedence="default" />
    <span ref={cursorRef} className="club-cursor" aria-hidden="true">
      <span className="club-cursor-shape" />
    </span>
  </>;
}
