"use client";

import Sidebar from "@/components/Sidebar";
import { ProfileProvider } from "@/lib/profile/profile-context";
import { useEffect } from "react";
import { CloudSyncService } from "@/lib/core/sync-service";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect live Realtime subscription so mobile and laptop stay in sync simultaneously
    const unsubscribe = CloudSyncService.subscribeToRealtime();
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ProfileProvider>
      <div className="flex min-h-screen bg-[#0a0a0c]">
        <Sidebar />
        <div className="flex-1 overflow-y-auto pt-16 md:pt-0 md:pl-64">
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
