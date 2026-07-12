import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <Sidebar />
      <div className="pl-64">{children}</div>
    </div>
  );
}
