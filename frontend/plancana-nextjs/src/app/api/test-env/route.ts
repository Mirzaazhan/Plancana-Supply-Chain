import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "API is working",
    hasArcGISClientId: !!process.env.ARCGIS_CLIENT_ID,
    hasArcGISClientSecret: !!process.env.ARCGIS_CLIENT_SECRET,
    hasArcGISRefreshToken: !!process.env.ARCGIS_REFRESH_TOKEN,
    hasOpenWeatherKey: !!process.env.OPENWEATHER_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
