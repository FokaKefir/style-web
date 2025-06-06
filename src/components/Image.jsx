import React, { useState, useEffect } from 'react';
import { auth, db } from "../firebase";
import { IoDownload, IoTrash } from "react-icons/io5";
import { doc, deleteDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Alert, AlertTitle } from "./ui/alert";

const Images = ({ url, metadata, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddStyle, setShowAddStyle] = useState(false);
  const [alert, setAlert] = useState(null);
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

  const showAlert = (type, title, description = "") => {
    setAlert({ type, title, description });
    if (type === "success") {
      setTimeout(() => setAlert(null), 2000);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this generation?")) {
      try {
        await deleteDoc(doc(db, "gens", metadata.documentId));
        showAlert("success", "Generation deleted");
        onDelete && onDelete(metadata.documentId);
        setIsOpen(false);
      } catch (error) {
        showAlert("error", "Failed to delete generation", error.message);
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'generated-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      showAlert("success", "Image downloaded");
    } catch (error) {
      showAlert("error", "Failed to download image", error.message);
    }
  };

  const handleAddStyle = async () => {
    try {
      if (!currentUser) {
        showAlert("error", "You must be logged in to add styles");
        return;
      }

      const userStylesRef = collection(db, "users", currentUser.uid, "styles");
      await addDoc(userStylesRef, metadata.style);
      showAlert("success", "Style added");
      setShowAddStyle(false);
    } catch (error) {
      showAlert("error", "Failed to add style", error.message);
    }
  };

  return (
    <>
      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"} className="mb-4">
          <AlertTitle>{alert.title}</AlertTitle>
        </Alert>
      )}
      
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
            <DialogTitle>Generation Details</DialogTitle>
            <DialogDescription>
              View and manage your generated image
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Generated Image</h4>
                <img
                  src={metadata.outputImage}
                  alt="Generated"
                  className="w-full rounded-lg object-cover shadow-md"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Content Image</h4>
                  <img
                    src={metadata.contentImage}
                    alt="Content"
                    className="w-full rounded-lg object-cover shadow-md"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Style Image</h4>
                  <img
                    src={metadata.style.image}
                    alt="Style"
                    className="w-full rounded-lg object-cover shadow-md"
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
              </div>

              <div>
                <h4 className="font-medium mb-2">Additional Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>Created by: {metadata.username}</p>
                  <p>Created at: {metadata.timestamp?.toDate().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Images;