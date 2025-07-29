
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

type ProfileType = "Software Engineer" | "Student" | "General" | "Custom";

interface ProfileContextType {
  profile: ProfileType;
  setProfile: (profile: ProfileType) => void;
  customProfession: string;
  setCustomProfession: (profession: string) => void;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: "General",
  setProfile: () => {},
  customProfession: "",
  setCustomProfession: () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<ProfileType>("General");
  const [customProfession, setCustomProfession] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || ('isMockUser' in user && user.isMockUser)) {
        setProfileState("General");
        setLoading(false);
        return;
    }

    setLoading(true);
    const profileRef = doc(db, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileState(data.profile || "General");
            if (data.profile === 'Custom') {
              setCustomProfession(data.customProfession || "");
            }
        } else {
            // If no profile, set default "General"
            setDoc(profileRef, { profile: "General" });
            setProfileState("General");
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [user]);

  const setProfile = useCallback(async (newProfile: ProfileType) => {
    setProfileState(newProfile);
    if (user && !('isMockUser' in user)) {
        const profileRef = doc(db, 'userProfiles', user.uid);
        await setDoc(profileRef, { profile: newProfile }, { merge: true });
    }
  }, [user]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, customProfession, setCustomProfession }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
