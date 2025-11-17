'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="px-4 py-2 text-gray-600">
        <div className="animate-pulse">טוען...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-gray-700">
        <User className="w-5 h-5" />
        <span className="text-sm font-medium">
          {session.user?.name || session.user?.email}
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
        title="התנתק"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm">התנתק</span>
      </button>
    </div>
  );
}

