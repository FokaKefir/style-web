import * as React from "react"
import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer"
import { Upload } from "lucide-react"
import ImageCarousel from "./ImageCarousel"

export function GenerateDrawer() {
  const [open, setOpen] = useState(false);
  const [styleSliderVal, setStyleWeight] = useState(1);
  const [tvSliderVal, setTvWeight] = useState(1);
  const [iterations, setIterations] = useState(500);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [styles, setStyles] = useState([]);
  const [selectedStyleIdx, setSelectedStyleIdx] = useState(0);
  const [initMethod, setInitMethod] = useState("random");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [username, setUsername] = useState("");


  

  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      setUsername(snap.data()?.name);
    };
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        // only fetch once we actually have a user
        fetchUsername(user);
      } else {
        setUsername("");
      }
    });

    return unsubscribe;
  }, []);


  
  useEffect(() => {
    let unsubscribeUserStyles = null;

    const loadAndWatchStyles = async () => {
      const basicSnap = await getDocs(collection(db, "styles"));
      const basicStyles = basicSnap.docs.map(doc => ({
        documentId: doc.id,
        ...doc.data(),
        given: true,
        timestamp: doc.data().timestamp || new Date(0),
      }));

      let combined = [...basicStyles];

      const user = auth.currentUser;
      if (user) {
        const userStylesRef = collection(db, "users", user.uid, "styles");
        const userSnap = await getDocs(userStylesRef);

        const userStyles = userSnap.docs.map(doc => ({
          documentId: doc.id,
          ...doc.data(),
          given: false,
          timestamp: doc.data().timestamp || new Date(),
        }));

        userStyles.sort((a, b) => {
          const ta = a.timestamp?.toMillis?.() ?? a.timestamp.getTime();
          const tb = b.timestamp?.toMillis?.() ?? b.timestamp.getTime();
          return tb - ta;
        });

        combined = [...userStyles, ...basicStyles];

        unsubscribeUserStyles = onSnapshot(userStylesRef, snapshot => {
          setStyles(prev => {
            // split off basic from prior state
            const basicOnly = prev.filter(s => s.given);
            let usersOnly = prev.filter(s => !s.given);

            snapshot.docChanges().forEach(change => {
              const data = change.doc.data();
              const updated = {
                documentId: change.doc.id,
                ...data,
                given: false,
                timestamp: data.timestamp || new Date(),
              };

              if (change.type === "added") {
                if (!usersOnly.some(s => s.documentId === updated.documentId)) {
                  usersOnly.push(updated);
                }
              } else if (change.type === "modified") {
                usersOnly = usersOnly.map(s =>
                  s.documentId === updated.documentId ? updated : s
                );
              } else if (change.type === "removed") {
                usersOnly = usersOnly.filter(s => s.documentId !== updated.documentId);
              }
            });

            // resort user styles
            usersOnly.sort((a, b) => {
              const ta = a.timestamp?.toMillis?.() ?? a.timestamp.getTime();
              const tb = b.timestamp?.toMillis?.() ?? b.timestamp.getTime();
              return tb - ta;
            });

            return [...usersOnly, ...basicOnly];
          });
        });
      }

      setStyles(combined);

      if (combined.length && selectedStyleIdx >= combined.length) {
        setSelectedStyleIdx(0);
      }
    };

    loadAndWatchStyles().catch(console.error);

    return () => {
      if (unsubscribeUserStyles) unsubscribeUserStyles();
    };
  }, [selectedStyleIdx]);

  // helper to reset everything
  const clearContent = () => {
    setSelectedImageFile(null);
    setSelectedStyleIdx(0);
    setStyleWeight(1);
    setTvWeight(1);
    setIterations(500);
    setInitMethod("random");
  };

  const styleSliderValToWeight = (weight) => {
    const weights = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000, 30000, 100000]
    return weights[weight * 2]
  }

  const tvSliderValToWeight = (weight) => {
    const weights = [1, 10, 100, 1000, 10000, 100000]
    return weights[weight];
  }

  const handleImageSelect = e => {
    const f = e.target.files[0];
    if (f) {
      setSelectedImageFile(f);
    }
  };

  const uploadContentImage = async () => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", selectedImageFile);
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/content/upload/`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error(res.statusText);
      const { image_name } = await res.json();
      return image_name;
    } finally {
      setIsUploading(false);
    }
  };

   const handleGenerate = async () => {
    if (!selectedImageFile) return alert("Please select an image first!");
    setIsGenerating(true);
    try {
      // 1) Upload
      const imageName = await uploadContentImage();

      // 2) Firestore write
      const styleWeight = styleSliderValToWeight(styleSliderVal);
      const tvWeight    = tvSliderValToWeight(tvSliderVal);
      const genData = {
        userId: auth.currentUser.uid,
        username,
        outputImage: `${process.env.REACT_APP_BACKEND_URL}/image/generated/loading.gif`,
        contentImage: `${process.env.REACT_APP_BACKEND_URL}/image/content/${imageName}`,
        style: styles[selectedStyleIdx],
        initMethod,
        styleSliderVal,
        styleWeight,
        tvSliderVal,
        tvWeight,
        iterations,
        timestamp: serverTimestamp(),
      };
      const genRef = await addDoc(collection(db, "gens"), genData);

      // 3) Kick off backend /generate but don’t block forever
      let didError = false;
      const styleImgName = styles[selectedStyleIdx].image.replace(
        `${process.env.REACT_APP_BACKEND_URL}/image/style/`,
        ""
      );
      const backendPromise = fetch(
        `${process.env.REACT_APP_BACKEND_URL}/generate?` +
          new URLSearchParams({
            doc_id:      genRef.id,
            content_img: imageName,
            style_img:   styleImgName,
            init_method: initMethod,
            style_weight: styleWeight,
            tv_weight:    tvWeight,
            iterations:   iterations,
          }).toString(),
        { method: "POST" }
      )
        .then(res => {
          if (!res.ok) throw new Error(res.statusText);
          return res;
        })
        .catch(err => {
          didError = true;
          console.error("Generate error:", err);
        });

      // 4) If we get no error for 2 s, close + clear
      await Promise.race([
        backendPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      if (!didError) {
        setOpen(false);
        clearContent();
      }

      // (optional) let backend finish in background
      await backendPromise;
    } catch (err) {
      console.error(err);
      alert("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Drawer handleOnly={true} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">Generate</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl px-6">
          <DrawerHeader>
            <DrawerTitle>Generate Image</DrawerTitle>
            <DrawerDescription>Transform your images with AI-powered style transfer.</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Content Image</h3>
                  <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden">
                    {selectedImageFile ? (
                      <img
                        src={URL.createObjectURL(selectedImageFile)}
                        alt="Content preview"
                        className="h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Click to upload content image
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {isUploading && <p className="mt-2">Uploading…</p>}
                </div>
                <div>
                  <h3 className="font-medium mb-4">Select Style</h3>
                  <div className="w-full flex justify-center">
                    <ImageCarousel
                      images={styles.map(s => s.image || "")}
                      selectedIndex={selectedStyleIdx}
                      setSelectedIndex={setSelectedStyleIdx}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Parameters</h3>
                  <Slider
                    label="Stylishness"
                    value={styleSliderVal}
                    onValueChange={setStyleWeight}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />

                  <Slider
                    label="Smoothness"
                    value={tvSliderVal}
                    onValueChange={setTvWeight}
                    min={0}
                    max={5}
                    step={1}
                    className="w-full"
                  />

                  <Slider
                    label="Duration"
                    value={iterations}
                    onValueChange={setIterations}
                    min={500}
                    max={3000}
                    step={500}
                    className="w-full"
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-2">Initialization Method</h3>
                  <select 
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={initMethod}
                    onChange={(e) => setInitMethod(e.target.value)}
                  >
                    <option value="random">Random initialization</option>
                    <option value="content">Content-based initialization</option>
                    <option value="style">Style-based initialization</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-row space-x-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={
                !selectedImageFile ||
                isUploading ||
                isGenerating
              }
              onClick={handleGenerate}
            >
              {isGenerating ? "Generating…" : "Generate"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
