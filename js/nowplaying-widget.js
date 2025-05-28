    /**
 * NowPlaying Widget 
 * Handles the display and functionality of the currently playing widget
 */

document.addEventListener('DOMContentLoaded', () => {
    initNowPlayingWidget();
    
    // If we're on the landing page, show a demo animation after 2 seconds
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/nowplaying-me/')) {
        setTimeout(() => {
            animateNowPlayingDemo();
        }, 2000);
    }
});

// Demo animation for the widget on landing page
function animateNowPlayingDemo() {
    const tracks = [
        { title: "Late night lofi ✨", artist: "ICARUS · Tony Ann", art: "img/logoo.png" },
        { title: "Midnight Melodies", artist: "Dreamwave · Luna Ray", art: "img/logoo.png" },
        { title: "Chill Study Beats", artist: "Mellow Mind · Serene", art: "img/logoo.png" }
    ];
    
    let currentTrackIndex = 0;
    
    // Initial update
    updateNowPlayingWidget(
        tracks[currentTrackIndex].title,
        tracks[currentTrackIndex].artist,
        tracks[currentTrackIndex].art
    );
    
    // Change tracks every 8 seconds
    setInterval(() => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        
        // Animate track change
        const widget = document.getElementById('nowplaying-widget');
        if (widget) {
            widget.classList.add('track-changing');
            setTimeout(() => {
                updateNowPlayingWidget(
                    tracks[currentTrackIndex].title,
                    tracks[currentTrackIndex].artist,
                    tracks[currentTrackIndex].art
                );
                widget.classList.remove('track-changing');
            }, 500);
        }
    }, 8000);
}

function initNowPlayingWidget() {
    const widget = document.getElementById('nowplaying-widget');
    if (!widget) return;
    
    // If we're on the app page, initialize with "No song playing" text
    if (window.location.pathname.includes('app.html')) {
        updateNowPlayingWidget('No song playing', '—', 'img/logoo.png');
        
        // For app.html, don't set up demo event handlers
        // The real event handlers will be set up by setupControlButtons()
    } else {
        // For non-app pages like index.html, set up demo event handlers
        setupDemoControlButtons(widget);    }

    // Make the widget draggable for desktop users, regardless of page
    makeWidgetDraggable(widget);
}

// Setup demo control buttons for non-app pages
function setupDemoControlButtons(widget) {
    const playBtn = widget.querySelector('.play-btn');
    const prevBtn = widget.querySelector('.prev-btn');
    const nextBtn = widget.querySelector('.next-btn');
    const moreBtn = widget.querySelector('.more-btn');
    
    // Play/pause functionality (demo only)
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const icon = playBtn.querySelector('i');
            
            // Toggle play/pause icon
            if (icon.classList.contains('fa-play')) {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
            } else {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    }

    // Demo functionality for other buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            console.log('Previous track (demo)');
            // Animation effect
            prevBtn.classList.add('btn-active');
            setTimeout(() => prevBtn.classList.remove('btn-active'), 200);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            console.log('Next track (demo)');
            // Animation effect
            nextBtn.classList.add('btn-active');
            setTimeout(() => nextBtn.classList.remove('btn-active'), 200);
        });
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            console.log('More options (demo)');
            // Animation effect
            moreBtn.classList.add('btn-active');
            setTimeout(() => moreBtn.classList.remove('btn-active'), 200);
        });
    }
}

function makeWidgetDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // Only allow dragging by the info area, not the buttons
    const dragHandle = element.querySelector('.nowplaying-info');
    if (!dragHandle) return;
    
    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
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

// Helper function to update the widget with track info
function updateNowPlayingWidget(title, artist, albumArt) {
    const titleEl = document.querySelector('.nowplaying-title');
    const artistEl = document.querySelector('.nowplaying-artist');
    const artEl = document.getElementById('nowplaying-art');
    
    if (titleEl && title) titleEl.textContent = title;
    if (artistEl && artist) artistEl.textContent = artist;
    if (artEl && albumArt) artEl.src = albumArt;
      // Configure the album art click behavior
    const albumContainer = document.querySelector('.nowplaying-album');
    if (albumContainer) {
        if (currentSpotifyData && currentSpotifyData.item && currentSpotifyData.item.album && 
            currentSpotifyData.item.album.external_urls && currentSpotifyData.item.album.external_urls.spotify) {
            // If song is playing, make album art clickable
            albumContainer.style.cursor = 'pointer';
            albumContainer.title = 'Open album in Spotify';
            albumContainer.onclick = () => {
                window.open(currentSpotifyData.item.album.external_urls.spotify, '_blank');
            };
        } else {
            // If no song is playing, remove clickability
            albumContainer.style.cursor = 'default';
            albumContainer.title = '';
            albumContainer.onclick = null;
        }
    }
}

// Function to show a premium required tooltip
function showPremiumRequiredTooltip(button) {
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.premium-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'premium-tooltip';
    tooltip.innerHTML = '<i class="fa-solid fa-crown"></i> Spotify Premium Required';
    
    // Position the tooltip above the button
    const buttonRect = button.getBoundingClientRect();
    const tooltipHeight = 40; // Estimated height
    
    // Add to body
    document.body.appendChild(tooltip);
    
    // Position after append so we can get actual dimensions
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.top = (buttonRect.top - tooltipRect.height - 10) + 'px';
    tooltip.style.left = (buttonRect.left + (buttonRect.width - tooltipRect.width) / 2) + 'px';
    
    // Show it
    setTimeout(() => {
        tooltip.classList.add('show');
    }, 10);
    
    // Remove after a delay
    setTimeout(() => {
        tooltip.classList.remove('show');
        setTimeout(() => {
            tooltip.remove();
        }, 300);
    }, 3000);
}

// Function to show visual feedback for a button when an error occurs
function showButtonErrorFeedback(button) {
    if (!button) return;
    
    // Add error class
    button.classList.add('control-btn-error');
    
    // Remove it after a short delay
    setTimeout(() => {
        button.classList.remove('control-btn-error');
    }, 800);
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
function setupPeriodicUpdates() {
    // Clear any existing timer
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    
    // Do an immediate first update
    refreshCurrentlyPlaying();
    
    // Fetch currently playing track every 10 seconds
    updateTimer = setInterval(refreshCurrentlyPlaying, 10000); // Update every 10 seconds
}

// Function to refresh the currently playing data
async function refreshCurrentlyPlaying() {
    if (!spotifyAccessToken) {
        // Try to get token again if it's not available
        spotifyAccessToken = localStorage.getItem('spotify_access_token');
        if (!spotifyAccessToken) return;
    }
    
    try {
        // Use the same function as in app.js
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
            }
        });
        
        // Handle responses
        if (response.status === 204) {
            // Nothing playing
            if (window.displayCurrentlyPlaying) {
                window.displayCurrentlyPlaying(null);
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch currently playing: ${response.status}`);
        }
        
        const data = await response.json();
        if (window.displayCurrentlyPlaying) {
            window.displayCurrentlyPlaying(data);
        }
    } catch (error) {
        console.error('Error updating currently playing:', error);
    }
}

// Helper function to fetch updated track info after a control action
async function fetchUpdatedTrackInfo() {
    try {
        const dataResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
            }
        });
        
        if (dataResponse.status === 204) {
            // Nothing is playing
            if (window.displayCurrentlyPlaying) {
                window.displayCurrentlyPlaying(null);
            }
            return;
        }
        
        if (dataResponse.ok) {
            const data = await dataResponse.json();
            if (window.displayCurrentlyPlaying) {
                window.displayCurrentlyPlaying(data);
            }
        } else {
            console.error(`Failed to fetch updated track: ${dataResponse.status}`);
        }
    } catch (error) {
        console.error('Error fetching updated track:', error);
    }
}

// Connect control buttons to Spotify API
function setupControlButtons() {
    // Prevent multiple handlers from being attached
    const setupKey = 'nowplaying_controls_setup';
    if (document.body.dataset[setupKey] === 'true') {
        console.log('Control buttons already set up, skipping duplicate setup');
        return;
    }
    
    // Mark as set up to avoid duplicate handlers
    document.body.dataset[setupKey] = 'true';
    
    // Get device ID first to ensure proper playback control
    const getActiveDeviceId = async () => {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
                headers: {
                    'Authorization': `Bearer ${spotifyAccessToken}`
                }
            });
            
            if (!response.ok) {
                console.warn('Failed to fetch devices:', response.status);
                return null;
            }
            
            const data = await response.json();
            console.log('Available devices:', data);
            
            // Find the active device, or return the first available one
            const activeDevice = data.devices.find(d => d.is_active) || data.devices[0];
            return activeDevice ? activeDevice.id : null;
        } catch (error) {
            console.error('Error fetching devices:', error);
            return null;
        }
    };
    
    const playBtn = document.querySelector('.play-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (playBtn) {
        playBtn.addEventListener('click', async () => {
            if (!spotifyAccessToken) {
                showButtonErrorFeedback(playBtn);
                return;
            }
            
            const icon = playBtn.querySelector('i');
            const isPlaying = icon.classList.contains('fa-pause');
            
            try {
                // Send request to Spotify API
                const endpoint = isPlaying ? 'pause' : 'play';
                
                // Add animation to show button press
                playBtn.classList.add('btn-active');
                setTimeout(() => playBtn.classList.remove('btn-active'), 200);
                
                const deviceId = await getActiveDeviceId();
                const url = deviceId 
                    ? `https://api.spotify.com/v1/me/player/${endpoint}?device_id=${deviceId}`
                    : `https://api.spotify.com/v1/me/player/${endpoint}`;
                    
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${spotifyAccessToken}`
                    }
                });
                
                if (response.status === 204) {
                    // Success, toggle icon
                    if (isPlaying) {
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                        
                        // Stop progress tracking when paused
                        if (progressUpdateTimer) {
                            clearInterval(progressUpdateTimer);
                        }
                        
                        // Update the is_playing property in current data
                        if (currentSpotifyData) {
                            currentSpotifyData.is_playing = false;
                        }
                    } else {
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        
                        // Update the is_playing property in current data
                        if (currentSpotifyData) {
                            currentSpotifyData.is_playing = true;
                            startProgressTracking(currentSpotifyData);
                        }
                    }                } else if (response.status === 403) {
                    console.warn('Player command failed: This feature may require Spotify Premium or proper device setup');
                    showButtonErrorFeedback(playBtn);
                } else {
                    console.error(`Failed to control playback: ${response.status}`);
                    showButtonErrorFeedback(playBtn);
                }
            } catch (error) {
                console.error('Error controlling playback:', error);
            }
        });
    }
      if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
            if (!spotifyAccessToken) {
                showButtonErrorFeedback(prevBtn);
                return;
            }
            
            try {
                // Add animation to show button press
                prevBtn.classList.add('btn-active');
                setTimeout(() => prevBtn.classList.remove('btn-active'), 200);
                
                const deviceId = await getActiveDeviceId();
                const url = deviceId 
                    ? `https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`
                    : `https://api.spotify.com/v1/me/player/previous`;
                    
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${spotifyAccessToken}`
                    }
                });
                  if (response.status === 204) {
                    // Success - button animation already handled above
                      // Immediately fetch updated track info
                    setTimeout(fetchUpdatedTrackInfo, 500);
                } else if (response.status === 403) {
                    console.warn('Player command failed: This feature may require Spotify Premium or proper device setup');
                    showButtonErrorFeedback(prevBtn);
                } else {
                    console.error(`Failed to skip to previous: ${response.status}`);
                    showButtonErrorFeedback(prevBtn);
                }
            } catch (error) {
                console.error('Error skipping to previous track:', error);
            }
        });
    }
      if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            if (!spotifyAccessToken) {
                showButtonErrorFeedback(nextBtn);
                return;
            }
            
            try {
                // Add animation to show button press
                nextBtn.classList.add('btn-active');
                setTimeout(() => nextBtn.classList.remove('btn-active'), 200);
                
                const deviceId = await getActiveDeviceId();
                const url = deviceId 
                    ? `https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`
                    : `https://api.spotify.com/v1/me/player/next`;
                    
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${spotifyAccessToken}`
                    }
                });
                  if (response.status === 204) {
                    // Success - button animation already handled above
                      // Immediately fetch updated track info
                    setTimeout(fetchUpdatedTrackInfo, 500);
                } else if (response.status === 403) {
                    console.warn('Player command failed: This feature may require Spotify Premium or proper device setup');
                    showButtonErrorFeedback(nextBtn);
                } else {
                    console.error(`Failed to skip to next: ${response.status}`);
                    showButtonErrorFeedback(nextBtn);
                }
            } catch (error) {
                console.error('Error skipping to next track:', error);
            }
        });
    }
      // Add more options button functionality
    const moreBtn = document.querySelector('.more-btn');
    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            // Animation effect
            moreBtn.classList.add('btn-active');
            setTimeout(() => moreBtn.classList.remove('btn-active'), 200);
            
            // For now, just open the current track in Spotify
            if (currentSpotifyData && currentSpotifyData.item && currentSpotifyData.item.external_urls && currentSpotifyData.item.external_urls.spotify) {
                window.open(currentSpotifyData.item.external_urls.spotify, '_blank');
            } else {
                // Show error feedback if no track is available
                showButtonErrorFeedback(moreBtn);
            }
        });
    }
}

// Globals to store player state and access token
let currentSpotifyData = null;
let spotifyAccessToken = null;
let updateTimer = null;
let progressUpdateTimer = null;

// Check if we're on the app page, and if so, connect the widget to Spotify data
if (window.location.pathname.includes('app.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for the app.js to finish loading
        setTimeout(() => {
            // Try to hook into existing functionality
            const originalDisplayCurrentlyPlaying = window.displayCurrentlyPlaying;
            spotifyAccessToken = localStorage.getItem('spotify_access_token');
            
            if (typeof originalDisplayCurrentlyPlaying === 'function') {
                // Override the function to update our widget too
                window.displayCurrentlyPlaying = function(data) {
                    // Call the original function first
                    originalDisplayCurrentlyPlaying(data);
                    
                    // Store the current data globally for later use
                    currentSpotifyData = data;
                      // Now update our widget
                    if (!data || !data.item) {
                        updateNowPlayingWidget('No song playing', '—', 'img/logoo.png');
                        
                        // Reset play button to show play icon
                        const playBtn = document.querySelector('.play-btn i');
                        if (playBtn) {
                            playBtn.classList.remove('fa-pause');
                            playBtn.classList.add('fa-play');
                        }
                        
                        // Reset progress bar
                        const progressBar = document.querySelector('.progress-bar');
                        if (progressBar) {
                            progressBar.style.width = '0%';
                        }
                        
                        return;
                    }
                    
                    const trackName = data.item.name;
                    const artistNames = data.item.artists.map(artist => artist.name).join(' · ');
                    const albumArt = data.item.album && data.item.album.images && data.item.album.images.length > 0 
                        ? data.item.album.images[0].url 
                        : 'img/logoo.png';
                    
                    updateNowPlayingWidget(trackName, artistNames, albumArt);
                    
                    // Update play/pause button state
                    const playBtn = document.querySelector('.play-btn i');
                    if (playBtn) {
                        if (data.is_playing) {
                            playBtn.classList.remove('fa-play');
                            playBtn.classList.add('fa-pause');
                        } else {
                            playBtn.classList.remove('fa-pause');
                            playBtn.classList.add('fa-play');
                        }
                    }
                    
                    // Update progress bar
                    updateProgressBar(data);
                    
                    // Start progress tracking
                    startProgressTracking(data);
                };
                
                // Set up periodic refresh of now playing
                setupPeriodicUpdates();
                
                // Connect control buttons to Spotify API
                setupControlButtons();
            }
        }, 1000); // Wait 1 second for app.js to initialize
    });
}
