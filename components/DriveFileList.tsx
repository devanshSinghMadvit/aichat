'use client'

import { useEffect, useState } from 'react';

type DriveFile = { id: string; name: string; mimeType: string; webViewLink: string };

export default function DriveFileList() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/drive')
      .then((res) => res.json())
      .then((data) => {
        setFiles(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <ul>
      {files.map((file) => (
        <li key={file.id}>
          <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
            {file.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
