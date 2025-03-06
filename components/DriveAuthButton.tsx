'use client'
import { useRouter } from 'next/navigation';


export default function DriveAuthButton({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/api/auth')}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {isConnected ? 'Connected to Google Drive' : 'Connect Google Drive'}
    </button>
  );
}
