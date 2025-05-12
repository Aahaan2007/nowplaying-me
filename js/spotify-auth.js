// Spotify API Configuration
const spotifyConfig = {
    clientId: 'c7f72e961b8745a4bd5b7d44d86ed3ec', // Replace with your Spotify Developer Client ID
    clientSecret: '519d421dca2046b0a602259a9fc62137', // Only used server-side in production
    redirectUri: window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
        ? window.location.origin + '/app.html'  // Use app.html for local development
        : 'https://nowplaying-me.vercel.app/callback', // Use the callback endpoint for production
    scopes: [
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-read-playback-state'
    ],
    // Spotify accounts service endpoints
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token'
};

// Generate a random string for state parameter to prevent CSRF attacks
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Save auth state in localStorage
function saveAuthState(state) {
    localStorage.setItem('spotify_auth_state', state);
}

// Verify the auth state returned by Spotify
function verifyAuthState(state) {
    const savedState = localStorage.getItem('spotify_auth_state');
    return state === savedState;
}

// Refresh an expired access token using the refresh token
async function refreshAccessToken(refreshToken) {
    try {
        const tokenEndpoint = 'https://accounts.spotify.com/api/token';
        
        // Build the request body
        const body = new URLSearchParams();
        body.append('grant_type', 'refresh_token');
        body.append('refresh_token', refreshToken);
        body.append('client_id', spotifyConfig.clientId);
        body.append('client_secret', spotifyConfig.clientSecret);
        
        // Make the token refresh request
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
        }
        
        const tokenData = await response.json();
        
        // Update tokens in localStorage
        const now = new Date().getTime();
        const expiryTime = now + (tokenData.expires_in * 1000); // Convert seconds to milliseconds
        
        localStorage.setItem('spotify_access_token', tokenData.access_token);
        localStorage.setItem('spotify_token_expiry', expiryTime.toString());
        
        // If we got a new refresh token (rare), save it too
        if (tokenData.refresh_token) {
            localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
        }
        
        return tokenData;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}

// Get a valid access token (or refresh it if expired)
async function getValidAccessToken() {
    const accessToken = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    const expiryTime = localStorage.getItem('spotify_token_expiry');
    const now = new Date().getTime();
    
    // If we have a valid access token, return it
    if (accessToken && expiryTime && now < parseInt(expiryTime)) {
        return accessToken;
    }
    
    // If we have a refresh token, try to get a new access token
    if (refreshToken) {
        try {
            const tokenData = await refreshAccessToken(refreshToken);
            return tokenData.access_token;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            // Clear all tokens since refresh failed
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            localStorage.removeItem('spotify_token_expiry');
            return null;
        }
    }
    
    // No valid tokens available
    return null;
}

// Handle the login button click
function initiateSpotifyLogin() {
    // Generate and save state
    const state = generateRandomString(16);
    saveAuthState(state);
    
    // Build the authorization URL with query parameters
    const authUrl = new URL(spotifyConfig.authEndpoint);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', spotifyConfig.clientId);
    authUrl.searchParams.append('scope', spotifyConfig.scopes.join(' '));
    authUrl.searchParams.append('redirect_uri', spotifyConfig.redirectUri);
    authUrl.searchParams.append('state', state);
    
    // Redirect the user to Spotify's authorization page
    window.location.href = authUrl.toString();
}

// Handle the redirect from Spotify
function handleSpotifyRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    // Clear the URL parameters
    if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Handle error cases
    if (error) {
        console.error('Spotify authentication error:', error);
        return { error };
    }
    
    // Verify state to prevent CSRF attacks
    if (!state || !verifyAuthState(state)) {
        console.error('State mismatch - possible CSRF attack');
        return { error: 'state_mismatch' };
    }
    
    // If we have a code, we can exchange it for an access token
    if (code) {
        return { code };
    }
    
    return { error: 'no_code' };
}

// Initialize event listeners once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login_button');
    
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            initiateSpotifyLogin();
        });
    }
});
