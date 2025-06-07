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

const Images = ({ url, metadata, onDelete, onUserClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddStyle, setShowAddStyle] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Check if style is addable (not in user's collection)
    const checkIfStyleAddable = async () => {
      if (!metadata?.style?.given && currentUser) {
        const userStylesRef = collection(db, "users", currentUser.uid, "styles");
        const q = query(userStylesRef, where("image", "==", metadata.style.image));
        const querySnapshot = await getDocs(q);
        setShowAddStyle(querySnapshot.empty);
      }
    };

    checkIfStyleAddable();
  }, [metadata?.style, currentUser]);

  const handleDelete = async () => {
    try {
      const promise = deleteDoc(doc(db, "gens", metadata.documentId));
      
      toast.promise(promise, {
        loading: 'Deleting image...',
        success: () => {
          onDelete && onDelete(metadata.documentId);
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

  const handleDownload = async () => {
    try {
      const response = await fetch(metadata.outputImage);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `generated-image-${metadata.documentId}.jpg`;
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

  const handleAddStyle = async () => {
    if (!currentUser) {
      toast.error('Authentication required', {
        description: 'You must be logged in to add styles'
      });
      return;
    }

    try {
      const userStylesRef = collection(db, "users", currentUser.uid, "styles");
      const promise = addDoc(userStylesRef, metadata.style);
      
      toast.promise(promise, {
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="flex flex-col items-center w-full">
                <h4 className="font-medium mb-2 text-sm text-gray-600">Content Image</h4>
                <div className="flex justify-center items-center w-full aspect-square bg-gray-50">
                  <img
                    src={metadata.contentImage}
                    alt="Content"
                    className="w-full h-full rounded-xl object-contain shadow-md"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center w-full">
                <h4 className="font-medium mb-2 text-sm text-gray-600">Style Image</h4>
                <div className="flex justify-center items-center w-full aspect-square rounded-lg overflow-hidden">
                  <img
                    src={metadata.style.image}
                    alt="Style"
                    className="w-full h-full rounded-xl object-cover shadow-md"
                  />
                </div>
              </div>
            </div>

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
            <div>
              <h4 className="font-medium mb-2">Style Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p>Style Name: {metadata.style.name}</p>
                {showAddStyle && (
                  <button
                    onClick={handleAddStyle}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition w-full"
                  >
                    Add Style to Collection
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Generation Settings</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p>Stylishness: lvl. {metadata.styleSliderVal}</p>
                <p>Smoothness: lvl. {metadata.tvSliderVal}</p>
                <p>Duration: {metadata.iterations} iterations</p>
                <p>Init Method: {metadata.initMethod}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Additional Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p>Created by: 
                  <span 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                      if (onUserClick) {
                        setTimeout(() => onUserClick(), 100);
                      }
                    }}
                    className="text-blue-600 hover:underline cursor-pointer ml-1"
                  >
                    {metadata.username}
                  </span>
                </p>
                <p>Created at: {metadata.timestamp?.toDate().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Images;