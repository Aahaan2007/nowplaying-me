# nowPlaying.me

> Your personal Spotify stats dashboard - like Spotify Wrapped, but available anytime.

[![Live Demo](https://img.shields.io/badge/LIVE-DEMO-brightgreen)](https://nowplaying-me.vercel.app/)
[![Spotify API](https://img.shields.io/badge/Spotify-API-1DB954)](https://developer.spotify.com/documentation/web-api/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🎵 Overview

nowPlaying.me is a web application that connects to your Spotify account and provides real-time insights about your music listening habits. Get instant access to your top artists, tracks, and current playback state - no need to wait for the yearly Wrapped!

![nowPlaying.me Screenshot](img/logoo.png)

## ✨ Features

- **Spotify Authentication** - Secure OAuth 2.0 flow for connecting your Spotify account
- **Currently Playing** - See what's currently playing on your Spotify account
- **Top Tracks** - Discover your most-played tracks over different time periods
- **Top Artists** - Explore your favorite artists based on listening history
- **Listening Stats** - Get insights about your music preferences and habits
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Live Demo

Check out the live application: [nowPlaying.me](https://nowplaying-me.vercel.app/)

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Authentication**: Spotify OAuth 2.0
- **API**: Spotify Web API
- **Visualization**: Custom CSS & Animation
- **Hosting**: Vercel

## 🔧 Setup and Installation

### Prerequisites
- A Spotify account
- A registered Spotify Developer application

### Local Development
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/nowplaying-me.git
   cd nowplaying-me
   ```

2. Update the Spotify API credentials in `js/spotify-auth.js` with your own credentials from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).

3. Serve the application locally using a simple HTTP server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

4. Open your browser and navigate to `http://localhost:8000`

## 📝 How It Works

1. The app authenticates with Spotify using the OAuth 2.0 authorization flow
2. After successful authentication, the app fetches data from various Spotify Web API endpoints
3. The retrieved data is presented in an intuitive and visually appealing dashboard

## 🔐 Privacy and Security

- The app only requests the necessary Spotify permissions (scopes)
- Authentication is handled securely using industry-standard protocols
- No user data is stored on our servers - everything is processed client-side

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Font Awesome](https://fontawesome.com/) for the icons
- [Vanta.js](https://www.vantajs.com/) for background animations
