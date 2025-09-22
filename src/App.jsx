import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import SideBar from './Components/SideBar';
import Header from './Components/Header';
import MusicPlayer from './Components/MusicPlayer';
import Songs from './Songs';
import LoginPage from './LoginPage';
import Search from './Search';
import HomePage from './HomePage';
import LoginPopup from './Components/LoginPopup';
import Favorites from './Favorites';
import Library from './Library';
import Profile from './Profile';
import History from './History';
import Settings from './pages/Settings';

function App() {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [albums, setAlbums] = useState([]);
    const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
    const [albumsError, setAlbumsError] = useState(null);
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    useEffect(() => {
        const handleLogout = () => {
            setCurrentTrack(null);
        };

        // Listen for custom logout event
        window.addEventListener('userLogout', handleLogout);

        return () => {
            window.removeEventListener('userLogout', handleLogout);
        };
    }, []);

    useEffect(() => {
        const fetchAlbums = async () => {
            setIsLoadingAlbums(true);
            setAlbumsError(null);
            try {
                const response = await fetch('http://localhost:9090/justvibe-backend/albums');
                if (!response.ok) throw new Error(`Failed to load albums: ${response.status}`);
                const data = await response.json();
                setAlbums(Array.isArray(data) ? data : []);
            } catch (err) {
                setAlbumsError(err.message || 'Failed to load albums');
            } finally {
                setIsLoadingAlbums(false);
            }
        };
        fetchAlbums();
    }, []);

    const handleSetSelectedTrack = (track) => {
        const isLoggedIn = localStorage.getItem('username');
        if (!isLoggedIn) {
            setShowLoginPopup(true);
            return;
        }
        setCurrentTrack(track);

        // --- Add to history ---
        const username = localStorage.getItem('username');
        if (username && track) {
            const historyKey = `history_${username}`;
            const storedHistory = localStorage.getItem(historyKey);
            let history = storedHistory ? JSON.parse(storedHistory) : [];
            // Remove if already exists (by title & artist)
            history = history.filter(item => item.title !== track.title || item.artist !== track.artist);
            // Add to top with timestamp
            history.unshift({
                ...track,
                playedAt: new Date().toISOString()
            });
            // Limit to 100 entries
            if (history.length > 100) history = history.slice(0, 100);
            localStorage.setItem(historyKey, JSON.stringify(history));
            // Dispatch event for real-time update
            window.dispatchEvent(new CustomEvent('historyUpdated', { detail: { history } }));
        }
    };

    return (
        <Router basename="/justvibe">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/*"
                    element={
                        <div id="container">
                            <Header />
                            <main id="body">
                                <SideBar />
                                <div className="main-content">
                                    <Routes>
                                        <Route path="/" element={<HomePage albums={albums} isLoading={isLoadingAlbums} error={albumsError} setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/songs" element={<Songs albums={albums} setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/search" element={<Search albums={albums} setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/favorites" element={<Favorites setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/library" element={<Library setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/profile" element={<Profile setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/history" element={<History setSelectedTrack={handleSetSelectedTrack} />} />
                                        <Route path="/settings" element={<Settings />} />
                                    </Routes>
                                </div>
                            </main>
                            <div id="footer">
                                <MusicPlayer
                                    selectedTrack={currentTrack}
                                    albums={albums}
                                    setSelectedTrack={handleSetSelectedTrack}
                                />
                            </div>
                            <LoginPopup 
                                isOpen={showLoginPopup} 
                                onClose={() => setShowLoginPopup(false)} 
                            />
                        </div>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;