import { google } from "googleapis"

/**
 * Create a Google auth client from an access token
 */
export function getGoogleAuthClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return auth
}

/**
 * Refresh an expired access token
 */
export async function refreshGoogleAccessToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google",
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date,
    }
  } catch (error) {
    console.error("Error refreshing access token:", error)
    throw error
  }
}
