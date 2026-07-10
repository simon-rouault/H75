import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserProvider } from '@/hooks/useUser';
import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('75j_user_id')?.value;

  if (!userId || !['simon', 'emma'].includes(userId)) {
    redirect('/login');
  }

  return (
    <UserProvider userId={userId}>
      <div className="min-h-dvh bg-background">
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar />

        {/* Main content — shifted right on desktop to make room for sidebar */}
        <div className="lg:ml-[220px]">
          <main className="w-full max-w-[420px] lg:max-w-[780px] mx-auto px-4 pb-28 lg:pb-10 pt-4">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav — hidden on desktop */}
        <BottomNav />
      </div>
    </UserProvider>
  );
}
