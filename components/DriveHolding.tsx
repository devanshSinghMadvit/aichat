'use client';

import { useEffect, useState } from 'react';
import DriveAuthButton from '@/components/DriveAuthButton';
import DriveFileList from '@/components/DriveFileList';

export default function DrivePage() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetch('/api/drive')
      .then((res) => res.json())
      .then((data) => setIsConnected(!data.error));
  }, []);

  return (
    <div className="p-6">
      <DriveAuthButton isConnected={isConnected} />
      {isConnected && <DriveFileList />}
    </div>
  );
}
