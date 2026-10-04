import Sidebar from "@/components/Sidebar";
import { ProfileProvider } from "@/lib/profile/profile-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex min-h-screen bg-[#0a0a0c]">
        {/* Responsive Sidebar & Mobile Header */}
        <Sidebar />
        
        {/* Main Content: padded top on mobile for header, left on desktop for sidebar */}
        <div className="flex-1 overflow-y-auto pt-16 md:pt-0 md:pl-64">
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
