import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserProvider } from '@/hooks/useUser';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('75j_user_id')?.value;

  if (!userId || !['simon', 'emma'].includes(userId)) {
    redirect('/login');
  }

  return (
    <UserProvider userId={userId}>
      <div className="min-h-dvh bg-background flex flex-col">
        <main className="flex-1 w-full max-w-[420px] lg:max-w-[800px] mx-auto px-4 pb-24 pt-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </UserProvider>
  );
}
