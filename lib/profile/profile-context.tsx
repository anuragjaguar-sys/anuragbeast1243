"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { FinancialProfile } from "./profile.types";
import { DEFAULT_FINANCIAL_PROFILE } from "./profile";
import { loadFinancialProfile } from "./profile-storage";

interface ProfileContextType {
  profile: FinancialProfile;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<FinancialProfile>(
    DEFAULT_FINANCIAL_PROFILE
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await loadFinancialProfile();
      setProfile(data);
    } catch (err) {
      console.error(
        "ProfileProvider: Failed to load profile",
        err
      );

      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load financial profile")
      );

      // Keep the safe default profile on load failure.
      setProfile(DEFAULT_FINANCIAL_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading: isLoading,
        isLoading,
        error,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);

  if (context === undefined) {
    throw new Error(
      "useProfile must be used within a ProfileProvider"
    );
  }

  return context;
}