import { NextRequest, NextResponse } from "next/server";

const EXPRESS_API_URL = "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${EXPRESS_API_URL}/api/batches/active-locations`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(request.headers.get("Authorization") && {
            Authorization: request.headers.get("Authorization")!,
          }),
        },
      }
    );

    if (!response.ok) {
      console.error(`Express API error: ${response.status}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Successfully fetched data from Express backend");

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to backend server",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
