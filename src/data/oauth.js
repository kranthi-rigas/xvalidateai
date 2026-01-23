export const GOOGLE_OAUTH_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  SCOPE: "openid profile email",
  RESPONSE_TYPE: "code",
};
