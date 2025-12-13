'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="px-3 sm:px-4 py-2">
        <div className="animate-pulse text-sm text-gray-500">טוען...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all hover:shadow-lg hover:scale-105"
      >
        התחבר
      </button>
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-gray-700 max-w-[120px] truncate">
          {session.user?.name || session.user?.email}
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 text-red-600 hover:from-red-100 hover:to-rose-100 transition-all hover:scale-105"
        title="התנתק"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs sm:text-sm font-semibold hidden sm:inline">התנתק</span>
      </button>
    </div>
  );
}

