import React, { useState, useEffect } from 'react';
import { auth, db } from "../firebase";
import { IoDownload, IoTrash } from "react-icons/io5";
import { doc, deleteDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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

// Utility functions for image operations
export const checkIfStyleAddable = async (styleOrMetadata, currentUser, setShowAddStyle) => {
  if (!currentUser) {
    setShowAddStyle(false);
    return;
  }

  const userStylesRef = collection(db, "users", currentUser.uid, "styles");
  let hasAddableStyles = false;

  try {
    // Check if this is segmentation data
    if (styleOrMetadata?.generationType === "segmentation") {
      // Check person style
      if (styleOrMetadata.personStyle && 
          !styleOrMetadata.personStyle.given && 
          styleOrMetadata.personStyle.image) {
        const q1 = query(userStylesRef, where("image", "==", styleOrMetadata.personStyle.image));
        const querySnapshot1 = await getDocs(q1);
        if (querySnapshot1.empty) {
          hasAddableStyles = true;
        }
      }
      
      // Check background style
      if (styleOrMetadata.backgroundStyle && 
          !styleOrMetadata.backgroundStyle.given && 
          styleOrMetadata.backgroundStyle.image) {
        const q2 = query(userStylesRef, where("image", "==", styleOrMetadata.backgroundStyle.image));
        const querySnapshot2 = await getDocs(q2);
        if (querySnapshot2.empty) {
          hasAddableStyles = true;
        }
      }
    } else {
      // Basic generation - check single style
      if (styleOrMetadata?.style && 
          !styleOrMetadata.style.given && 
          styleOrMetadata.style.image) {
        const q = query(userStylesRef, where("image", "==", styleOrMetadata.style.image));
        const querySnapshot = await getDocs(q);
        hasAddableStyles = querySnapshot.empty;
      }
      // Handle direct style object (for backward compatibility)
      else if (styleOrMetadata && 
               styleOrMetadata.image && 
               !styleOrMetadata.given && 
               typeof styleOrMetadata.name === 'string') {
        const q = query(userStylesRef, where("image", "==", styleOrMetadata.image));
        const querySnapshot = await getDocs(q);
        hasAddableStyles = querySnapshot.empty;
      }
    }
  } catch (error) {
    console.error("Error checking if style is addable:", error);
    hasAddableStyles = false;
  }

  setShowAddStyle(hasAddableStyles);
};

export const handleImageDelete = async (documentId, onDelete, setIsOpen) => {
  try {
    const promise = deleteDoc(doc(db, "gens", documentId));
    
    return toast.promise(promise, {
      loading: 'Deleting image...',
      success: () => {
        onDelete && onDelete(documentId);
        setIsOpen(false);
        return 'Image deleted successfully';
      },
      error: 'Failed to delete image',
    });
  } catch (error) {
    toast.error('Failed to delete image', {
      description: error.message
    });
  }
};

export const handleImageDownload = async (outputImage, documentId) => {
  try {
    const response = await fetch(outputImage);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `generated-image-${documentId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    toast.success('Image downloaded successfully');
  } catch (error) {
    toast.error('Failed to download image', {
      description: error.message
    });
  }
};

export const handleStyleAdd = async (style, currentUser, setShowAddStyle) => {
  if (!currentUser) {
    toast.error('Authentication required', {
      description: 'You must be logged in to add styles'
    });
    return;
  }

  try {
    const userStylesRef = collection(db, "users", currentUser.uid, "styles");
    const promise = addDoc(userStylesRef, style);
    
    return toast.promise(promise, {
      loading: 'Adding style...',
      success: () => {
        setShowAddStyle(false);
        return 'Style added successfully';
      },
      error: 'Failed to add style',
    });
  } catch (error) {
    toast.error('Failed to add style', {
      description: error.message
    });
  }
};

// Helper functions for rendering different sections
const renderStyleImages = (metadata) => {
  const isSegmentation = metadata?.generationType === "segmentation";
  
  if (isSegmentation) {
    const hasPersonStyle = metadata.personStyle;
    const hasBackgroundStyle = metadata.backgroundStyle;
    const totalStyles = (hasPersonStyle ? 1 : 0) + (hasBackgroundStyle ? 1 : 0);
    
    if (totalStyles === 0) {
      // No styles enabled, show only content
      return (
        <div className="grid grid-cols-1 gap-6 w-full">
          <div className="flex flex-col items-center w-full">
            <h4 className="font-medium mb-2 text-sm text-gray-600">Content Image</h4>
            <div className="flex justify-center items-center w-full aspect-square bg-gray-50">
              <img
                src={metadata?.contentImage}
                alt="Content"
                className="w-full h-full rounded-xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      );
    } else if (totalStyles === 1) {
      // One style enabled, show like basic (content + style side by side)
      const activeStyle = hasPersonStyle ? metadata.personStyle : metadata.backgroundStyle;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col items-center w-full">
            <h4 className="font-medium mb-2 text-sm text-gray-600">Content Image</h4>
            <div className="flex justify-center items-center w-full aspect-square bg-gray-50">
              <img
                src={metadata?.contentImage}
                alt="Content"
                className="w-full h-full rounded-xl object-contain shadow-md"
              />
            </div>
          </div>
          <div className="flex flex-col items-center w-full">
            <h4 className="font-medium mb-2 text-sm text-gray-600">Style Image</h4>
            <div className="flex justify-center items-center w-full aspect-square rounded-lg overflow-hidden">
              <img
                src={activeStyle.image}
                alt="Style"
                className="w-full h-full rounded-xl object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      );
    } else {
      // Two styles enabled, show content + both styles in split view
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col items-center w-full">
            <h4 className="font-medium mb-2 text-sm text-gray-600">Content Image</h4>
            <div className="flex justify-center items-center w-full aspect-square bg-gray-50 rounded-xl overflow-hidden">
              <img
                src={metadata?.contentImage}
                alt="Content"
                className="w-full h-full object-contain shadow-md"
              />
            </div>
          </div>
          <div className="flex flex-col items-center w-full">
            <h4 className="font-medium mb-2 text-sm text-gray-600">Style Images</h4>
            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
              {hasPersonStyle && (
                <div className="absolute inset-0 w-full h-full" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}>
                  <img
                    src={metadata.personStyle.image}
                    alt="Person Style"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {hasBackgroundStyle && (
                <div className="absolute inset-0 w-full h-full" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
                  <img
                    src={metadata.backgroundStyle.image}
                    alt="Background Style"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Diagonal divider line */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="100" x2="100" y2="0" stroke="white" strokeWidth="0.5" opacity="0.6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } else {
    // Basic generation type (default)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <div className="flex flex-col items-center w-full">
          <h4 className="font-medium mb-2 text-sm text-gray-600">Content Image</h4>
          <div className="flex justify-center items-center w-full aspect-square bg-gray-50">
            <img
              src={metadata?.contentImage}
              alt="Content"
              className="w-full h-full rounded-xl object-contain shadow-md"
            />
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          <h4 className="font-medium mb-2 text-sm text-gray-600">Style Image</h4>
          <div className="flex justify-center items-center w-full aspect-square rounded-lg overflow-hidden">
            <img
              src={metadata?.style?.image}
              alt="Style"
              className="w-full h-full rounded-xl object-cover shadow-md"
            />
          </div>
        </div>
      </div>
    );
  }
};

const renderStyleInformation = (metadata, showAddStyle, currentUser, setShowAddStyle) => {
  const isSegmentation = metadata?.generationType === "segmentation";
  
  if (isSegmentation) {
    const hasPersonStyle = metadata.personStyle;
    const hasBackgroundStyle = metadata.backgroundStyle;
    const totalStyles = (hasPersonStyle ? 1 : 0) + (hasBackgroundStyle ? 1 : 0);
    
    return (
      <div>
        <h4 className="font-medium mb-2">Style Information</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          {totalStyles === 0 ? (
            // No styles
            <p>No styles applied</p>
          ) : totalStyles === 1 ? (
            // Single style - display like basic
            <p>Style Name: {hasPersonStyle ? metadata.personStyle.name : metadata.backgroundStyle.name}</p>
          ) : (
            // Two styles - display both with specific labels
            <>
              {hasPersonStyle && (
                <p>Person Style Name: {metadata.personStyle.name}</p>
              )}
              {hasBackgroundStyle && (
                <p>Background Style Name: {metadata.backgroundStyle.name}</p>
              )}
            </>
          )}
          
          {showAddStyle && metadata.personStyle && !metadata.personStyle.given && (
            <button
              onClick={() => handleStyleAdd(metadata.personStyle, currentUser, setShowAddStyle)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition w-full"
            >
              Add Person Style to Collection
            </button>
          )}
          {showAddStyle && metadata.backgroundStyle && !metadata.backgroundStyle.given && (
            <button
              onClick={() => handleStyleAdd(metadata.backgroundStyle, currentUser, setShowAddStyle)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition w-full"
            >
              Add Background Style to Collection
            </button>
          )}
        </div>
      </div>
    );
  } else {
    // Basic generation type (default)
    return (
      <div>
        <h4 className="font-medium mb-2">Style Information</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p>Style Name: {metadata?.style?.name}</p>
          {showAddStyle && (
            <button
              onClick={() => handleStyleAdd(metadata.style, currentUser, setShowAddStyle)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition w-full"
            >
              Add Style to Collection
            </button>
          )}
        </div>
      </div>
    );
  }
};

const renderGenerationSettings = (metadata) => {
  const isSegmentation = metadata?.generationType === "segmentation";
  
  if (isSegmentation) {
    return (
      <div>
        <h4 className="font-medium mb-2">Generation Settings</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          {metadata.personStyle && (
            <p>Person Style Strength: lvl. {metadata.segPersonStyleSliderVal}</p>
          )}
          {metadata.backgroundStyle && (
            <p>Background Style Strength: lvl. {metadata.segBackgroundStyleSliderVal}</p>
          )}
          <p>Smoothness: lvl. {metadata.tvSliderVal}</p>
          <p>Duration: {metadata.iterations} iterations</p>
          <p>Init Method: {metadata.initMethod}</p>
        </div>
      </div>
    );
  } else {
    // Basic generation type (default)
    return (
      <div>
        <h4 className="font-medium mb-2">Generation Settings</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p>Stylishness: lvl. {metadata?.styleSliderVal}</p>
          <p>Smoothness: lvl. {metadata?.tvSliderVal}</p>
          <p>Duration: {metadata?.iterations} iterations</p>
          <p>Init Method: {metadata?.initMethod}</p>
        </div>
      </div>
    );
  }
};

const renderAdditionalInformation = (metadata, onUserClick, setIsOpen) => {
  // Handle both basic and segmentation metadata structures
  const username = metadata?.username || metadata?.user?.username || 'Unknown';
  const userId = metadata?.userId || metadata?.user?.uid;
  const timestamp = metadata?.timestamp || metadata?.createdAt;
  
  return (
    <div>
      <h4 className="font-medium mb-2">Additional Information</h4>
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <p>Created by: 
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (setIsOpen) setIsOpen(false);
              if (onUserClick && userId) {
                if (setIsOpen) {
                  onUserClick({
                    uid: userId,
                    username: username
                  });
                } else {
                  setTimeout(() => onUserClick(), 100);
                }
              }
            }}
            className="text-blue-600 hover:underline cursor-pointer ml-1"
          >
            {username}
          </span>
        </p>
        <p>Created at: {timestamp?.toDate ? timestamp.toDate().toLocaleString() : (timestamp ? new Date(timestamp).toLocaleString() : 'Unknown')}</p>
      </div>
    </div>
  );
};

export const ImageDialog = ({ isOpen, setIsOpen, image, onDelete, onUserClick }) => {
  const [showAddStyle, setShowAddStyle] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (image?.generationType === "segmentation" || image?.style) {
      checkIfStyleAddable(image, currentUser, setShowAddStyle);
    }
  }, [image, currentUser]);

  const handleDelete = () => handleImageDelete(image.id, onDelete, setIsOpen);
  const handleDownload = () => handleImageDownload(image.outputImage, image.id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[1000px] w-[90vw] data-[state=open]:animate-content-show data-[state=closed]:animate-content-hide">
        <DialogHeader>
          <DialogTitle className="text-xl">Generation</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="relative aspect-square w-full rounded-lg">
              <div className="absolute inset-0 flex justify-center items-center">
                <img
                  src={image?.outputImage}
                  alt="Generated"
                  className="max-w-full max-h-full w-auto h-auto rounded-xl object-contain shadow-md"
                />
              </div>
            </div>
            
            {renderStyleImages(image)}

            <div className="flex justify-between items-center">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <IoDownload />
                Download
              </button>
              {image?.userId === currentUser?.uid && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                      <IoTrash />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Generation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this generation? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {renderStyleInformation(image, showAddStyle, currentUser, setShowAddStyle)}
            {renderGenerationSettings(image)}
            {renderAdditionalInformation(image, onUserClick, setIsOpen)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Images = ({ url, metadata, onDelete, onUserClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddStyle, setShowAddStyle] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (metadata?.generationType === "segmentation" || metadata?.style) {
      checkIfStyleAddable(metadata, currentUser, setShowAddStyle);
    }
  }, [metadata, currentUser]);

  const handleDelete = () => handleImageDelete(metadata.documentId, onDelete, setIsOpen);
  const handleDownload = () => handleImageDownload(metadata.outputImage, metadata.documentId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <img
          src={url}
          alt="gallery"
          className="w-full mb-2 rounded-xl hover:scale-105 shadow-2xl hover:shadow-slate-900 transition cursor-pointer"
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] w-[90vw] data-[state=open]:animate-content-show data-[state=closed]:animate-content-hide">
        <DialogHeader>
          <DialogTitle className="text-xl">Generation</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="relative aspect-square w-full rounded-lg">
              <div className="absolute inset-0 flex justify-center items-center">
                <img
                  src={metadata.outputImage}
                  alt="Generated"
                  className="max-w-full max-h-full w-auto h-auto rounded-xl object-contain shadow-md"
                />
              </div>
            </div>
            
            {renderStyleImages(metadata)}

            <div className="flex justify-between items-center">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <IoDownload />
                Download
              </button>
              {metadata.userId === currentUser?.uid && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                      <IoTrash />
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Generation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this generation? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {renderStyleInformation(metadata, showAddStyle, currentUser, setShowAddStyle)}
            {renderGenerationSettings(metadata)}
            {renderAdditionalInformation(metadata, onUserClick, setIsOpen)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Images;