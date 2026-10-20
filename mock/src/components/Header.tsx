interface HeaderProps {
  disabled: boolean;
  onOpenAssumptions: () => void;
  onOpenData: () => void;
}

export function Header({ disabled, onOpenAssumptions, onOpenData }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <img
          className="header__logo"
          src={`${import.meta.env.BASE_URL}logo.jpeg`}
          alt=""
          width={40}
          height={40}
        />
        <h1 className="header__title">InfraVana Playground</h1>
        <span className="pill pill--placeholder">Mock: invented placeholder data</span>
      </div>
      <nav className="header__actions" aria-label="Page information">
        <button type="button" className="button" disabled={disabled} onClick={onOpenAssumptions}>
          Assumptions
        </button>
        <button type="button" className="button" disabled={disabled} onClick={onOpenData}>
          Data
        </button>
      </nav>
    </header>
  );
}
