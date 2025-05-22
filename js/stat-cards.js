// Stat Cards Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts once user data is loaded
    document.addEventListener('userData:loaded', (event) => {
        const userData = event.detail;
        initializeStatCards(userData);
    });
    
    // Update audio features when a new track is played
    document.addEventListener('nowPlaying:updated', (event) => {
        if (event.detail && event.detail.trackId) {
            updateAudioFeatures(event.detail.trackId);
        }
    });
});

// Update audio features for currently playing track
async function updateAudioFeatures(trackId) {
    try {
        const audioFeaturesData = await fetchAudioFeatures([trackId]);
        if (audioFeaturesData && audioFeaturesData.audio_features && audioFeaturesData.audio_features[0]) {
            const features = audioFeaturesData.audio_features[0];
            createAudioFeatures(features);
            createAudioAnalysis(features);
        }
    } catch (error) {
        console.error('Error updating audio features for current track:', error);
    }
}

// Get access token from localStorage
function getAccessToken() {
    return localStorage.getItem('spotify_access_token');
}

// Fetch audio features for tracks
async function fetchAudioFeatures(trackIds) {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) return null;
        
        const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        }
        
        console.error('Error fetching audio features:', response.status);
        return null;
    } catch (error) {
        console.error('Exception fetching audio features:', error);
        return null;
    }
}

// Fetch genre data from user's top artists
async function fetchGenreData() {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) return null;
        
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return processGenreData(data.items);
        }
        
        console.error('Error fetching genre data:', response.status);
        return null;
    } catch (error) {
        console.error('Exception fetching genre data:', error);
        return null;
    }
}

// Process genre data from artists
function processGenreData(artists) {
    // Count genres
    const genreCounts = {};
    artists.forEach(artist => {
        artist.genres.forEach(genre => {
            if (genreCounts[genre]) {
                genreCounts[genre]++;
            } else {
                genreCounts[genre] = 1;
            }
        });
    });
    
    // Sort and process
    const sortedGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // Top 6 genres
    
    const total = sortedGenres.reduce((sum, item) => sum + item[1], 0);
    
    // Create color palette
    const colors = [
        '#1DB954', // Spotify green
        '#1E88E5', // Blue
        '#E53935', // Red
        '#FFC107', // Amber
        '#9C27B0', // Purple
        '#607D8B'  // Blue grey for "Other"
    ];
    
    // Format data
    const genreData = sortedGenres.map((item, index) => {
        return {
            genre: item[0].charAt(0).toUpperCase() + item[0].slice(1), // Capitalize
            percentage: Math.round((item[1] / total) * 100),
            color: colors[index]
        };
    });
    
    return genreData;
}

// Fetch device usage data
async function fetchDeviceData() {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) return null;
        
        // Get available devices
        const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return processDeviceData(data.devices);
        }
        
        // Fall back to mock data if API fails
        console.warn('Device API returned:', response.status);
        return getMockDeviceData();
    } catch (error) {
        console.error('Exception fetching device data:', error);
        return getMockDeviceData();
    }
}

// Process device data
function processDeviceData(devices) {
    if (!devices || devices.length === 0) {
        return getMockDeviceData();
    }
    
    // For actual implementation, we'd need more historical data
    // For now, we'll use the available devices with mock percentages
    
    const deviceIcons = {
        'Computer': 'fa-desktop',
        'Smartphone': 'fa-mobile-alt',
        'Speaker': 'fa-volume-up',
        'TV': 'fa-tv',
        'Unknown': 'fa-question-circle'
    };
    
    const mockPercentages = [45, 30, 15, 10];
    
    return devices.slice(0, 4).map((device, index) => {
        let type = 'Unknown';
        
        // Determine device type from Spotify device data
        if (device.type === 'Computer') type = 'Computer';
        else if (device.type === 'Smartphone') type = 'Smartphone';
        else if (device.type === 'Speaker') type = 'Speaker';
        else if (device.type.includes('TV')) type = 'TV';
        
        return {
            name: device.name,
            type: type,
            percentage: mockPercentages[index] || 5,
            icon: deviceIcons[type]
        };
    });
}

// Mock device data as fallback
function getMockDeviceData() {
    return [
        { name: 'Smartphone', type: 'Smartphone', percentage: 45, icon: 'fa-mobile-alt' },
        { name: 'Desktop App', type: 'Computer', percentage: 30, icon: 'fa-desktop' },
        { name: 'Web Player', type: 'Computer', percentage: 15, icon: 'fa-globe' },
        { name: 'Smart Speaker', type: 'Speaker', percentage: 10, icon: 'fa-volume-up' }
    ];
}

// Get recommendations based on top tracks
async function fetchRecommendations(userData) {
    try {
        const accessToken = getAccessToken();
        if (!accessToken) return null;
        
        // Get seed tracks from user's top tracks
        const seedTracks = userData.topTracks.items.slice(0, 5).map(track => track.id);
        
        if (seedTracks.length === 0) {
            return getMockRecommendations();
        }
        
        const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracks.join(',')}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return processRecommendations(data.tracks);
        }
        
        console.error('Error fetching recommendations:', response.status);
        return getMockRecommendations();
    } catch (error) {
        console.error('Exception fetching recommendations:', error);
        return getMockRecommendations();
    }
}

// Process recommendations data
function processRecommendations(tracks) {
    // Group tracks into "playlists" by audio features (simplified for demo)
    const playlists = [
        { name: 'Chill Mix', tracks: [], cover: '' },
        { name: 'Workout Beats', tracks: [], cover: '' },
        { name: 'Focus Flow', tracks: [], cover: '' },
        { name: 'Throwbacks', tracks: [], cover: '' },
        { name: 'New Discoveries', tracks: [], cover: '' }
    ];
    
    // Distribute tracks among playlists (simplified algorithm)
    tracks.forEach((track, index) => {
        const playlistIndex = index % playlists.length;
        playlists[playlistIndex].tracks.push(track);
        
        // Use the first track's album art as the playlist cover
        if (!playlists[playlistIndex].cover && track.album && track.album.images && track.album.images[0]) {
            playlists[playlistIndex].cover = track.album.images[0].url;
        }
    });
    
    // Format for display
    return playlists.map(playlist => {
        return {
            name: playlist.name,
            tracks: playlist.tracks.length,
            cover: playlist.cover || 'https://via.placeholder.com/150?text=' + encodeURIComponent(playlist.name)
        };
    });
}

// Mock recommendations as fallback
function getMockRecommendations() {
    return [
        { name: 'Chill Mix', tracks: 25, cover: 'https://via.placeholder.com/150?text=Chill+Mix' },
        { name: 'Workout Beats', tracks: 20, cover: 'https://via.placeholder.com/150?text=Workout' },
        { name: 'Focus Flow', tracks: 18, cover: 'https://via.placeholder.com/150?text=Focus' },
        { name: 'Throwbacks', tracks: 30, cover: 'https://via.placeholder.com/150?text=Throwbacks' },
        { name: 'New Discoveries', tracks: 22, cover: 'https://via.placeholder.com/150?text=New+Finds' }
    ];
}

async function initializeStatCards(userData) {
    // Get track IDs from user's top tracks for audio features
    let trackIds = [];
    if (userData && userData.topTracks && userData.topTracks.items) {
        trackIds = userData.topTracks.items.slice(0, 10).map(track => track.id);
    }
    
    try {
        // Fetch real data in parallel
        const [audioFeaturesData, genreData, deviceData, recommendations] = await Promise.all([
            fetchAudioFeatures(trackIds).catch(() => null),
            fetchGenreData().catch(() => null),
            fetchDeviceData().catch(() => null),
            fetchRecommendations(userData).catch(() => null)
        ]);
        
        // Process audio features (or use fallback)
        let audioFeatures;
        if (audioFeaturesData && audioFeaturesData.audio_features && audioFeaturesData.audio_features.length > 0) {
            // Calculate average audio features across tracks
            const features = audioFeaturesData.audio_features.filter(item => item !== null);
            if (features.length > 0) {
                audioFeatures = {
                    energy: features.reduce((sum, item) => sum + item.energy, 0) / features.length,
                    danceability: features.reduce((sum, item) => sum + item.danceability, 0) / features.length,
                    valence: features.reduce((sum, item) => sum + item.valence, 0) / features.length,
                    tempo: features.reduce((sum, item) => sum + item.tempo, 0) / features.length,
                    acousticness: features.reduce((sum, item) => sum + item.acousticness, 0) / features.length,
                    instrumentalness: features.reduce((sum, item) => sum + item.instrumentalness, 0) / features.length,
                    speechiness: features.reduce((sum, item) => sum + item.speechiness, 0) / features.length,
                    liveness: features.reduce((sum, item) => sum + item.liveness, 0) / features.length
                };
            }
        }
        
        // Use fallback if data is missing
        if (!audioFeatures) {
            audioFeatures = {
                energy: 0.75,
                danceability: 0.68,
                valence: 0.52,
                tempo: 120,
                acousticness: 0.15,
                instrumentalness: 0.05,
                speechiness: 0.08,
                liveness: 0.12
            };
        }
        
        // Use fallback data if API calls failed
        const finalGenreData = genreData || [
            { genre: 'Pop', percentage: 35, color: '#1DB954' },
            { genre: 'Rock', percentage: 25, color: '#1E88E5' },
            { genre: 'Hip-Hop', percentage: 15, color: '#E53935' },
            { genre: 'Electronic', percentage: 12, color: '#FFC107' },
            { genre: 'R&B', percentage: 8, color: '#9C27B0' },
            { genre: 'Other', percentage: 5, color: '#607D8B' }
        ];
        
        const finalDeviceData = deviceData || [
            { name: 'Smartphone', percentage: 45, icon: 'fa-mobile-alt' },
            { name: 'Desktop App', percentage: 30, icon: 'fa-desktop' },
            { name: 'Web Player', percentage: 15, icon: 'fa-globe' },
            { name: 'Smart Speaker', percentage: 10, icon: 'fa-volume-up' }
        ];
        
        const finalRecommendations = recommendations || [
            { name: 'Chill Mix', tracks: 25, cover: 'https://via.placeholder.com/150?text=Chill+Mix' },
            { name: 'Workout Beats', tracks: 20, cover: 'https://via.placeholder.com/150?text=Workout' },
            { name: 'Focus Flow', tracks: 18, cover: 'https://via.placeholder.com/150?text=Focus' },
            { name: 'Throwbacks', tracks: 30, cover: 'https://via.placeholder.com/150?text=Throwbacks' },
            { name: 'New Discoveries', tracks: 22, cover: 'https://via.placeholder.com/150?text=New+Finds' }
        ];
        
        // Initialize each component with real or fallback data
        createAudioFeatures(audioFeatures);
        createAudioAnalysis(audioFeatures);
        createGenreChart(finalGenreData);
        createDeviceUsage(finalDeviceData);
        createRecommendations(finalRecommendations);
    } catch (error) {
        console.error('Error initializing stat cards:', error);
        
        // Use fallback data if all else fails
        const audioFeatures = {
            energy: 0.75,
            danceability: 0.68,
            valence: 0.52,
            tempo: 120,
            acousticness: 0.15,
            instrumentalness: 0.05,
            speechiness: 0.08,
            liveness: 0.12
        };
        
        const genreData = [
            { genre: 'Pop', percentage: 35, color: '#1DB954' },
            { genre: 'Rock', percentage: 25, color: '#1E88E5' },
            { genre: 'Hip-Hop', percentage: 15, color: '#E53935' },
            { genre: 'Electronic', percentage: 12, color: '#FFC107' },
            { genre: 'R&B', percentage: 8, color: '#9C27B0' },
            { genre: 'Other', percentage: 5, color: '#607D8B' }
        ];
        
        const deviceData = [
            { name: 'Smartphone', percentage: 45, icon: 'fa-mobile-alt' },
            { name: 'Desktop App', percentage: 30, icon: 'fa-desktop' },
            { name: 'Web Player', percentage: 15, icon: 'fa-globe' },
            { name: 'Smart Speaker', percentage: 10, icon: 'fa-volume-up' }
        ];
        
        const recommendations = [
            { name: 'Chill Mix', tracks: 25, cover: 'https://via.placeholder.com/150?text=Chill+Mix' },
            { name: 'Workout Beats', tracks: 20, cover: 'https://via.placeholder.com/150?text=Workout' },
            { name: 'Focus Flow', tracks: 18, cover: 'https://via.placeholder.com/150?text=Focus' },
            { name: 'Throwbacks', tracks: 30, cover: 'https://via.placeholder.com/150?text=Throwbacks' },
            { name: 'New Discoveries', tracks: 22, cover: 'https://via.placeholder.com/150?text=New+Finds' }
        ];
        
        // Initialize each component with fallback data
        createAudioFeatures(audioFeatures);
        createAudioAnalysis(audioFeatures);
        createGenreChart(genreData);
        createDeviceUsage(deviceData);
        createRecommendations(recommendations);
    }
}

function createAudioFeatures(features) {
    const container = document.getElementById('audio-features-card');
    if (!container) return;
    
    // Create feature bars with clearer display
    const featuresHTML = `
        <h3>Music Attributes</h3>
        <div class="audio-feature-stats">
            <div class="audio-feature-row">
                <div class="feature-metric">
                    <span class="metric-label">Energy</span>
                    <span class="metric-value">${Math.round(features.energy * 100)}%</span>
                    <div class="feature-bar-container">
                        <div class="feature-bar energy-bar" style="width: ${features.energy * 100}%"></div>
                    </div>
                </div>
                
                <div class="feature-metric">
                    <span class="metric-label">Danceability</span>
                    <span class="metric-value">${Math.round(features.danceability * 100)}%</span>
                    <div class="feature-bar-container">
                        <div class="feature-bar danceability-bar" style="width: ${features.danceability * 100}%"></div>
                    </div>
                </div>
                
                <div class="feature-metric">
                    <span class="metric-label">Mood</span>
                    <span class="metric-value">${Math.round(features.valence * 100)}%</span>
                    <div class="feature-bar-container">
                        <div class="feature-bar valence-bar" style="width: ${features.valence * 100}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="feature-explanation">
                <p>Energy: How intense and active the music feels</p>
                <p>Danceability: How suitable the music is for dancing</p>
                <p>Mood: How positive and happy the music sounds</p>
            </div>
        </div>
          <h3>Music Mood Analysis</h3>
        <div class="mood-wheel-container">
            <p class="mood-wheel-title">Your Musical DNA</p>
            <div class="mood-wheel">
                <canvas id="moodWheel"></canvas>
            </div>
            <div class="mood-wheel-legend">
                <span>Higher values indicate stronger presence of each attribute in your music</span>
                <div class="mood-indicators">
                    <div class="mood-indicator">
                        <span class="indicator-dot energy-dot"></span>
                        <span>Energy: Intensity and activity level</span>
                    </div>
                    <div class="mood-indicator">
                        <span class="indicator-dot dance-dot"></span>
                        <span>Danceability: Rhythm and beat strength</span>
                    </div>
                    <div class="mood-indicator">
                        <span class="indicator-dot positive-dot"></span>
                        <span>Positivity: Happiness and cheerfulness</span>
                    </div>
                    <div class="mood-indicator">
                        <span class="indicator-dot acoustic-dot"></span>
                        <span>Acousticness: Natural instruments vs electronic</span>
                    </div>
                    <div class="mood-indicator">
                        <span class="indicator-dot live-dot"></span>
                        <span>Live Feel: Presence of audience and live performance elements</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = featuresHTML;
    
    // Create an enhanced, more visible mood wheel chart
    const ctx = document.getElementById('moodWheel').getContext('2d');
      // Define a more vibrant gradient for better visibility
    const createGradient = (ctx) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(29, 185, 84, 0.9)'); // Spotify green (more opaque)
        gradient.addColorStop(0.5, 'rgba(0, 229, 233, 0.8)'); // Cyan blue (more opaque)
        gradient.addColorStop(1, 'rgba(142, 45, 226, 0.7)'); // Purple (adding a third color)
        return gradient;
    };
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Energy', 
                'Danceability', 
                'Positivity', 
                'Acousticness', 
                'Live Feel'
            ],
            datasets: [{
                label: 'Your Music Profile',
                data: [
                    features.energy * 100, 
                    features.danceability * 100, 
                    features.valence * 100, 
                    features.acousticness * 100, 
                    features.liveness * 100
                ],                backgroundColor: createGradient(ctx),
                borderColor: '#00e5e9',
                borderWidth: 4,                pointBackgroundColor: '#00e5e9',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#1DB954',
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBorderWidth: 2,
                pointStyle: 'rectRounded'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 16,
                            weight: 'bold',
                            family: "'Sansation', sans-serif"
                        },
                        padding: 20,
                        boxWidth: 15,
                        boxHeight: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: {
                        size: 16,
                        weight: 'bold',
                        family: "'Sansation', sans-serif"
                    },
                    bodyFont: {
                        size: 14,
                        family: "'Sansation', sans-serif"
                    },
                    padding: 15,
                    cornerRadius: 8,
                    displayColors: true,
                    borderColor: 'rgba(0, 229, 233, 0.5)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}%`;
                        },
                        afterLabel: function(context) {
                            const label = context.label;
                            let explanation = '';
                            
                            switch(label) {
                                case 'Energy':
                                    explanation = 'How intense and powerful the track feels';
                                    break;
                                case 'Danceability':
                                    explanation = 'How suitable the track is for dancing';
                                    break;
                                case 'Positivity':
                                    explanation = 'How happy or cheerful the music sounds';
                                    break;
                                case 'Acousticness':
                                    explanation = 'How acoustic (vs. electronic) the track is';
                                    break;
                                case 'Live Feel':
                                    explanation = 'Presence of audience sounds/live performance elements';
                                    break;
                            }
                            
                            return explanation;
                        }
                    }
                }
            },
            scales: {
                r: {                    angleLines: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.5)',
                        lineWidth: 2.5
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        circular: true,
                        lineWidth: 2
                    },                    pointLabels: {
                        color: '#00e5e9',
                        font: {
                            size: 18,
                            weight: 'bold',
                            family: "'Sansation', sans-serif"
                        },
                        padding: 35,
                        backdropColor: 'rgba(0, 0, 0, 0.6)',
                        backdropPadding: 5,
                        borderRadius: 5
                    },
                    ticks: {
                        backdropColor: 'transparent',
                        color: '#fff',
                        z: 1,
                        stepSize: 20,
                        font: {
                            size: 14,
                            weight: 'normal',
                            family: "'Sansation', sans-serif"
                        },
                        count: 5,
                        showLabelBackdrop: false,
                        backdropPadding: 5
                    },
                    min: 0,
                    max: 100,
                    beginAtZero: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }
            },            elements: {
                line: {
                    borderJoinStyle: 'round'
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart',
                delay: (context) => {
                    return context.dataIndex * 100;
                }
            },
            transitions: {
                active: {
                    animation: {
                        duration: 1000
                    }
                }
            }
        }
    });
}

function createAudioAnalysis(audioFeatures) {
    const container = document.getElementById('audio-analysis-card');
    if (!container) return;
    
    // Create visualization components with better headers
    container.innerHTML = `
        <h3>Waveform Visualization</h3>
        <div class="waveform-visualizer">
            <canvas id="waveformCanvas"></canvas>
        </div>
        
        <h3>Beat Breakdown</h3>
        <div class="beat-breakdown">
            <canvas id="beatBreakdown"></canvas>
        </div>
    `;
    
    // Create additional info panels showing tempo, time signature, etc
    const infoSection = document.createElement('div');
    infoSection.className = 'audio-analysis-info';
    infoSection.innerHTML = `
        <h3>Technical Details</h3>
        <div class="audio-info-grid">
            <div class="audio-info-item">
                <span class="audio-info-label">Tempo</span>
                <span class="audio-info-value">${Math.round(audioFeatures.tempo)} BPM</span>
            </div>
            <div class="audio-info-item">
                <span class="audio-info-label">Acousticness</span>
                <span class="audio-info-value">${Math.round(audioFeatures.acousticness * 100)}%</span>
            </div>
            <div class="audio-info-item">
                <span class="audio-info-label">Instrumentalness</span>
                <span class="audio-info-value">${Math.round(audioFeatures.instrumentalness * 100)}%</span>
            </div>
            <div class="audio-info-item">
                <span class="audio-info-label">Speechiness</span>
                <span class="audio-info-value">${Math.round(audioFeatures.speechiness * 100)}%</span>
            </div>
        </div>
    `;
    container.appendChild(infoSection);
    
    // Generate waveform data - simulated but influenced by audio features
    // In a real implementation, this would use actual track audio analysis
    const waveformInfluence = audioFeatures.energy * 0.6 + audioFeatures.danceability * 0.4;
    const waveformData = generateWaveformData(100, waveformInfluence);
    
    // Waveform visualization
    const waveformCtx = document.getElementById('waveformCanvas').getContext('2d');
    new Chart(waveformCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 100}, (_, i) => i),
            datasets: [{
                data: waveformData,
                backgroundColor: 'rgba(0, 229, 233, 0.2)',
                borderColor: 'rgba(0, 229, 233, 1)',
                borderWidth: 1,
                tension: 0.3,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Waveform Visualizer',
                    color: '#fff'
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false,
                    min: 0,
                    max: 1
                }
            }
        }
    });
    
    // Beat breakdown - simulated but influenced by audio features
    const beatInfluence = audioFeatures.energy * 0.5 + audioFeatures.danceability * 0.5;
    const beatData = generateBeatData(40, beatInfluence);
    
    const beatCtx = document.getElementById('beatBreakdown').getContext('2d');
    new Chart(beatCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 40}, (_, i) => i),
            datasets: [{
                data: beatData,
                backgroundColor: (ctx) => {
                    const value = ctx.raw;
                    return value > 0.7 ? 'rgba(255, 94, 98, 1)' : 
                           value > 0.4 ? 'rgba(255, 187, 0, 1)' : 
                           'rgba(29, 185, 84, 1)';
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Beat Breakdown',
                    color: '#fff'
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false,
                    min: 0,
                    max: 1
                }
            }
        }
    });
}

// Generate waveform data based on audio features
function generateWaveformData(length, influence) {
    // Generate a more dynamic waveform based on influence level
    // Higher influence = more variation and amplitude
    const baseAmplitude = 0.3 + (influence * 0.5);
    const variability = 0.1 + (influence * 0.4);
    
    // Create a smooth, varied waveform with some randomness
    let data = [];
    let phase = Math.random() * Math.PI * 2;
    let value = 0.5;
    
    for (let i = 0; i < length; i++) {
        // Add a smooth transition using a sine wave plus some noise
        value = 0.5 + (baseAmplitude * Math.sin(i/10 + phase)) + (Math.random() * variability - variability/2);
        // Keep within bounds
        value = Math.max(0.1, Math.min(0.9, value));
        data.push(value);
    }
    
    return data;
}

// Generate beat data based on audio features
function generateBeatData(length, influence) {
    // Higher influence = more varied and intense beats
    const baseValue = 0.2 + (influence * 0.2);
    const peakChance = 0.2 + (influence * 0.4);
    const peakIntensity = 0.5 + (influence * 0.5);
    
    let data = [];
    
    for (let i = 0; i < length; i++) {
        // Determine if this is a peak beat
        const isPeak = Math.random() < peakChance;
        
        if (isPeak) {
            // Create a peak
            data.push(baseValue + Math.random() * peakIntensity);
        } else {
            // Create a baseline beat
            data.push(baseValue + Math.random() * 0.1);
        }
    }
    
    return data;
}

function createGenreChart(genreData) {
    const container = document.getElementById('genre-trends-card');
    if (!container) return;
    
    // Create donut chart and legend
    const legendHTML = genreData.map(item => `
        <div class="genre-item">
            <div class="genre-color" style="background-color: ${item.color}"></div>
            <span>${item.genre} (${item.percentage}%)</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <h3>Your Genre Distribution</h3>
        <div class="genre-donut-container">
            <canvas id="genreDonut" height="250"></canvas>
            <div class="genre-legend">
                ${legendHTML}
            </div>
        </div>
        
        <h3>Genre Trends Over Time</h3>
        <div class="chart-container">
            <canvas id="genreTrends"></canvas>
        </div>
    `;
    
    // Create donut chart
    const donutCtx = document.getElementById('genreDonut').getContext('2d');
    new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: genreData.map(item => item.genre),
            datasets: [{
                data: genreData.map(item => item.percentage),
                backgroundColor: genreData.map(item => item.color),
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Your Genre Mix',
                    color: '#fff',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    // Create trends chart
    const trendsCtx = document.getElementById('genreTrends').getContext('2d');
    
    // Mock data for 6 months of genre trends
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    const trendDatasets = genreData.map(genre => {
        return {
            label: genre.genre,
            data: Array.from({length: 6}, () => Math.floor(Math.random() * 40) + 10),
            borderColor: genre.color,
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2
        };
    });
    
    new Chart(trendsCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: trendDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Genre Trends Over Time',
                    color: '#fff'
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff',
                        boxWidth: 12
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function createDeviceUsage(deviceData) {
    const container = document.getElementById('devices-context-card');
    if (!container) return;
    
    // Create device usage display with better formatting
    const devicesHTML = deviceData.map(device => `
        <div class="device-item">
            <i class="fas ${device.icon} device-icon"></i>
            <span>${device.name} (${device.percentage}%)</span>
        </div>
    `).join('');
    
    container.innerHTML = `
        <h3>Where You Listen Most</h3>
        <div class="chart-container">
            <canvas id="devicePie"></canvas>
        </div>
        
        <h3>Your Devices</h3>
        <div class="devices-container">
            ${devicesHTML}
        </div>
        
        <div class="device-context-info">
            <p>This shows the devices you use most frequently to listen to your music.</p>
        </div>
    `;
    
    // Create pie chart for device usage
    const pieCtx = document.getElementById('devicePie').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: deviceData.map(item => item.name),
            datasets: [{
                data: deviceData.map(item => item.percentage),
                backgroundColor: [
                    'rgba(29, 185, 84, 0.8)',
                    'rgba(30, 136, 229, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(156, 39, 176, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#000'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#fff'
                    }
                },
                title: {
                    display: true,
                    text: 'Where You Listen Most',
                    color: '#fff',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

function createRecommendations(recommendations) {
    const container = document.getElementById('recommendations-card');
    if (!container) return;
    
    // Create recommendation playlist cards
    const playlistsHTML = recommendations.map(playlist => `
        <div class="playlist-item">
            <img src="${playlist.cover}" alt="${playlist.name}" class="playlist-cover">
            <div class="playlist-info">
                <p class="playlist-name">${playlist.name}</p>
                <p class="playlist-tracks">${playlist.tracks} tracks</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <h3>Recommended Playlists</h3>
        <p class="recommendation-intro">Based on your music taste, we think you might enjoy these playlists:</p>
        <div class="recommendation-container">
            ${playlistsHTML}
        </div>
        
        <div class="recommendation-tips">
            <p>Scroll horizontally to see all recommendations</p>
            <p>Auto-generated playlists are based on your listening habits and preferences</p>
        </div>
    `;
}
