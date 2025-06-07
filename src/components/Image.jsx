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
    if (window.confirm("Are you sure you want to delete this generation?")) {
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
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Generation</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <img
                src={metadata.outputImage}
                alt="Generated"
                className="h-[500px] w-full rounded-lg object-cover shadow-md"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <img
                  src={metadata.contentImage}
                  alt="Content"
                  className="h-[240px] w-full rounded-lg object-cover shadow-md"
                />
              </div>
              <div>
                <img
                  src={metadata.style.image}
                  alt="Style"
                  className="h-[240px] w-full rounded-lg object-cover shadow-md"
                />
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
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  <IoTrash />
                  Delete
                </button>
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
            </div>              <div>
                <h4 className="font-medium mb-2">Additional Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>Created by: 
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                        if (onUserClick) {
                          setTimeout(() => onUserClick(), 100); // Small delay to ensure dialog closes first
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