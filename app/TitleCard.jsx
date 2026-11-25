export default function TitleCard() {
  return <>
    <link rel="stylesheet" href="/title-card.css" precedence="default" />
    <div className="title-card" aria-hidden="true">
      <div className="title-card-content">
        <span className="brand-logo title-card-logo" />
        <span>Srishti Club</span>
      </div>
    </div>
  </>;
}
