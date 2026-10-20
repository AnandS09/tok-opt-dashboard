/** The page header: logo and the page's name. */
export function Header() {
  return (
    <header className="header">
      <img className="header__logo" src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="" width={40} height={40} />
      <div>
        <h1 className="header__title">AI Budget Playground</h1>
        <p className="header__tagline">See how far your AI budget can stretch.</p>
      </div>
    </header>
  );
}
