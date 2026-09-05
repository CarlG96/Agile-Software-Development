import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <button className="logout-button" type="button" onClick={handleLogout}>
      Log out
    </button>
  );
}