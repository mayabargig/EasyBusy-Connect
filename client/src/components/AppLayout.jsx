import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { CanvasLogo } from "./CanvasLogo";

export function AppLayout() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="EasyBusy Connect home">
          <CanvasLogo />
          <span>EasyBusy Connect</span>
        </NavLink>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/discover">Discover</NavLink>
              <NavLink to="/posts">Posts</NavLink>
              <NavLink to="/appointments">Appointments</NavLink>
              <NavLink to="/chat">Chat</NavLink>
              <NavLink to="/stats">Stats</NavLink>
              <NavLink to="/profile">My profile</NavLink>
              <button className="link-button" onClick={handleLogout} type="button">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink className="nav-cta" to="/register">Join now</NavLink>
            </>
          )}
        </nav>

        {user && <span className="welcome-label">Hi, {user.firstName}</span>}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>EasyBusy Connect · Local businesses, stronger communities.</p>
      </footer>
    </div>
  );
}
