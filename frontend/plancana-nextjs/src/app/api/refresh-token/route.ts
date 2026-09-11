import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Forward to backend which has token cached in memory
    const backendUrl = process.env.BACKEND_URL || "http://backend:3000";
    const response = await fetch(`${backendUrl}/api/refresh-token`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch token from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch ArcGIS token." },
      { status: 500 }
    );
  }
}
