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
import { Upload, X } from "lucide-react"
import ImageCarousel from "./ImageCarousel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"

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

  // Segmentation form states
  const [segPersonStyleSliderVal, setSegPersonStyleWeight] = useState(1);
  const [segBackgroundStyleSliderVal, setSegBackgroundStyleWeight] = useState(1);
  const [segTvSliderVal, setSegTvWeight] = useState(1);
  const [segIterations, setSegIterations] = useState(500);
  const [segSelectedImageFile, setSegSelectedImageFile] = useState(null);
  const [segPersonStyleIdx, setSegPersonStyleIdx] = useState(0);
  const [segBackgroundStyleIdx, setSegBackgroundStyleIdx] = useState(1);
  const [segInitMethod, setSegInitMethod] = useState("content");
  const [segPersonStyleEnabled, setSegPersonStyleEnabled] = useState(true);
  const [segBackgroundStyleEnabled, setSegBackgroundStyleEnabled] = useState(true);

  // Multi-style form states
  const [multiStyleSliderVal, setMultiStyleWeight] = useState(1);
  const [multiTvSliderVal, setMultiTvWeight] = useState(1);
  const [multiIterations, setMultiIterations] = useState(500);
  const [multiSelectedImageFile, setMultiSelectedImageFile] = useState(null);
  const [multiInitMethod, setMultiInitMethod] = useState("random");
  const [multiSelectedStyles, setMultiSelectedStyles] = useState([]);
  const [blendMode, setBlendMode] = useState("average");

  // Track current active tab
  const [activeTab, setActiveTab] = useState("basic");


  

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
    // Basic tab states
    setSelectedImageFile(null);
    setSelectedStyleIdx(0);
    setStyleWeight(1);
    setTvWeight(1);
    setIterations(500);
    setInitMethod("random");
    
    // Segmentation tab states
    setSegSelectedImageFile(null);
    setSegPersonStyleIdx(0);
    setSegBackgroundStyleIdx(1);
    setSegPersonStyleWeight(1);
    setSegBackgroundStyleWeight(1);
    setSegTvWeight(1);
    setSegIterations(500);
    setSegInitMethod("content");
    setSegPersonStyleEnabled(true);
    setSegBackgroundStyleEnabled(true);
    
    // Multi-style tab states
    setMultiSelectedImageFile(null);
    setMultiStyleWeight(1);
    setMultiTvWeight(1);
    setMultiIterations(500);
    setMultiInitMethod("random");
    setMultiSelectedStyles([]);
    setBlendMode("average");
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

  const handleSegImageSelect = e => {
    const f = e.target.files[0];
    if (f) {
      setSegSelectedImageFile(f);
    }
  };

  const handleMultiImageSelect = e => {
    const f = e.target.files[0];
    if (f) {
      setMultiSelectedImageFile(f);
    }
  };

  const toggleMultiStyle = (styleIndex) => {
    setMultiSelectedStyles(prev => {
      if (prev.includes(styleIndex)) {
        return prev.filter(idx => idx !== styleIndex);
      } else {
        return [...prev, styleIndex];
      }
    });
  };

   const handleGenerate = async () => {
    // Get current tab data
    let currentImageFile, currentStyleIdx, currentStyleVal, currentTvVal, currentIterations, currentInitMethod;
    
    if (activeTab === "basic") {
      if (!selectedImageFile) return alert("Please select an image first!");
      currentImageFile = selectedImageFile;
      currentStyleIdx = selectedStyleIdx;
      currentStyleVal = styleSliderVal;
      currentTvVal = tvSliderVal;
      currentIterations = iterations;
      currentInitMethod = initMethod;
    } else if (activeTab === "segmentation") {
      if (!segSelectedImageFile) return alert("Please select an image first!");
      if (!segPersonStyleEnabled && !segBackgroundStyleEnabled) return alert("Please enable at least one style (Person or Background)!");
      if (segPersonStyleEnabled && segBackgroundStyleEnabled && segPersonStyleIdx === segBackgroundStyleIdx) {
        return alert("Person and background styles must be different when both are enabled!");
      }
      currentImageFile = segSelectedImageFile;
      // Use separate variables for segmentation
      currentTvVal = segTvSliderVal;
      currentIterations = segIterations;
      currentInitMethod = segInitMethod;
    } else if (activeTab === "multi-style") {
      if (!multiSelectedImageFile) return alert("Please select an image first!");
      if (multiSelectedStyles.length < 2) return alert("Please select at least 2 styles for multi-style generation!");
      currentImageFile = multiSelectedImageFile;
      currentStyleIdx = multiSelectedStyles[0]; // Use first selected style as primary
      currentStyleVal = multiStyleSliderVal;
      currentTvVal = multiTvSliderVal;
      currentIterations = multiIterations;
      currentInitMethod = multiInitMethod;
    }

    setIsGenerating(true);
    try {
      // 1) Upload content image
      setIsUploading(true);
      const form = new FormData();
      form.append("file", currentImageFile);
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/content/upload/`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error(res.statusText);
      const { image_name } = await res.json();
      setIsUploading(false);

      if (activeTab === "segmentation") {
        // Handle segmentation generation
        const personStyleWeight = segPersonStyleEnabled ? styleSliderValToWeight(segPersonStyleSliderVal) : 0;
        const backgroundStyleWeight = segBackgroundStyleEnabled ? styleSliderValToWeight(segBackgroundStyleSliderVal) : 0;
        const tvWeight = tvSliderValToWeight(currentTvVal);
        
        const genData = {
          userId: auth.currentUser.uid,
          username,
          outputImage: `${process.env.REACT_APP_BACKEND_URL}/image/generated/loading.gif`,
          contentImage: `${process.env.REACT_APP_BACKEND_URL}/image/content/${image_name}`,
          personStyle: segPersonStyleEnabled ? styles[segPersonStyleIdx] : null,
          backgroundStyle: segBackgroundStyleEnabled ? styles[segBackgroundStyleIdx] : null,
          initMethod: currentInitMethod,
          personStyleWeight,
          backgroundStyleWeight,
          segPersonStyleEnabled,
          segBackgroundStyleEnabled,
          tvSliderVal: currentTvVal,
          tvWeight,
          iterations: currentIterations,
          generationType: activeTab,
          timestamp: serverTimestamp(),
        };

        const genRef = await addDoc(collection(db, "gens"), genData);

        const params = {
          doc_id: genRef.id,
          content_img: image_name,
          init_method: currentInitMethod,
          tv_weight: tvWeight,
          iterations: currentIterations,
        };

        // Add style parameters only if enabled
        if (segPersonStyleEnabled) {
          const personStyleImgName = styles[segPersonStyleIdx].image.replace(
            `${process.env.REACT_APP_BACKEND_URL}/image/style/`,
            ""
          );
          params.style_person_img = personStyleImgName;
          params.style_person_weight = personStyleWeight;
        }

        if (segBackgroundStyleEnabled) {
          const backgroundStyleImgName = styles[segBackgroundStyleIdx].image.replace(
            `${process.env.REACT_APP_BACKEND_URL}/image/style/`,
            ""
          );
          params.style_background_img = backgroundStyleImgName;
          params.style_background_weight = backgroundStyleWeight;
        }

        const backendPromise = fetch(
          `${process.env.REACT_APP_BACKEND_URL}/generate_seg?` +
            new URLSearchParams(params).toString(),
          { method: "POST" }
        )
          .then(res => {
            if (!res.ok) throw new Error(res.statusText);
            return res;
          })
          .catch(err => {
            console.error("Generate error:", err);
          });

        await Promise.race([
          backendPromise,
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        setOpen(false);
        clearContent();
        await backendPromise;
      } else {
        // Handle basic and multi-style generation (existing logic)
        const styleWeight = styleSliderValToWeight(currentStyleVal);
        const tvWeight = tvSliderValToWeight(currentTvVal);
        const genData = {
          userId: auth.currentUser.uid,
          username,
          outputImage: `${process.env.REACT_APP_BACKEND_URL}/image/generated/loading.gif`,
          contentImage: `${process.env.REACT_APP_BACKEND_URL}/image/content/${image_name}`,
          style: styles[currentStyleIdx],
          initMethod: currentInitMethod,
          styleSliderVal: currentStyleVal,
          styleWeight,
          tvSliderVal: currentTvVal,
          tvWeight,
          iterations: currentIterations,
          generationType: activeTab,
          timestamp: serverTimestamp(),
        };

        // Add tab-specific data for multi-style
        if (activeTab === "multi-style") {
          genData.selectedStyles = multiSelectedStyles.map(idx => styles[idx]);
          genData.blendMode = blendMode;
          genData.multiStyleCount = multiSelectedStyles.length;
        }

        const genRef = await addDoc(collection(db, "gens"), genData);

        // 3) Kick off backend /generate but don't block forever
        let didError = false;
        const styleImgName = styles[currentStyleIdx].image.replace(
          `${process.env.REACT_APP_BACKEND_URL}/image/style/`,
          ""
        );
        
        // Build URL params based on generation type
        const params = {
          doc_id: genRef.id,
          content_img: image_name,
          style_img: styleImgName,
          init_method: currentInitMethod,
          style_weight: styleWeight,
          tv_weight: tvWeight,
          iterations: currentIterations,
          generation_type: activeTab,
        };

        if (activeTab === "multi-style") {
          params.blend_mode = blendMode;
          params.selected_styles = multiSelectedStyles.join(",");
        }

        const backendPromise = fetch(
          `${process.env.REACT_APP_BACKEND_URL}/generate?` +
            new URLSearchParams(params).toString(),
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
      }
    } catch (err) {
      console.error(err);
      alert("Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
      setIsUploading(false);
    }
  };

  return (
    <Drawer handleOnly={true} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">Generate</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl px-6">
          <DrawerHeader className="relative">
            <DrawerClose asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
            <DrawerTitle>Generate Image</DrawerTitle>
            <DrawerDescription>Transform your images with AI-powered style transfer.</DrawerDescription>
          </DrawerHeader>

          <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
              <TabsTrigger value="multi-style">Multi-Style</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="flex flex-col gap-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                      <h3 className="font-medium mb-1">Select Style</h3>
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
            </TabsContent>

            <TabsContent value="segmentation">
              <div className="flex flex-col gap-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-4">Content Image</h3>
                      <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden">
                        {segSelectedImageFile ? (
                          <img
                            src={URL.createObjectURL(segSelectedImageFile)}
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
                          onChange={handleSegImageSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {isUploading && <p className="mt-2">Uploading…</p>}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="personStyleEnabled"
                          checked={segPersonStyleEnabled}
                          onChange={(e) => setSegPersonStyleEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="personStyleEnabled" className="font-medium">
                          Person Style
                        </label>
                      </div>
                      <div className={`w-full flex justify-center ${!segPersonStyleEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <ImageCarousel
                          images={styles.map(s => s.image || "")}
                          selectedIndex={segPersonStyleIdx}
                          setSelectedIndex={setSegPersonStyleIdx}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="backgroundStyleEnabled"
                          checked={segBackgroundStyleEnabled}
                          onChange={(e) => setSegBackgroundStyleEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="backgroundStyleEnabled" className="font-medium">
                          Background Style
                        </label>
                      </div>
                      <div className={`w-full flex justify-center ${!segBackgroundStyleEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <ImageCarousel
                          images={styles.map(s => s.image || "")}
                          selectedIndex={segBackgroundStyleIdx}
                          setSelectedIndex={setSegBackgroundStyleIdx}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Style Parameters</h3>
                      {segPersonStyleEnabled && (
                        <Slider
                          label="Person Style Strength"
                          value={segPersonStyleSliderVal}
                          onValueChange={setSegPersonStyleWeight}
                          min={0}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                      )}

                      {segBackgroundStyleEnabled && (
                        <Slider
                          label="Background Style Strength"
                          value={segBackgroundStyleSliderVal}
                          onValueChange={setSegBackgroundStyleWeight}
                          min={0}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                      )}

                      <Slider
                        label="Smoothness"
                        value={segTvSliderVal}
                        onValueChange={setSegTvWeight}
                        min={0}
                        max={5}
                        step={1}
                        className="w-full"
                      />

                      <Slider
                        label="Duration"
                        value={segIterations}
                        onValueChange={setSegIterations}
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
                        value={segInitMethod}
                        onChange={(e) => setSegInitMethod(e.target.value)}
                      >
                        <option value="content">Content-based initialization</option>
                        <option value="random">Random initialization</option>
                        <option value="style">Style-based initialization</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="multi-style">
              <div className="flex flex-col gap-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium mb-4">Content Image</h3>
                      <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden">
                        {multiSelectedImageFile ? (
                          <img
                            src={URL.createObjectURL(multiSelectedImageFile)}
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
                          onChange={handleMultiImageSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {isUploading && <p className="mt-2">Uploading…</p>}
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">
                        Select Multiple Styles ({multiSelectedStyles.length} selected)
                      </h3>
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                        {styles.map((style, index) => (
                          <div
                            key={index}
                            className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                              multiSelectedStyles.includes(index)
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleMultiStyle(index)}
                          >
                            <img
                              src={style.image}
                              alt={`Style ${index + 1}`}
                              className="w-full h-16 object-cover"
                            />
                            {multiSelectedStyles.includes(index) && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click on styles to select multiple. Minimum 2 styles required.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Multi-Style Settings</h3>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Blend Mode</label>
                        <select 
                          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={blendMode}
                          onChange={(e) => setBlendMode(e.target.value)}
                        >
                          <option value="average">Average Blend</option>
                          <option value="weighted">Weighted Blend</option>
                          <option value="sequential">Sequential Application</option>
                          <option value="regions">Region-based Blend</option>
                          <option value="frequency">Frequency Domain Blend</option>
                        </select>
                      </div>

                      {multiSelectedStyles.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Style Weights</label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {multiSelectedStyles.map((styleIdx, i) => (
                              <div key={styleIdx} className="flex items-center space-x-2">
                                <img
                                  src={styles[styleIdx]?.image}
                                  alt={`Style ${styleIdx + 1}`}
                                  className="w-8 h-8 object-cover rounded"
                                />
                                <span className="text-xs min-w-0 flex-1 truncate">
                                  Style {styleIdx + 1}
                                </span>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="2.0"
                                  step="0.1"
                                  defaultValue="1.0"
                                  className="w-16"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Style Parameters</h3>
                      <Slider
                        label="Overall Stylishness"
                        value={multiStyleSliderVal}
                        onValueChange={setMultiStyleWeight}
                        min={0}
                        max={5}
                        step={0.5}
                        className="w-full"
                      />

                      <Slider
                        label="Smoothness"
                        value={multiTvSliderVal}
                        onValueChange={setMultiTvWeight}
                        min={0}
                        max={5}
                        step={1}
                        className="w-full"
                      />

                      <Slider
                        label="Duration"
                        value={multiIterations}
                        onValueChange={setMultiIterations}
                        min={750}
                        max={5000}
                        step={250}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Initialization Method</h3>
                      <select 
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={multiInitMethod}
                        onChange={(e) => setMultiInitMethod(e.target.value)}
                      >
                        <option value="random">Random initialization</option>
                        <option value="content">Content-based initialization</option>
                        <option value="blend">Blended style initialization</option>
                        <option value="primary">Primary style initialization</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DrawerFooter className="flex-row space-x-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={
                (activeTab === "basic" && !selectedImageFile) ||
                (activeTab === "segmentation" && (!segSelectedImageFile || (!segPersonStyleEnabled && !segBackgroundStyleEnabled) || (segPersonStyleEnabled && segBackgroundStyleEnabled && segPersonStyleIdx === segBackgroundStyleIdx))) ||
                (activeTab === "multi-style" && (!multiSelectedImageFile || multiSelectedStyles.length < 2)) ||
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
