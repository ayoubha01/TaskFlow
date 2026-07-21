import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import UserMenu from "./UserMenu.jsx";

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="layout">
      <header className="navbar">
        <Link to="/" className="navbar__brand">
          <span className="navbar__mark" />
          TaskFlow
        </Link>
        {user && <UserMenu />}
      </header>
      <main className="layout__content">{children}</main>
    </div>
  );
}