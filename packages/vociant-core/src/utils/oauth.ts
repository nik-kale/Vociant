/**
 * OAuth 2.0 Utilities
 *
 * Supports client credentials and JWT bearer flows
 */

/**
 * OAuth 2.0 Client Credentials Flow
 *
 * @param tokenUrl - OAuth token endpoint
 * @param clientId - Client ID
 * @param clientSecret - Client secret
 * @param scope - Optional scope
 * @returns Access token
 */
export async function getOAuth2ClientCredentialsToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  scope?: string
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (scope) {
    params.append('scope', scope);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth2 token request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * OAuth 2.0 JWT Bearer Flow
 *
 * @param tokenUrl - OAuth token endpoint
 * @param signedJwt - Pre-signed JWT assertion
 * @param scope - Optional scope
 * @returns Access token
 */
export async function getOAuth2JWTBearerToken(
  tokenUrl: string,
  signedJwt: string,
  scope?: string
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: signedJwt,
  });

  if (scope) {
    params.append('scope', scope);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth2 JWT bearer token request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}
