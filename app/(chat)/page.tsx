import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { google } from 'googleapis';
import axios from 'axios';
interface OneDriveFile {
  id: string;
  name: string;
  webUrl: string;
  createdDateTime: string;
}

async function getAccessToken(): Promise<string> {
  const { ONEDRIVE_CLIENT_ID, ONEDRIVE_TENANT_ID,ONEDRIVE_CLIENT_SECRET,  } = process.env;

  if (!ONEDRIVE_CLIENT_ID || !ONEDRIVE_TENANT_ID || !ONEDRIVE_CLIENT_SECRET) {
    throw new Error('Missing OneDrive credentials in environment variables');
  }
 
  const response = await axios.post(
    `https://login.microsoftonline.com/${ONEDRIVE_TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: ONEDRIVE_CLIENT_ID,
      client_secret: ONEDRIVE_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    })
  );
  

  return response.data.access_token;
}

async function listOneDriveFiles(folderId: string = 'root'): Promise<OneDriveFile[]> {
  // const accessToken = await getAccessToken();
  try {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/drive/items/${process.env.ONEDRIVE_FOLDER_ID}/children`,
      {
        headers: { Authorization: `Bearer ${process.env.ONEDRIVE_ACCESS_TOKEN}` },
      }
    );
    return response.data.value.map((file: any) => ({
      id: file.id,
      name: file.name,
      webUrl: file.webUrl,
      createdDateTime: file.createdDateTime,
    }));
  } catch (error: any) {
    console.error('OneDrive API Error:', error.response?.data || error.message);
    throw error;
  }
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

async function listGoogleDriveFiles(folderId: string): Promise<DriveFile[]> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials');
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({
    version: 'v3',
    auth: auth,
  });

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
    });
    return response.data.files || [];
  } catch (error: any) {
    console.error('Detailed Google Drive error:', {
      message: error.message,
      code: error.code,
      details: error.errors,
    });
    throw error;
  }
}

export default async function Page() {
  let Drivefiles: DriveFile[] = [];
  let error: string | null = null;
  let OneDriveFile: OneDriveFile[] = [];
  let oneDriveerror: string | null = null;

  try {
    Drivefiles = await listGoogleDriveFiles(process.env.GOOGLE_DRIVE_FOLDER_ID || '');
  } catch (err) {
    error = err instanceof Error ? err.message : 'An error occurred';
  }
  try {
    OneDriveFile = await listOneDriveFiles(process.env.ONEDRIVE_FOLDER_ID || 'root');
  } catch (err) {
    oneDriveerror = err instanceof Error ? err.message : 'An error occurred';
  }


  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType="private"
          isReadonly={false}
          Drivefiles={Drivefiles}
          OneDriveFile={OneDriveFile}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={modelIdFromCookie.value}
        selectedVisibilityType="private"
        isReadonly={false}
        Drivefiles={Drivefiles}
        OneDriveFile={OneDriveFile}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
