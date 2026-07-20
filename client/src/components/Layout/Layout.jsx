import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <header className="navbar">
        <Link to="/" className="navbar__brand">TaskFlow</Link>
        {user && (
          <div className="navbar__user">
            <span>{user.name}</span>
            <button onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>
      <main className="layout__content">{children}</main>
    </div>
  );
}