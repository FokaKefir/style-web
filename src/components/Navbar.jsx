import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import UserProfile from "./UserProfile";
import { GenerateDrawer } from "./GenerateDrawer";

export default function Navbar({ onProfileClick }) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <nav className="bg-slate-800 p-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Style Gallery Logo" 
            className="h-8 w-8"
          />
          <span className="text-white text-xl font-bold">Style Gallery</span>
        </div>
        <div className="flex items-center gap-4">
          <UserProfile 
            userData={user} 
            isButton={true}
            onClick={onProfileClick}
          />
          <GenerateDrawer />
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
