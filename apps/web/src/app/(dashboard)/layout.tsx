import { Sidebar } from '@/components/Sidebar';
import { MainArea } from '@/components/MainArea';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainArea>{children}</MainArea>
    </div>
  );
}
