'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { club, sections } from '../lib/club';

const local = [['About', '#about'], ...sections.map(({title,id}) => [title, '#' + id])];
export default function Header() {
  const trigger = useRef(null);
  const lastLink = useRef(null);
  const destination = useRef(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (open) {
      const header = trigger.current.closest('header');
      const background = [...header.parentElement.children].filter(el => el !== header && !el.inert);
      background.forEach(el => { el.inert = true; });
      trigger.current.focus({preventScroll: true});
      return () => { background.forEach(el => { el.inert = false; }); };
    }
    const target = destination.current;
    if (target) {
      destination.current = null;
      if (target instanceof HTMLDetailsElement) target.open = true;
      location.hash = target.id;
      target.focus({preventScroll: true});
      target.scrollIntoView();
    }
  }, [open]);

  function dismiss() {
    trigger.current.focus({preventScroll: true});
    setOpen(false);
  }
  function handleKey(event) {
    if (!open) return;
    if (event.key === 'Escape') dismiss();
    if (event.key !== 'Tab') return;
    const first = trigger.current;
    const last = lastLink.current;
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function follow(event, href) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    destination.current = target;
    setOpen(false);
  }

  return <header className="club-header" data-menu-open={open} onKeyDown={handleKey}>
    <a className="brand" href="#top" inert={open} aria-label={club.name + ' home'}><img src="/srishti-header.svg" width="56" height="56" alt="" /></a>
    <div className="menu-shell" role={open ? 'dialog' : undefined} aria-modal={open || undefined} aria-label={open ? 'Site menu' : undefined}>
      <button ref={trigger} className="menu-trigger" onClick={() => setOpen(value => !value)}
        aria-haspopup="dialog" aria-controls="site-menu" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
        <span className="burger-lines" aria-hidden="true" />Menu
      </button>
      <div className="menu-backdrop" aria-hidden="true" onClick={dismiss} />
      <div id="site-menu" inert={!open}>
        <div className="menu-surface" />
        <div className="menu-panel">
          <div className="menu-body">
            <nav className="menu-links prominent" aria-label="Club sections">
              <h2>{club.name} · Literature club</h2>
              {local.map(([label, href], index) =>
                <a key={href} href={href} ref={index === local.length - 1 ? lastLink : undefined}
                  onClick={event => follow(event, href)}><span>{label}</span></a>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  </header>;
}
