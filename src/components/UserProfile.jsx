import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, deleteDoc, addDoc } from "firebase/firestore";
import { IoTrash } from "react-icons/io5";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "./ui/dialog";
import { PlusCircle } from "lucide-react";

const DEFAULT_AVATAR = "https://api.dicebear.com/6.x/avataaars/svg";

const UserProfile = ({ userData, isButton, onClick }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [userStyles, setUserStyles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [error, setError] = useState(null);
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyleImage, setNewStyleImage] = useState(null);
  const [newStyleName, setNewStyleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.uid) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const userDoc = await getDoc(doc(db, "users", userData.uid));
        if (userDoc.exists()) {
          setUserInfo(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userData?.uid]);

  useEffect(() => {
    const fetchUserImages = async () => {
      if (!userData?.uid) return;

      setLoadingImages(true);
      try {
        const q = query(
          collection(db, "gens"),
          where("userId", "==", userData.uid),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const images = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserImages(images);
      } catch (error) {
        console.error("Error fetching user images:", error);
        setError("Failed to load user images");
      } finally {
        setLoadingImages(false);
      }
    };

    fetchUserImages();
  }, [userData?.uid]);

  useEffect(() => {
    let unsubscribeStyles;
    const setupStylesListener = async () => {
      if (!userData?.uid) return;

      setLoadingStyles(true);
      try {
        // Get basic styles first
        const basicStylesRef = collection(db, "styles");
        const basicStylesSnapshot = await getDocs(basicStylesRef);
        const basicStyles = basicStylesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          given: true, // Mark as basic style
          timestamp: doc.data().timestamp || new Date(0) // Put basic styles at the end
        }));

        // Then get user's styles
        const userStylesRef = collection(db, "users", userData.uid, "styles");
        const userSnapshot = await getDocs(userStylesRef);
        const userStyles = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          given: false, // Mark as user style
          timestamp: doc.data().timestamp || new Date() // Use timestamp or current date
        }));

        // Sort user styles by timestamp (newest first) and combine with basic styles
        const sortedUserStyles = userStyles.sort((a, b) => 
          (b.timestamp?.toMillis?.() || b.timestamp) - (a.timestamp?.toMillis?.() || a.timestamp)
        );
        setUserStyles([...sortedUserStyles, ...basicStyles]);

        // Set up real-time listener for user's styles
        unsubscribeStyles = onSnapshot(userStylesRef, 
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              const styleData = {
                id: change.doc.id,
                ...change.doc.data(),
                given: false,
                timestamp: change.doc.data().timestamp || new Date()
              };

              if (change.type === "added") {
                setUserStyles(prev => {
                  const exists = prev.some(style => style.id === styleData.id);
                  if (exists) return prev;

                  const userStyles = prev.filter(s => !s.given);
                  const basicStyles = prev.filter(s => s.given);
                  
                  const allUserStyles = [...userStyles, styleData].sort((a, b) => 
                    (b.timestamp?.toMillis?.() || b.timestamp) - (a.timestamp?.toMillis?.() || a.timestamp)
                  );
                  
                  return [...allUserStyles, ...basicStyles];
                });
              } else if (change.type === "modified") {
                setUserStyles(prev => {
                  const userStyles = prev.filter(s => !s.given);
                  const basicStyles = prev.filter(s => s.given);
                  
                  const updatedUserStyles = userStyles
                    .map(style => style.id === styleData.id ? styleData : style)
                    .sort((a, b) => 
                      (b.timestamp?.toMillis?.() || b.timestamp) - (a.timestamp?.toMillis?.() || a.timestamp)
                    );
                  
                  return [...updatedUserStyles, ...basicStyles];
                });
              } else if (change.type === "removed") {
                setUserStyles(prev => prev.filter(style => style.id !== change.doc.id));
              }
            });
          },
          (error) => {
            console.error("Error listening to styles:", error);
            setError("Failed to sync style updates");
          }
        );
      } catch (error) {
        console.error("Error setting up styles listener:", error);
        setError("Failed to load styles");
      } finally {
        setLoadingStyles(false);
      }
    };

    setupStylesListener();

    return () => {
      if (unsubscribeStyles) {
        unsubscribeStyles();
      }
    };
  }, [userData?.uid]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = userInfo?.name || userData?.username || userData?.email?.split('@')[0] || 'User';
  const avatarUrl = `${DEFAULT_AVATAR}?seed=${userData?.uid || 'default'}`;

  const handleDeleteStyle = async (style) => {
    if (!userData?.uid || !style.id) return;
    
    try {
      const styleRef = doc(db, "users", userData.uid, "styles", style.id);
      const promise = deleteDoc(styleRef);
      
      toast.promise(promise, {
        loading: 'Deleting style...',
        success: 'Style deleted successfully',
        error: 'Failed to delete style'
      });
    } catch (error) {
      console.error("Error deleting style:", error);
      toast.error('Failed to delete style');
    }
  };

  const handleAddStyle = async (e) => {
    e.preventDefault();
    if (!userData?.uid) {
      toast.error('Authentication required');
      return;
    }

    if (!newStyleImage || !newStyleName.trim()) {
      toast.error('Please provide both an image and a name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', newStyleImage);

      // Upload image to backend first
      console.log(`${process.env.REACT_APP_BACKEND_URL}/style/upload/`)
      const uploadResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/style/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { image_name } = await uploadResponse.json();
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}/image/style/${image_name}`;

      // Then save style data to Firestore
      const userStylesRef = collection(db, "users", userData.uid, "styles");
      const promise = addDoc(userStylesRef, {
        name: newStyleName.trim(),
        image: imageUrl,
        timestamp: new Date()
      });

      await toast.promise(promise, {
        loading: 'Adding new style...',
        success: () => {
          setNewStyleName("");
          setNewStyleImage(null);
          setIsAddingStyle(false);
          return 'Style added successfully';
        },
        error: 'Failed to add style'
      });
    } catch (error) {
      console.error("Error adding style:", error);
      toast.error('Failed to add style: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isButton) {
    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80" 
        onClick={onClick}
      >
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className={cn(
            "bg-slate-700 text-white",
            isLoading && "animate-pulse"
          )}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className={cn(
                "bg-slate-700 text-white text-2xl",
                isLoading && "animate-pulse"
              )}>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold">{displayName}</h2>
          </div>

          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}

          <Tabs defaultValue="images" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="images">
                  Images ({loadingImages ? '...' : userImages.length})
                </TabsTrigger>
                <TabsTrigger value="styles">
                  Styles ({loadingStyles ? '...' : userStyles.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="images">
              {loadingImages ? (
                <div className="space-y-4">
                  {[1,2,3].map((n) => (
                    <div key={n} className="animate-pulse w-full h-48 bg-slate-200 rounded-xl"/>
                  ))}
                </div>
              ) : userImages.length > 0 ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {userImages.map((image) => (
                    <div key={image.id} className="group">
                      <img
                        src={image.outputImage}
                        alt="Generated"
                        className="w-full rounded-xl shadow-md transition-transform group-hover:scale-[1.02] object-contain bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No images found</div>
              )}
            </TabsContent>

            <TabsContent value="styles">
              {userData?.uid === auth.currentUser?.uid && (
                <div className="mb-6">
                  <Dialog open={isAddingStyle} onOpenChange={setIsAddingStyle}>
                    <DialogTrigger asChild>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlusCircle className="w-5 h-5" />
                        Add New Style
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Style</DialogTitle>
                        <DialogDescription>
                          Add a new style to your collection. Choose an image and give it a name.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddStyle} className="space-y-4">
                        <div>
                          <label 
                            htmlFor="styleImage" 
                            className="block text-sm font-medium text-gray-700"
                          >
                            Style Image
                          </label>
                          <input
                            id="styleImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewStyleImage(e.target.files[0])}
                            className="mt-1 block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100"
                          />
                        </div>
                        <div>
                          <label 
                            htmlFor="styleName" 
                            className="block text-sm font-medium text-gray-700"
                          >
                            Style Name
                          </label>
                          <input
                            id="styleName"
                            type="text"
                            value={newStyleName}
                            onChange={(e) => setNewStyleName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter style name"
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <button
                              type="button"
                              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                            >
                              Cancel
                            </button>
                          </DialogClose>
                          <button
                            type="submit"
                            disabled={isSubmitting || !newStyleImage || !newStyleName.trim()}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ml-3"
                          >
                            {isSubmitting ? 'Adding...' : 'Add Style'}
                          </button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              {loadingStyles ? (
                <div className="space-y-4">
                  {[1,2,3].map((n) => (
                    <div key={n} className="animate-pulse w-full h-48 bg-slate-200 rounded-xl"/>
                  ))}
                </div>
              ) : userStyles.length > 0 ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {userStyles.map((style) => (
                    <div key={style.id} className="relative">
                      <div className="relative rounded-xl shadow-md bg-gray-50">
                        <img
                          src={style.image}
                          alt={style.name}
                          className="w-full rounded-xl object-contain"
                        />
                        {!style.given && userData?.uid === auth.currentUser?.uid && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg"
                                aria-label="Delete style"
                              >
                                <IoTrash className="w-5 h-5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Style</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this style? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStyle(style)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <h3 className="mt-2 font-medium text-gray-900">{style.name}</h3>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No styles found</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;