import { NextResponse } from "next/server"; 

const ARCGIS_TOKEN_URL = "https://www.arcgis.com/sharing/rest/oauth2/token";

export async function GET() { 
  if (!process.env.ARCGIS_CLIENT_ID || !process.env.ARCGIS_REFRESH_TOKEN) {
      console.error("Missing ArcGIS Environment Variables.");
      return NextResponse.json(
        { error: "Server Configuration Error: Missing credentials." },
        { status: 500 }
      );
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.ARCGIS_CLIENT_ID,
      client_secret: process.env.ARCGIS_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: process.env.ARCGIS_REFRESH_TOKEN,
    });

    const response = await fetch(ARCGIS_TOKEN_URL, {
        method: "POST", 
        headers: {
            "Content-Type": "application/x-www-form-urlencoded", 
        },
        body: params.toString(), 
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json(
            { error: data.error_description || data.error || "ArcGIS token refresh failed." },
            { status: response.status }
        );
    }
    
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });

  } catch (error) {
    console.error("Internal Server Error during token refresh:", error);
    return NextResponse.json(
      { error: "Internal Server Error during token refresh." },
      { status: 500 }
    );
  }
}