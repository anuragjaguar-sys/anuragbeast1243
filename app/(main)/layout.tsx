import Sidebar from "@/components/Sidebar";
import { ProfileProvider } from "@/lib/profile/profile-context";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex min-h-screen bg-[#0a0a0c]">
        
        {/* Sidebar (floating on the left) */}
        <Sidebar />
        
        {/* Main Content - Added md:pl-64 to make room for the fixed sidebar! */}
        <div className="flex-1 overflow-y-auto md:pl-64">
          {children}
        </div>
        
      </div>
    </ProfileProvider>
  );
}