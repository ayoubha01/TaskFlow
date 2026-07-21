import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function formatJoinDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function UserMenu() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOpen() {
    setOpen((prev) => !prev);
    setName(user.name);
    setError(null);
    setSuccess(false);
  }

  async function handleSaveName(e) {
    e.preventDefault();
    if (!name.trim() || name === user.name) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile({ name });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="user-menu" ref={containerRef}>
      <button type="button" className="user-menu__trigger" onClick={toggleOpen}>
        {user.name}
      </button>

      {open && (
        <div className="user-menu__panel">
          <div className="user-menu__section">
            <label>Name</label>
            <form onSubmit={handleSaveName} className="user-menu__name-form">
              <input value={name} onChange={(e) => setName(e.target.value)} />
              <button type="submit" disabled={saving || !name.trim() || name === user.name}>
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
            {success && <p className="user-menu__success">Name updated</p>}
          </div>

          <div className="user-menu__section">
            <label>Email</label>
            <p className="user-menu__static">{user.email}</p>
          </div>

          {user.createdAt && (
            <div className="user-menu__section">
              <label>Member since</label>
              <p className="user-menu__static">{formatJoinDate(user.createdAt)}</p>
            </div>
          )}

          <button className="user-menu__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}