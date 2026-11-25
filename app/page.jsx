'use client';

import { useRef } from 'react';
import { club, sections } from '../lib/club';
import Waves from './Waves';
import Header from './Header';
import TitleCard from './TitleCard';
import ClubCursor from './ClubCursor';
import { usePortfolioMotion } from './PortfolioMotion';

function Word({ text }) {
  return <span className="hero-word" aria-hidden="true">{[...text].map((letter, index) =>
    <span className="glyph-mask" key={index}><span className="glyph" data-copy={letter}>{letter}</span></span>
  )}</span>;
}

export default function Home() {
  const root = useRef(null);
  usePortfolioMotion(root);
  return <main ref={root} id="top">
    <TitleCard />
    <ClubCursor />
    <a className="skip" href="#index">Skip to club index</a>
    <Header />

    <section className="hero" aria-labelledby="hero-title">
      <Waves />
      <div className="strip"><span>{club.name}</span><i /><span className="binary" aria-hidden="true">01010011</span><i /><span>Amrita</span></div>
      <h1 id="hero-title" aria-label="Srishti Club"><Word text="Srishti" /><span className="hero-mark" aria-hidden="true">✳</span><Word text="Club" /></h1>
      <div className="strip"><span>Student literary society</span><i /><span className="binary" aria-hidden="true">01010011</span><i /><a href="#about">Scroll down ↓</a></div>
    </section>

    <section id="about" tabIndex={-1} className="about">
      <div className="section-label">About us</div>
      <div className="about-grid"><div><h2>{club.tagline}</h2><p>{club.about}</p></div>
        <div className="prints" aria-hidden="true">
          <span className="print opening-quote">“</span>
          <span className="print closing-quote">”</span>
        </div>
      </div>
    </section>

    <section id="index" className="index"><h2 className="section-label">Club index</h2>
      {sections.map((section, i) => <details tabIndex={-1} id={section.id} key={section.id}>
        <summary><small>No. 0{i + 1}</small><span>{section.title}</span><b aria-hidden="true">+</b></summary>
        <div className="entries">{section.entries.length
          ? section.entries.map((entry, n) => <p key={n}>{entry}</p>)
          : <p>{section.empty}</p>}</div>
      </details>)}
    </section>

    <footer><span>Made by the {club.name} web team.</span>
      <a href="#top">Back to top ↑</a>
    </footer>
  </main>;
}
