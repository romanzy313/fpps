import { useLocation } from "preact-iso";

export function Header() {
  const { url } = useLocation();

  return (
    <header>
      <nav>
        <a href="/" className={url === "/" ? "active" : ""}>
          Home
        </a>
        <a href="/about" className={url === "/about" ? "active" : ""}>
          About
        </a>
      </nav>
    </header>
  );
}
