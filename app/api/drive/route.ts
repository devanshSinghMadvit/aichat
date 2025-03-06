import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore =await cookies();
  const token =  cookieStore.get('google_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const response = await drive.files.list({
      q: "'root' in parents",
      fields: 'files(id, name, mimeType, webViewLink)',
    });

    return NextResponse.json(response.data.files);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
