
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

type ProfileType = "Artist" | "Consultant" | "Content Creator" | "Designer" | "Educator" | "Entrepreneur" | "Freelancer" | "General" | "Healthcare Professional" | "IT Professional" | "Manager" | "Marketer" | "Researcher" | "Sales" | "Software Engineer" | "Student" | "Writer" | "Custom";

interface ProfileContextType {
  profile: ProfileType;
  setProfile: (profile: ProfileType, customProfession?: string) => void;
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
  const [customProfession, setCustomProfessionState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || ('isMockUser' in user && user.isMockUser)) {
        setProfileState("General");
        setCustomProfessionState("");
        setLoading(false);
        return;
    }

    setLoading(true);
    const profileRef = doc(db, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileState(data.profile || "General");
            setCustomProfessionState(data.customProfession || "");
        } else {
            // If no profile, set default "General"
            setDoc(profileRef, { profile: "General", customProfession: "" });
            setProfileState("General");
            setCustomProfessionState("");
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();

  }, [user]);

  const setProfile = useCallback(async (newProfile: ProfileType, newCustomProfession?: string) => {
    setProfileState(newProfile);
    if (newProfile === 'Custom' && newCustomProfession) {
        setCustomProfessionState(newCustomProfession);
    }
    
    if (user && !('isMockUser' in user)) {
        const profileRef = doc(db, 'userProfiles', user.uid);
        const dataToSet: { profile: ProfileType, customProfession?: string } = { profile: newProfile };
        if (newProfile === 'Custom') {
          dataToSet.customProfession = newCustomProfession || customProfession;
        } else {
          dataToSet.customProfession = "";
        }
        await setDoc(profileRef, dataToSet, { merge: true });
    }
  }, [user, customProfession]);

  const setCustomProfession = useCallback((profession: string) => {
    setCustomProfessionState(profession);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, customProfession, setCustomProfession }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
