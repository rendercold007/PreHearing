import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "./Logo";

export function AppHeader() {
    const { email, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <header className="site-header">
            <Logo />
            <div className="user-menu">
                <NavLink to="/app" className="nav-link">
                    Analyze
                </NavLink>
                <NavLink to="/cases" className="nav-link">
                    Case history
                </NavLink>
                <span className="user-email">{email}</span>
                <button type="button" className="logout-button" onClick={handleLogout}>
                    Sign out
                </button>
            </div>
        </header>
    );
}
