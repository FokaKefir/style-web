import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import Image from "../components/Image";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) return (
    <>
      <Navbar />
      <div className="text-center mt-20">Loading...</div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <div className="w-full min-h-screen bg-slate-900 flex justify-center py-8 overflow-hidden relative">
          <div className="rounded sm:columns-2 md:columns-3 xl:columns-4 gap-2 w-11/12 box-border">
            {images.length > 0 ? (
              images.map((item) => (
                <Image url={item.outputImage} key={item.id} />
              ))
            ) : (
              <div className="text-white">No images found</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
