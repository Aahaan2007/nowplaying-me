// Main app functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the app page and handle authentication
    if (window.location.pathname.includes('app.html')) {
        let authResult;
        
        // Check if we came from the callback page first
        const callbackCode = localStorage.getItem('spotify_auth_code');
        const callbackState = localStorage.getItem('spotify_callback_state');
        const callbackError = localStorage.getItem('spotify_auth_error');
        
        if (callbackCode || callbackError) {
            // Clear the callback data
            localStorage.removeItem('spotify_auth_code');
            localStorage.removeItem('spotify_callback_state');
            localStorage.removeItem('spotify_auth_error');
            
            if (callbackError) {
                authResult = { error: callbackError };
            } else {
                // Verify state to prevent CSRF attacks
                if (!callbackState || !verifyAuthState(callbackState)) {
                    authResult = { error: 'state_mismatch' };
                } else {
                    authResult = { code: callbackCode };
                }
            }
        } else {
            // Otherwise try the direct redirect
            authResult = handleSpotifyRedirect();
        }
        
        if (authResult.error) {
            // If there was an error, redirect back to the landing page
            console.error('Authentication error:', authResult.error);
            alert('Authentication failed. Please try again.');
            window.location.href = '/';
            return;
        }
        
        if (authResult.code) {
            // We have an authorization code, now exchange it for an access token
            exchangeCodeForToken(authResult.code)
                .then(tokenData => {
                    if (tokenData.access_token) {
                        // Save tokens in localStorage
                        saveTokens(tokenData);
                        // Initialize the app with the access token
                        initializeApp(tokenData.access_token);
                    } else {
                        throw new Error('Failed to retrieve access token');
                    }
                })
                .catch(error => {
                    console.error('Error getting access token:', error);
                    alert('Authentication failed. Please try again.');
                    window.location.href = '/';
                });
        } else {
            // No code but no error either - check if we have a valid token already
            const token = localStorage.getItem('spotify_access_token');
            const expiry = localStorage.getItem('spotify_token_expiry');
            
            if (token && expiry && new Date().getTime() < parseInt(expiry)) {
                // We have a valid token, initialize the app
                initializeApp(token);
            } else {
                // No valid token, redirect back to home page
                window.location.href = '/';
            }
        }
    }
    
    // Add logout functionality
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Clear tokens from localStorage
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            localStorage.removeItem('spotify_token_expiry');
            localStorage.removeItem('spotify_auth_state');
            
            // Redirect to home page
            window.location.href = '/';
        });
    }
});

// Exchange the authorization code for an access token
async function exchangeCodeForToken(code) {    try {
        // IMPORTANT NOTE: This is not ideal for production as it exposes your client secret
        // In production, you should handle this on a secure backend

        // For development purposes only
        const clientSecret = '519d421dca2046b0a602259a9fc62137'; // Your Spotify client secret
        
        // Using the token proxy to avoid CORS issues
        const tokenEndpoint = 'https://accounts.spotify.com/api/token';
        
        // Build the request body
        const body = new URLSearchParams();
        body.append('grant_type', 'authorization_code');
        body.append('code', code);
        body.append('redirect_uri', spotifyConfig.redirectUri);
        body.append('client_id', spotifyConfig.clientId);
        body.append('client_secret', clientSecret);
        
        // Make the token request
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        throw error;
    }
}

// Save tokens in localStorage with expiry
function saveTokens(tokenData) {
    const now = new Date().getTime();
    const expiryTime = now + (tokenData.expires_in * 1000); // Convert seconds to milliseconds
    
    localStorage.setItem('spotify_access_token', tokenData.access_token);
    localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
    localStorage.setItem('spotify_token_expiry', expiryTime.toString());
}

// Initialize the app with data from Spotify
async function initializeApp(accessToken) {
    // Show loading indicator and hide other containers
    document.getElementById('loading-indicator').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('error-container').classList.add('hidden');
    
    try {
        // Fetch user profile data first to display user info
        const userProfile = await fetchUserProfile(accessToken);
        
        if (!userProfile) {
            throw new Error('Failed to fetch user profile');
        }
        
        displayUserProfile(userProfile);
        
        // Fetch data for different sections in parallel
        const [currentlyPlaying, topTracks, topArtists, recentTracks] = await Promise.all([
            fetchCurrentlyPlaying(accessToken).catch(err => {
                console.error('Error fetching currently playing:', err);
                return null; // Continue with null data if this specific API fails
            }),
            fetchTopTracks(accessToken).catch(err => {
                console.error('Error fetching top tracks:', err);
                return { items: [] }; // Continue with empty data if this specific API fails
            }),
            fetchTopArtists(accessToken).catch(err => {
                console.error('Error fetching top artists:', err);
                return { items: [] }; // Continue with empty data if this specific API fails
            }),
            fetchRecentTracks(accessToken).catch(err => {
                console.error('Error fetching recent tracks:', err);
                return { items: [] }; // Continue with empty data if this specific API fails
            })
        ]);
          // Display the fetched data in the UI
        displayCurrentlyPlaying(currentlyPlaying);
        displayTopTracks(topTracks);
        displayTopArtists(topArtists);
        displayRecentTracks(recentTracks);
        
        // Hide loading indicator and show app content
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        
        // Dispatch custom event to notify stat-cards.js that user data is loaded
        document.dispatchEvent(new CustomEvent('userData:loaded', {
            detail: {
                topTracks,
                topArtists,
                recentTracks,
                currentlyPlaying
            }
        }));
    } catch (error) {
        console.error('Error initializing app:', error);
        
        // Show error container
        document.getElementById('loading-indicator').classList.add('hidden');
        document.getElementById('app-content').classList.add('hidden');
        document.getElementById('error-container').classList.remove('hidden');
        
        // Update error message
        document.getElementById('error-message').textContent = 
            `We couldn't load your Spotify data: ${error.message || 'Unknown error'}`;
        
        // Add event listeners for retry and logout buttons
        document.getElementById('retry-button').addEventListener('click', () => {
            initializeApp(accessToken);
        });
        
        document.getElementById('logout-error-button').addEventListener('click', () => {
            // Clear tokens from localStorage
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            localStorage.removeItem('spotify_token_expiry');
            localStorage.removeItem('spotify_auth_state');
            
            // Redirect to home page
            window.location.href = '/';
        });
    }
}

// Fetch user profile data from Spotify
async function fetchUserProfile(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            // Enhanced logging for failed response
            const errorText = await response.text();
            console.error('Spotify API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                responseText: errorText,
                url: response.url
            });
            throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

// Display user profile information
function displayUserProfile(profile) {
    if (!profile) return;
    
    const displayNameElement = document.getElementById('user-display-name');
    const profileImageElement = document.getElementById('user-profile-image');
    
    if (displayNameElement) {
        displayNameElement.textContent = profile.display_name || profile.id;
    }
    
    if (profileImageElement && profile.images && profile.images.length > 0) {
        profileImageElement.src = profile.images[0].url;
        profileImageElement.classList.remove('hidden');
    }
}

// Fetch currently playing track
async function fetchCurrentlyPlaying(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        // No content means nothing playing
        if (response.status === 204) {
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch currently playing: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching currently playing:', error);
        return null;
    }
}

// Display currently playing track
function displayCurrentlyPlaying(data) {
    const trackNameElement = document.getElementById('current-track-name');
    const artistNameElement = document.getElementById('current-artist-name');
    const albumArtElement = document.getElementById('current-album-art');
    
    if (!data || !data.item) {
        trackNameElement.textContent = 'Not playing';
        artistNameElement.textContent = '-';
        albumArtElement.src = 'img/logoo.png'; // Default image when nothing is playing
        return;
    }
    
    // Link to track
    if (data.item.external_urls && data.item.external_urls.spotify) {
        trackNameElement.innerHTML = `<a href="${data.item.external_urls.spotify}" target="_blank">${data.item.name}</a>`;
    } else {
        trackNameElement.textContent = data.item.name;
    }

    // Link to artists
    const artists = data.item.artists.map(artist => {
        if (artist.external_urls && artist.external_urls.spotify) {
            return `<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`;
        }
        return artist.name;
    }).join(', ');
    artistNameElement.innerHTML = artists;
    
    if (data.item.album && data.item.album.images && data.item.album.images.length > 0) {
        albumArtElement.src = data.item.album.images[0].url;
    } else {
        albumArtElement.src = 'img/logoo.png'; // Fallback image
    }
    
    // Make the function accessible globally so the widget can use it
    window.currentTrackData = data;
}

// Fetch user's top tracks
async function fetchTopTracks(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=6', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch top tracks: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching top tracks:', error);
        return { items: [] };
    }
}

// Display user's top tracks
function displayTopTracks(data) {
    const topTracksList = document.getElementById('top-tracks-list');
    
    if (!data || !data.items || data.items.length === 0) {
        topTracksList.innerHTML = '<li class="placeholder">No top tracks found</li>';
        return;
    }
    
    topTracksList.innerHTML = '';
    
    data.items.forEach((track, index) => {
        const li = document.createElement('li');
        
        const trackLink = track.external_urls && track.external_urls.spotify 
            ? `<a href="${track.external_urls.spotify}" target="_blank">${track.name}</a>` 
            : track.name;

        const artistLinks = track.artists.map(artist => {
            return artist.external_urls && artist.external_urls.spotify
                ? `<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`
                : artist.name;
        }).join(', ');

        li.innerHTML = `
            <span class="track-number">${index + 1}</span>
            <img src="${track.album.images[0].url}" alt="${track.album.name}" width="40" height="40">
            <div class="track-details">
                <div class="track-name">${trackLink}</div>
                <div class="artist-name">${artistLinks}</div>
            </div>
        `;
        
        topTracksList.appendChild(li);
    });
}

// Fetch user's top artists
async function fetchTopArtists(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=6', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch top artists: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching top artists:', error);
        return { items: [] };
    }
}

// Display user's top artists
function displayTopArtists(data) {
    const topArtistsList = document.getElementById('top-artists-list');
    
    if (!data || !data.items || data.items.length === 0) {
        topArtistsList.innerHTML = '<li class="placeholder">No top artists found</li>';
        return;
    }
    
    topArtistsList.innerHTML = '';
    
    data.items.forEach((artist, index) => {        
        const li = document.createElement('li');
        const artistLink = artist.external_urls && artist.external_urls.spotify
            ? `<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`
            : artist.name;

        li.innerHTML = `
            <span class="track-number">${index + 1}</span>
            <img src="${artist.images[0] ? artist.images[0].url : 'img/logoo.png'}" alt="${artist.name}" width="40" height="40" style="border-radius: 50%;">
            <div class="track-details">
                <div class="track-name">${artistLink}</div>
            </div>
        `;
        
        topArtistsList.appendChild(li);
    });
}

// Fetch recently played tracks
async function fetchRecentTracks(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch recently played: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching recently played tracks:', error);
        return { items: [] };
    }
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    
    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Display recently played tracks
function displayRecentTracks(data) {
    const recentTracksList = document.getElementById('recent-tracks-list');
    
    if (!data || !data.items || data.items.length === 0) {
        recentTracksList.innerHTML = '<li class="placeholder">No recent tracks found</li>';
        return;
    }
    
    recentTracksList.innerHTML = '';
    
    data.items.forEach((item, index) => {
        const track = item.track;
        const li = document.createElement('li');
        
        const trackLink = track.external_urls && track.external_urls.spotify
            ? `<a href="${track.external_urls.spotify}" target="_blank">${track.name}</a>`
            : track.name;

        const artistLinks = track.artists.map(artist => {
            return artist.external_urls && artist.external_urls.spotify
                ? `<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`
                : artist.name;
        }).join(', ');

        li.innerHTML = `
            <img src="${track.album.images[0] ? track.album.images[0].url : 'img/logoo.png'}" alt="${track.album.name}" width="40" height="40">
            <div class="track-details">
                <div class="track-name">${trackLink}</div>
                <div class="artist-name">${artistLinks}</div>
                <div class="played-at">${formatRelativeTime(item.played_at)}</div>
            </div>
        `;
        
        recentTracksList.appendChild(li);
    });
}
