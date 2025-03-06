import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/auth';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    return NextResponse.redirect(authUrl);
  }

  // Exchange auth code for access token
  const { tokens } = await oauth2Client.getToken(code);
  
  // ✅ Correct way to set a cookie in Next.js App Router
  const response = NextResponse.redirect('/drive');
  response.cookies.set({
    name: 'google_token',
    value: tokens.access_token!,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return response;
}
