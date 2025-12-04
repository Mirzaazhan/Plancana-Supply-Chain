// ArcGIS OAuth Token Management
// This handles generating and refreshing OAuth tokens for private ArcGIS content

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface StoredToken {
  token: string;
  expiresAt: number;
}

let cachedToken: StoredToken | null = null;

/**
 * Generate a new access token using the refresh token
 */
async function generateAccessToken(): Promise<string> {
  const clientId = process.env.ARCGIS_CLIENT_ID;
  const clientSecret = process.env.ARCGIS_CLIENT_SECRET;
  const refreshToken = process.env.ARCGIS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing ArcGIS OAuth credentials in environment variables');
  }

  try {
    const response = await fetch('https://www.arcgis.com/sharing/rest/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate token: ${response.status} - ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    // Cache the token with expiration time (subtract 5 minutes for safety)
    const expiresAt = Date.now() + (data.expires_in - 300) * 1000;
    cachedToken = {
      token: data.access_token,
      expiresAt,
    };

    console.log('✅ Generated new ArcGIS access token, expires in', data.expires_in, 'seconds');

    return data.access_token;
  } catch (error) {
    console.error('❌ Failed to generate ArcGIS access token:', error);
    throw error;
  }
}

/**
 * Get a valid access token (uses cached token if still valid)
 */
export async function getArcGISToken(): Promise<string> {
  // Check if we have a cached token that's still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('✅ Using cached ArcGIS token');
    return cachedToken.token;
  }

  // Generate a new token
  console.log('🔄 Generating new ArcGIS token...');
  return await generateAccessToken();
}

/**
 * Force refresh the token (useful if you suspect the token is invalid)
 */
export async function refreshArcGISToken(): Promise<string> {
  console.log('🔄 Force refreshing ArcGIS token...');
  cachedToken = null;
  return await generateAccessToken();
}

/**
 * Clear the cached token
 */
export function clearArcGISToken(): void {
  cachedToken = null;
  console.log('🧹 Cleared cached ArcGIS token');
}
