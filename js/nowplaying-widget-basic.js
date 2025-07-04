/**
 * Basic NowPlaying Widget 
 * Simple version that works for all Spotify users (not just Premium subscribers)
 * Shows album cover, song name, artist, and a link to open in Spotify
 */

// Global variables
let currentSpotifyData = null;
let updateTimer = null;
let progressUpdateTimer = null;
let isTokenRefreshing = false; // Flag to prevent multiple refresh attempts
let shareOptionsVisible = false; // Track if share options are visible

// Add event listener for both document ready and window load to ensure everything is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded for basic widget');
    initNowPlayingWidget();
});

window.addEventListener('load', () => {
    console.log('Window fully loaded for basic widget');
    checkForExistingTrackData();
});

// Handle window resize to close modals/dropdowns when switching between mobile and desktop
window.addEventListener('resize', () => {    // Close share modal if open
    const modal = document.querySelector('.track-share-modal');
    if (modal && modal.classList.contains('active')) {
        closeTrackShareModal();
    }
    
    // Close share dropdown if open
    const shareOptions = document.querySelector('.share-options');
    if (shareOptions && shareOptionsVisible) {
        shareOptions.classList.remove('active');
        shareOptionsVisible = false;
    }
});

// Check if there's already track data available from app.js
function checkForExistingTrackData() {
    console.log('Checking for existing track data');
    if (window.currentTrackData) {
        console.log('Found existing track data:', window.currentTrackData.item?.name);
        handleTrackData(window.currentTrackData);
    } else {
        console.log('No existing track data found');
        // If we're on the app page, try to refresh data from Spotify
        if (window.location.pathname.includes('app.html')) {
            const accessToken = localStorage.getItem('spotify_access_token');
            if (accessToken) {
                refreshCurrentlyPlaying(accessToken);
            }
        }
    }
}

// Function to set up the share button and related functionality
function setupShareButton() {
    const shareButton = document.querySelector('.share-button');
    if (!shareButton) return;
      // Create the share modal for mobile devices
    createTrackShareModal();

    // Create the share options container for desktop if it doesn't exist
    let shareOptions = document.querySelector('.share-options');
    if (!shareOptions) {
        shareOptions = document.createElement('div');
        shareOptions.className = 'share-options';        shareOptions.innerHTML = `            <button class="share-option" data-share-type="copy">
                <i class="fa-regular fa-copy"></i>
                Copy to clipboard
            </button>
            <button class="share-option" data-share-type="twitter">
                <i class="fa-brands fa-twitter"></i>
                Share to Twitter
            </button>
        `;
        document.querySelector('.nowplaying-widget').appendChild(shareOptions);
    }
    
    // Toggle share options visibility when clicking the share button
    shareButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Add animation effect
        shareButton.classList.add('btn-active');
        setTimeout(() => shareButton.classList.remove('btn-active'), 200);
          // Check if we're on mobile
        if (window.innerWidth <= 768) {
            // Open modal on mobile
            openTrackShareModal();
        } else {
            // Use dropdown on desktop
            shareOptionsVisible = !shareOptionsVisible;
            if (shareOptionsVisible) {
                shareOptions.classList.add('active');
            } else {
                shareOptions.classList.remove('active');
            }
        }
    });
    
    // Handle share option clicks for desktop dropdown
    const shareOptionButtons = document.querySelectorAll('.share-option');
    shareOptionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const shareType = button.getAttribute('data-share-type');
            shareTrack(shareType);
            
            // Hide options after selection
            shareOptions.classList.remove('active');
            shareOptionsVisible = false;
        });
    });
    
    // Close share options when clicking outside (desktop only)
    document.addEventListener('click', (e) => {
        if (shareOptionsVisible && !e.target.closest('.share-options') && !e.target.closest('.share-button')) {
            shareOptions.classList.remove('active');
            shareOptionsVisible = false;
        }
    });
}

// Create the share modal for mobile devices
function createTrackShareModal() {
    // Check if modal already exists
    if (document.querySelector('.track-share-modal')) return;
      const modal = document.createElement('div');
    modal.className = 'track-share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-header">
                <h3>Share Current Track</h3>
                <button class="close-track-share-modal" aria-label="Close modal">&times;</button>
            </div>            <div class="share-modal-options">
                <button class="share-modal-option copy" data-share-type="copy">
                    <i class="fa-regular fa-copy"></i>
                    Copy to Clipboard
                </button>
                <button class="share-modal-option twitter" data-share-type="twitter">
                    <i class="fa-brands fa-twitter"></i>
                    Share on Twitter
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
      // Set up event listeners for the modal
    const closeBtn = modal.querySelector('.close-track-share-modal');
    closeBtn.addEventListener('click', closeTrackShareModal);
      // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTrackShareModal();
        }
    });
    
    // Set up share options for modal
    const modalOptions = modal.querySelectorAll('.share-modal-option');
    modalOptions.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();            const shareType = button.getAttribute('data-share-type');
            shareTrack(shareType);
            closeTrackShareModal();
        });
    });
}

// Open the track share modal
function openTrackShareModal() {
    const modal = document.querySelector('.track-share-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

// Close the track share modal
function closeTrackShareModal() {
    const modal = document.querySelector('.track-share-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Function to share the currently playing track
function shareTrack(shareType) {
    if (!currentSpotifyData || !currentSpotifyData.item) {
        showShareError("No track currently playing to share");
        return;
    }
    
    const trackName = currentSpotifyData.item.name;
    const artistName = currentSpotifyData.item.artists.map(artist => artist.name).join(', ');
    const trackUrl = currentSpotifyData.item.external_urls?.spotify || '';
    
    const shareText = `🎵 Now playing: ${trackName} by ${artistName} #nowPlayingMe`;    switch (shareType) {
        case 'copy':
            copyToClipboard(`${shareText} ${trackUrl}`);
            break;        
        case 'twitter':
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(trackUrl)}`;
            window.open(twitterUrl, '_blank');
            break;
        default:
            console.error('Unknown share type:', shareType);
    }
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showShareSuccess("Copied to clipboard!");
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showShareError("Failed to copy to clipboard");
        });
}

// Show success message after sharing
function showShareSuccess(message) {
    const widget = document.querySelector('.nowplaying-widget');
    let notification = document.querySelector('.share-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'share-notification';
        widget.appendChild(notification);
    }
    
    notification.innerHTML = `<i class="fa-solid fa-check"></i> ${message}`;
    notification.style.backgroundColor = 'rgba(0, 229, 233, 0.9)';
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 2000);
}

// Show error message if sharing fails
function showShareError(message) {
    const widget = document.querySelector('.nowplaying-widget');
    let notification = document.querySelector('.share-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'share-notification';
        widget.appendChild(notification);
    }
    
    notification.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
    notification.style.backgroundColor = 'rgba(255, 62, 62, 0.9)';
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 2000);
}

// Initialize the widget
function initNowPlayingWidget() {
    const widget = document.getElementById('nowplaying-widget');
    if (!widget) {
        console.error('Widget element not found');
        return;
    }
    
    console.log('Initializing basic nowplaying widget');
    
    // Initialize with "No song playing" text
    updateNowPlayingWidget('No song playing', '—', 'img/logoo.png', null);
    
    // Make the widget draggable for desktop users
    makeWidgetDraggable(widget);
    
    // Setup the share button functionality
    setupShareButton();

    // Check if we're on the app page, and if so, connect to Spotify data
    if (window.location.pathname.includes('app.html')) {
        console.log('We are on the app page, setting up data connection');
        
        // Set up polling to check for track updates
        setInterval(checkForExistingTrackData, 3000);
        
        // Try to get access token
        const spotifyAccessToken = localStorage.getItem('spotify_access_token');
        if (spotifyAccessToken) {
            console.log('Found Spotify access token');
            
            // Do immediate refresh to get current track data
            refreshCurrentlyPlaying(spotifyAccessToken);
            
            // Set up regular updates
            setupPeriodicUpdates(spotifyAccessToken);
            
            // Override the original displayCurrentlyPlaying function to update our widget too
            if (typeof window.originalDisplayCurrentlyPlaying !== 'function') {
                window.originalDisplayCurrentlyPlaying = window.displayCurrentlyPlaying;
                window.displayCurrentlyPlaying = function(data) {
                    // Call the original function
                    window.originalDisplayCurrentlyPlaying(data);
                    
                    // Update our widget with the same data
                    if (data && data.item) {
                        handleTrackData(data);
                    }
                };
                console.log('Successfully overrode displayCurrentlyPlaying function');
            }
        } else {
            console.warn('No Spotify access token found');
        }
    }
}

// Handle track data updates
function handleTrackData(data) {
    if (!data || !data.item) {
        updateNowPlayingWidget('No song playing', '—', 'img/logoo.png', null);
        currentSpotifyData = null;
        return;
    }
    
    // Store the current data globally for sharing and later use
    currentSpotifyData = data;
    
    const trackName = data.item.name;
    const artistNames = data.item.artists.map(artist => artist.name).join(' · ');
    const albumArt = data.item.album && data.item.album.images && data.item.album.images.length > 0 
        ? data.item.album.images[0].url 
        : 'img/logoo.png';
    const trackUrl = data.item.external_urls && data.item.external_urls.spotify 
        ? data.item.external_urls.spotify
        : null;
    
    console.log(`Updating widget with track: ${trackName} by ${artistNames}`);
    updateNowPlayingWidget(trackName, artistNames, albumArt, trackUrl);
    
    // Update progress bar
    updateProgressBar(data);
    
    // Start progress tracking
    if (data.is_playing) {
        startProgressTracking(data);
    }
}

// Helper function to update the widget with track info
function updateNowPlayingWidget(title, artist, albumArt, spotifyUrl) {
    const titleEl = document.querySelector('.nowplaying-title');
    const artistEl = document.querySelector('.nowplaying-artist');
    const artEl = document.getElementById('nowplaying-art');
    const spotifyLink = document.querySelector('.open-in-spotify');
    if (titleEl && title) {
        titleEl.textContent = title;
    }

    if (artistEl && artist) artistEl.textContent = artist;
    if (artEl && albumArt) artEl.src = albumArt;
      // Update the Spotify link
    if (spotifyLink) {
        if (spotifyUrl) {
            spotifyLink.href = spotifyUrl;
            spotifyLink.style.opacity = '1';
            spotifyLink.style.pointerEvents = 'auto';
        } else {
            spotifyLink.href = '#';
            spotifyLink.style.opacity = '0.5';
            spotifyLink.style.pointerEvents = 'none';
        }
    }
    
    // Update the share button state
    const shareButton = document.querySelector('.share-button');
    if (shareButton) {
        if (spotifyUrl) {
            // If song is playing, make share button clickable
            shareButton.style.opacity = '1';
            shareButton.style.pointerEvents = 'auto';
            shareButton.style.cursor = 'pointer';
        } else {
            // If no song is playing, disable share button
            shareButton.style.opacity = '0.5';
            shareButton.style.pointerEvents = 'none';
            shareButton.style.cursor = 'default';
        }
    }
    
    // Configure the album art click behavior
    const albumContainer = document.querySelector('.nowplaying-album');
    if (albumContainer) {
        if (spotifyUrl) {
            // If song is playing, make album art clickable
            albumContainer.style.cursor = 'pointer';
            albumContainer.title = 'Open track in Spotify';
            albumContainer.onclick = () => {
                window.open(spotifyUrl, '_blank');
            };
        } else {
            // If no song is playing, remove clickability
            albumContainer.style.cursor = 'default';
            albumContainer.title = '';
            albumContainer.onclick = null;
        }
    }
}

function makeWidgetDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // Use the entire widget as drag handle except clickable elements
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        // Ignore if clicking on the Spotify link or album art (which are clickable)
        if (e.target.closest('.open-in-spotify') || 
            e.target.closest('.nowplaying-album')) {
            return;
        }
        
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // Call a function whenever the cursor moves
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Set the element's new position
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const elementRect = element.getBoundingClientRect();
        
        // Calculate new position but keep within viewport
        let newTop = (element.offsetTop - pos2);
        let newLeft = (element.offsetLeft - pos1);
        
        // Keep widget within viewport bounds
        newTop = Math.max(10, Math.min(newTop, viewportHeight - elementRect.height - 10));
        newLeft = Math.max(10, Math.min(newLeft, viewportWidth - elementRect.width - 10));
        
        // Update position
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        
        // Remove the fixed bottom/right positioning
        element.style.bottom = "auto";
        element.style.right = "auto";
    }

    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Update the progress bar based on current track position
function updateProgressBar(data) {
    if (!data || !data.item || !data.progress_ms || !data.item.duration_ms) return;
    
    const progressPercent = (data.progress_ms / data.item.duration_ms) * 100;
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
    }
}

// Start tracking progress in real time
function startProgressTracking(data) {
    // Clear any existing timer
    if (progressUpdateTimer) {
        clearInterval(progressUpdateTimer);
    }
    
    // If nothing is playing or paused, don't track progress
    if (!data || !data.item || !data.is_playing) return;
    
    // Get current progress and duration
    const duration = data.item.duration_ms;
    let progress = data.progress_ms;
    
    // Update every 1000ms (1 second)
    progressUpdateTimer = setInterval(() => {
        // Increment progress
        progress += 1000;
        
        // If we've reached the end of the track, clear timer and wait for next update
        if (progress >= duration) {
            clearInterval(progressUpdateTimer);
            return;
        }
        
        // Update progress bar
        const progressPercent = (progress / duration) * 100;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }
    }, 1000);
}

// Set up periodic updates to fetch currently playing track
function setupPeriodicUpdates(accessToken) {
    console.log('Setting up periodic updates for nowplaying widget');
    
    // Clear any existing timer
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    
    // Fetch currently playing track every 10 seconds
    updateTimer = setInterval(() => refreshCurrentlyPlaying(accessToken), 10000);
}

// Function to refresh the currently playing data
async function refreshCurrentlyPlaying(accessToken) {
    console.log('Refreshing currently playing track data');
    
    if (!accessToken) {
        // Try to get token again if it's not available
        accessToken = localStorage.getItem('spotify_access_token');
        if (!accessToken) {
            console.error('No access token available');
            return;
        }
    }
    
    try {
        console.log('Fetching data from Spotify API');
        // Fetch the currently playing track
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        console.log('Spotify API response status:', response.status);
        
        // Handle responses
        if (response.status === 204) {
            console.log('Nothing currently playing');
            // Nothing playing
            updateNowPlayingWidget('No song playing', '—', 'img/logoo.png', null);
            
            // Reset progress bar
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
            
            // Update global track data
            window.currentTrackData = null;
            currentSpotifyData = null;
            
            return;
        }
        
        if (response.status === 401) {
            console.error('Unauthorized: Access token expired or invalid');

            // Only show alert and redirect once to prevent multiple alerts
            if (!isTokenRefreshing) {
                isTokenRefreshing = true;

                // Try to refresh the token first before redirecting
                const refreshToken = localStorage.getItem('spotify_refresh_token');
                if (refreshToken && window.refreshAccessToken) {
                    try {
                        console.log('Attempting to refresh access token');
                        const newTokenData = await window.refreshAccessToken(refreshToken);
                        if (newTokenData && newTokenData.access_token) {
                            console.log('Successfully refreshed access token');
                            isTokenRefreshing = false;
                            // Retry the current operation with the new token
                            return refreshCurrentlyPlaying(newTokenData.access_token);
                        }
                    } catch (refreshError) {
                        console.error('Failed to refresh token:', refreshError);
                    }
                }

                // If we couldn't refresh, only then show alert and redirect
                console.log('Token refresh failed, redirecting to login page');
                alert('Your Spotify session has expired. Please log in again.');
                window.location.href = '/';
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch currently playing: ${response.status}`);
        }
          const data = await response.json();
        console.log('Successfully fetched currently playing track:', data.item?.name);
        
        // Store the current data globally for later use
        currentSpotifyData = data;
        window.currentTrackData = data;
        
        // Update the widget with the track data
        handleTrackData(data);
    } catch (error) {
        console.error('Error updating currently playing:', error);
        // Try to show some information in the widget
        updateNowPlayingWidget('Error fetching track', 'Try refreshing the page', 'img/logoo.png', null);
    }
}
