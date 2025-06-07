import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "../lib/utils";

const DEFAULT_AVATAR = "https://api.dicebear.com/6.x/avataaars/svg";

const UserProfile = ({ userData, isButton, onClick }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userData?.uid) return;
      
      setIsLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", userData.uid));
        if (userDoc.exists()) {
          setUserInfo(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userData?.uid]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = userInfo?.username || userData?.username || userData?.email?.split('@')[0] || 'User';
  const avatarUrl = `${DEFAULT_AVATAR}?seed=${userData?.uid || 'default'}`;

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
    <div className="p-6 bg-white rounded-lg shadow-lg h-full">
      <div className="flex flex-col items-center gap-4">
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
    </div>
  );
};

export default UserProfile;