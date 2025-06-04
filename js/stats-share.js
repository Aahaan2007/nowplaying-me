/**
 * Stats Sharing Functionality
 * Handles sharing of user's music stats from the dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    setupStatsSharing();
});

// Set up stats sharing functionality
function setupStatsSharing() {
    // Create modal for stats sharing
    createShareModal();
    
    // Set up the share button
    const shareButton = document.querySelector('.stats-share-button');
    if (shareButton) {
        shareButton.addEventListener('click', () => {
            openShareModal();
        });
    }
}

// Create the modal HTML
function createShareModal() {
    const modal = document.createElement('div');
    modal.className = 'stats-share-modal';
    modal.innerHTML = `
        <div class="stats-modal-content">
            <div class="stats-modal-header">
                <h3>Share Your Music Stats</h3>
                <button class="close-modal" aria-label="Close modal">&times;</button>
            </div>
            <div class="stats-share-options">
                <button class="stats-share-option copy">
                    <i class="fa-regular fa-copy"></i>
                    Copy to Clipboard
                </button>
                <button class="stats-share-option twitter">
                    <i class="fa-brands fa-twitter"></i>
                    Share on Twitter
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up event listeners for the modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', closeShareModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeShareModal();
        }
    });
    
    // Set up share options
    const copyBtn = modal.querySelector('.stats-share-option.copy');
    const twitterBtn = modal.querySelector('.stats-share-option.twitter');
    
    copyBtn.addEventListener('click', () => {
        shareStats('copy');
        closeShareModal();
    });
    
    twitterBtn.addEventListener('click', () => {
        shareStats('twitter');
        closeShareModal();
    });
    
}

// Open the share modal
function openShareModal() {
    const modal = document.querySelector('.stats-share-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

// Close the share modal
function closeShareModal() {
    const modal = document.querySelector('.stats-share-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Share stats based on selected method
function shareStats(method) {
    // Get user's display name
    const username = document.getElementById('user-display-name').textContent;
    
    // Get top tracks data
    const topTracks = [];
    document.querySelectorAll('#top-tracks-list li:not(.placeholder)').forEach((item, index) => {
        if (index < 3) { // Only include top 3
            const trackName = item.querySelector('.track-name')?.textContent;
            const artistName = item.querySelector('.artist-name')?.textContent;
            if (trackName && artistName) {
                topTracks.push(`${trackName} by ${artistName}`);
            }
        }
    });
    
    // Get top artists data
    const topArtists = [];
    document.querySelectorAll('#top-artists-list li:not(.placeholder)').forEach((item, index) => {
        if (index < 3) { // Only include top 3
            const artistName = item.textContent;
            if (artistName) {
                topArtists.push(artistName);
            }
        }
    });
    
    // Create share text
    let shareText = `🎵 ${username}'s Music Taste on nowPlaying.me:\n\n`;
    
    if (topTracks.length > 0) {
        shareText += `🔥 Top Tracks:\n`;
        topTracks.forEach((track, index) => {
            shareText += `${index + 1}. ${track}\n`;
        });
        shareText += '\n';
    }
    
    if (topArtists.length > 0) {
        shareText += `⭐ Top Artists:\n`;
        topArtists.forEach((artist, index) => {
            shareText += `${index + 1}. ${artist}\n`;
        });
    }
    
    shareText += '\nCheck out your own stats at nowplaying.me!';
    
    switch (method) {
        case 'copy':
            copyToClipboard(shareText);
            break;
            
        case 'twitter':
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
            window.open(twitterUrl, '_blank');
            break;
    }
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showShareNotification('Copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showShareNotification('Failed to copy to clipboard', true);
        });
}

// Show notification after sharing
function showShareNotification(message, isError = false) {
    // Create or get notification element
    let notification = document.querySelector('.stats-share-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'stats-share-notification';
        document.body.appendChild(notification);
    }
    
    // Set message and styling
    notification.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-check'}"></i> ${message}`;
    notification.style.backgroundColor = isError ? 'rgba(255, 62, 62, 0.9)' : 'rgba(0, 229, 233, 0.9)';
    
    // Show notification
    notification.classList.add('active');
    
    // Hide after delay
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}
