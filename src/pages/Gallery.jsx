import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import Image from "../components/Image";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import UserProfile from "../components/UserProfile";
import { X } from "lucide-react";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const handleCloseProfile = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
        return;
      }
      const q = query(
        collection(db, "gens"),
        orderBy("timestamp", "desc")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
      return unsub;
    });
    return () => unsubscribe && unsubscribe();
  }, [navigate]);

  const handleUserSelect = (userData) => {
    setSelectedUser(userData);
  };

  if (loading) return (
    <>
      <Navbar onProfileClick={() => handleUserSelect(auth.currentUser)} />
      <div className="text-center mt-20">Loading...</div>
    </>
  );

  const handleDelete = (deletedId) => {
    setImages(prevImages => prevImages.filter(img => img.id !== deletedId));
  };

  return (
    <>
      <Navbar onProfileClick={() => handleUserSelect(auth.currentUser)} />
      <div className="pt-16">
        <div className="w-full min-h-screen bg-slate-900 flex">
          <div className={cn(
            "py-8 transition-all duration-300 ease-in-out",
            selectedUser ? "w-2/3" : "w-full"
          )}>
            <div className="mx-auto px-8">
              <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
                {images.length > 0 ? (
                  images.map((item) => (
                    <Image
                      key={item.id}
                      url={item.outputImage}
                      metadata={{
                        ...item,
                        documentId: item.id
                      }}
                      onDelete={handleDelete}
                      onUserClick={() => {
                        handleUserSelect({
                          uid: item.userId,
                          username: item.username
                        });
                      }}
                    />
                  ))
                ) : (
                  <div className="text-white text-center">No images found</div>
                )}
              </div>
            </div>
          </div>
          
          {selectedUser && (
            <div className={cn(
              "w-1/3 bg-white border-l border-slate-200 overflow-y-auto h-[calc(100vh-4rem)] fixed right-0 top-16",
              isClosing ? "animate-slide-out" : "animate-slide-in"
            )}>
              <button
                onClick={handleCloseProfile}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>
              <UserProfile userData={selectedUser} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
