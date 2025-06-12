import { useState, useEffect } from "react";
import { ImageDialog } from "../components/Image";
import Navbar from "../components/Navbar";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import { cn } from "../lib/utils";
import UserProfile from "../components/UserProfile";
import { X } from "lucide-react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    // show the loader
    setLoading(true);

    // build your Firestore query
    const imagesQuery = query(
      collection(db, "gens"),
      orderBy("timestamp", "desc")
    );

    // helper to load one image’s dims
    const loadImageDimensions = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () =>
          resolve({ width: 1200, height: 800 });
        img.src = url;
      });

    // subscribe
    const unsubscribe = onSnapshot(
      imagesQuery,
      (snapshot) => {
        // wrap in async IIFE so we can await inside
        (async () => {
          const imgs = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              const { width, height } = await loadImageDimensions(
                data.outputImage
              );
              return { id: doc.id, ...data, width, height };
            })
          );
          setImages(imgs);
          setLoading(false);
        })();
      },
      (error) => {
        console.error("Gallery listener error:", error);
        setLoading(false);
      }
    );

    // cleanup on unmount
    return () => unsubscribe();
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const handleUserSelect = (userData) => {
    setSelectedUser(userData);
  };

  return (
    <>
      <Navbar onProfileClick={() => handleUserSelect({ uid: auth.currentUser?.uid, username: auth.currentUser?.email })} />
      <div className="pt-16">
        <div className="w-full min-h-screen bg-slate-900 flex">
          <div className={cn(
            "py-8 transition-all duration-300 ease-in-out",
            selectedUser ? "w-2/3" : "w-full"
          )}>
            <div className="mx-auto px-8">
              {loading ? (
                <div className="text-white text-center">Loading images...</div>
              ) : images.length > 0 ? (
                <MasonryPhotoAlbum
                  layout="masonry"
                  spacing={8}
                  columns={4}
                  photos={images.map(item => ({
                    src: item.outputImage,
                    width: item.width,
                    height: item.height,
                    alt: `Style: ${item.style?.name || 'Unknown'}`,
                    originalItem: item
                  }))}
                  onClick={({ photo }) => {
                    const item = photo.originalItem;
                    setCurrentImage(item);
                    setIsOpen(true);
                  }}
                  breakpoints={[220, 360, 480, 600, 900, 1200]}
                />
              ) : (
                <div className="text-white text-center">No images found</div>
              )}
            </div>
          </div>
          
          {selectedUser && (
            <div className={cn(
              "w-1/3 bg-white border-l border-slate-200 overflow-y-auto h-[calc(100vh-4rem)] fixed right-0 top-16",
              isClosing ? "animate-slide-out" : "animate-slide-in"
            )}>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
              <UserProfile userData={selectedUser} />
            </div>
          )}
        </div>
      </div>

      <ImageDialog 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        image={currentImage}
        onDelete={(deletedId) => {
          setImages(prev => prev.filter(img => img.id !== deletedId));
          setIsOpen(false);
        }}
        onUserClick={(userData) => {
          setIsOpen(false);
          handleUserSelect(userData);
        }}
      />
    </>
  );
}
