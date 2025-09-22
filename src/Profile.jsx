import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEdit, FaCamera, FaMusic, FaHeart, FaHistory, FaCog, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaRandom, FaRedo, FaStepBackward, FaStepForward, FaSave, FaTimes, FaMapMarkerAlt, FaUserCircle, FaBell, FaPalette, FaGlobe, FaSpotify, FaInstagram, FaTwitter, FaHome, FaTrophy } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Profile.css';

const Profile = ({ setSelectedTrack }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        username: localStorage.getItem('username') || '',
        email: '',
        profilePicture: null,
        stats: {
            playlists: 0,
            favorites: 0,
            hoursPlayed: 0,
            minutesPlayed: 0,
            followers: 0,
            following: 0,
            totalPlays: 0
        },
        topArtists: [],
        topGenres: [],
        recentlyPlayed: [],
        location: '',
        bio: '',
        socialLinks: {
            spotify: '',
            instagram: '',
            twitter: ''
        },
        preferences: {
            theme: 'dark',
            notifications: true,
            privacy: 'public',
            language: 'en'
        }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        bio: '',
        location: '',
        socialLinks: {
            spotify: '',
            instagram: '',
            twitter: ''
        },
        preferences: {
            theme: 'dark',
            notifications: true,
            privacy: 'public',
            language: 'en'
        }
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [recentActivity, setRecentActivity] = useState([]);
    const [favoriteSongs, setFavoriteSongs] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [achievements, setAchievements] = useState([
        { id: 1, title: 'Music Explorer', description: 'Listened to 100 different songs', icon: '🎵', unlocked: true },
        { id: 2, title: 'Playlist Creator', description: 'Created 5 playlists', icon: '📝', unlocked: true },
        { id: 3, title: 'Social Butterfly', description: 'Followed 10 artists', icon: '🦋', unlocked: false },
        { id: 4, title: 'Night Owl', description: 'Listened to music for 24 hours', icon: '🦉', unlocked: false }
    ]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://localhost:8080/justvibe-backend/users/profile/${user.username}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(prev => ({ ...prev, ...data }));
                    setEditForm(prev => ({
                        ...prev,
                        username: data.username,
                        email: data.email,
                        bio: data.bio || '',
                        location: data.location || '',
                        socialLinks: data.socialLinks || {
                            spotify: '',
                            instagram: '',
                            twitter: ''
                        },
                        preferences: data.preferences || {
                            theme: 'dark',
                            notifications: true,
                            privacy: 'public',
                            language: 'en'
                        }
                    }));
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        if (user.username) {
            fetchUserData();
        }
    }, [user.username]);

    // Add useEffect for loading favorite songs
    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            const storedFavorites = localStorage.getItem(`favorites_${username}`);
            if (storedFavorites) {
                const { liked } = JSON.parse(storedFavorites);
                setFavoriteSongs(liked);
                setUser(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        favorites: liked.length
                    }
                }));
            }
        }

        // Listen for favorites updates
        const handleFavoritesUpdate = (event) => {
            const { liked } = event.detail.favorites;
            setFavoriteSongs(liked);
            setUser(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    favorites: liked.length
                }
            }));
        };

        window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

        return () => {
            window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
        };
    }, []);

    // Add event listeners for MusicPlayer synchronization
    useEffect(() => {
        const handleSongStateChange = (event) => {
            const { song, isPlaying: newIsPlaying } = event.detail;
            if (song) {
                setCurrentSong(song);
                setIsPlaying(newIsPlaying);
            }
        };

        const handleTogglePlayPause = (event) => {
            const { song } = event.detail;
            if (song && currentSong && currentSong.title === song.title) {
                setIsPlaying(prev => !prev);
            }
        };

        window.addEventListener('songStateChanged', handleSongStateChange);
        window.addEventListener('togglePlayPause', handleTogglePlayPause);

        return () => {
            window.removeEventListener('songStateChanged', handleSongStateChange);
            window.removeEventListener('togglePlayPause', handleTogglePlayPause);
        };
    }, [currentSong, setIsPlaying]);

    // Add useEffect to load playlists from localStorage and update the playlists count in user.stats
    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            const storedPlaylists = localStorage.getItem(`playlists_${username}`);
            if (storedPlaylists) {
                const playlists = JSON.parse(storedPlaylists);
                setUser(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        playlists: playlists.length
                    }
                }));
            }
        }

        // Listen for playlists updates
        const handlePlaylistsUpdate = (event) => {
            const { playlists } = event.detail;
            setUser(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    playlists: playlists.length
                }
            }));
        };

        window.addEventListener('playlistsUpdated', handlePlaylistsUpdate);

        return () => {
            window.removeEventListener('playlistsUpdated', handlePlaylistsUpdate);
        };
    }, []);

    // Add useEffect to calculate total playtime
    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            const history = localStorage.getItem(`history_${username}`);
            if (history) {
                const historyData = JSON.parse(history);
                let totalSeconds = 0;
                
                // Calculate total seconds from history
                historyData.forEach(item => {
                    if (item.duration) {
                        totalSeconds += item.duration;
                    }
                });
                
                // Convert to hours and minutes
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                
                setUser(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        hoursPlayed: hours,
                        minutesPlayed: minutes
                    }
                }));
            }
        }

        // Listen for history updates
        const handleHistoryUpdate = () => {
            const username = localStorage.getItem('username');
            if (username) {
                const history = localStorage.getItem(`history_${username}`);
                if (history) {
                    const historyData = JSON.parse(history);
                    let totalSeconds = 0;
                    
                    historyData.forEach(item => {
                        if (item.duration) {
                            totalSeconds += item.duration;
                        }
                    });
                    
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    
                    setUser(prev => ({
                        ...prev,
                        stats: {
                            ...prev.stats,
                            hoursPlayed: hours,
                            minutesPlayed: minutes
                        }
                    }));
                }
            }
        };

        window.addEventListener('historyUpdated', handleHistoryUpdate);
        return () => window.removeEventListener('historyUpdated', handleHistoryUpdate);
    }, []);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            username: user.username,
            email: user.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            bio: '',
            location: '',
            socialLinks: {
                spotify: '',
                instagram: '',
                twitter: ''
            },
            preferences: {
                theme: 'dark',
                notifications: true,
                privacy: 'public',
                language: 'en'
            }
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setEditForm(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        // Only validate password if it's being changed
        if (editForm.newPassword) {
            if (editForm.newPassword !== editForm.confirmPassword) {
                alert('New passwords do not match!');
                return;
            }
            if (editForm.newPassword.length < 8) {
                alert('Password must be at least 8 characters long!');
                return;
            }
            if (!editForm.currentPassword) {
                alert('Please enter your current password to change it!');
                return;
            }
        }

        // Create an object with only the changed fields
        const updatedFields = {};
        
        // Only include fields that have changed from the original user data
        if (editForm.username !== user.username) updatedFields.username = editForm.username;
        if (editForm.email !== user.email) updatedFields.email = editForm.email;
        if (editForm.bio !== user.bio) updatedFields.bio = editForm.bio;
        if (editForm.location !== user.location) updatedFields.location = editForm.location;
        
        // Check social links changes
        const socialLinksChanged = Object.keys(editForm.socialLinks).some(
            key => editForm.socialLinks[key] !== user.socialLinks[key]
        );
        if (socialLinksChanged) updatedFields.socialLinks = editForm.socialLinks;
        
        // Check preferences changes
        const preferencesChanged = Object.keys(editForm.preferences).some(
            key => editForm.preferences[key] !== user.preferences[key]
        );
        if (preferencesChanged) updatedFields.preferences = editForm.preferences;
        
        // Add password fields only if they're being changed
        if (editForm.newPassword) {
            updatedFields.currentPassword = editForm.currentPassword;
            updatedFields.newPassword = editForm.newPassword;
        }

        // If no fields have changed, show message and return
        if (Object.keys(updatedFields).length === 0) {
            alert('No changes detected!');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/justvibe-backend/users/update/${user.username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedFields)
            });

            const data = await response.json();

            if (response.ok) {
                // Update the user state with the new data
                setUser(prev => ({
                    ...prev,
                    ...data,
                    // Preserve existing data for fields not returned by the server
                    stats: data.stats || prev.stats,
                    topArtists: data.topArtists || prev.topArtists,
                    topGenres: data.topGenres || prev.topGenres,
                    recentlyPlayed: data.recentlyPlayed || prev.recentlyPlayed
                }));
                
                // Update localStorage if username changed
                if (data.username && data.username !== user.username) {
                    localStorage.setItem('username', data.username);
                }
                
                setIsEditing(false);
                alert('Profile updated successfully!');
            } else {
                // Handle specific error messages from the server
                const errorMessage = data.message || data.error || 'Failed to update profile';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Network error. Please check your connection and try again.');
        }
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('profilePicture', file);

            try {
                const response = await fetch(`http://localhost:8080/justvibe-backend/users/profile-picture/${user.username}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
                }
            } catch (error) {
                console.error('Error uploading profile picture:', error);
            }
        }
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleAchievementClick = (achievement) => {
        // Show achievement details in a modal
        setShowAchievements(true);
    };

    return (
        <motion.div 
            className="profile-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="profile-header">
                <motion.div 
                    className="profile-cover"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="profile-info">
                        <motion.div 
                            className="profile-picture-container"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="Profile" className="profile-picture" />
                            ) : (
                                <div className="profile-picture-placeholder">
                                    <FaUser />
                                </div>
                            )}
                            <motion.label 
                                className="profile-picture-upload"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <FaCamera />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                    style={{ display: 'none' }}
                                />
                            </motion.label>
                        </motion.div>
                        <div className="profile-details">
                            <motion.h1 
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                {user.username}
                            </motion.h1>
                            <motion.p 
                                className="user-email"
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                {user.email}
                            </motion.p>
                            <motion.div 
                                className="profile-stats"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <div className="stat">
                                    <FaMusic />
                                    <span>{user.stats.playlists} Playlists</span>
                                </div>
                                <div className="stat">
                                    <FaHeart />
                                    <span>{user.stats.favorites} Favorites</span>
                                </div>
                                <div className="stat">
                                    <FaHistory />
                                    <span>{user.stats.hoursPlayed}hr {user.stats.minutesPlayed}min</span>
                                </div>
                                <div className="stat">
                                    <FaUser />
                                    <span>{user.stats.followers} Followers</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="profile-content">
                <motion.div 
                    className="profile-tabs"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <motion.button
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaHome /> Overview
                    </motion.button>
                    <motion.button
                        className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaHistory /> Recent Activity
                    </motion.button>
                    <motion.button
                        className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaHeart /> Favorites
                    </motion.button>
                    <motion.button
                        className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('achievements')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaTrophy /> Achievements
                    </motion.button>
                    <motion.button
                        className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FaUser /> User Info
                    </motion.button>
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeTab}
                        className="tab-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'overview' && (
                            <div className="overview-section">
                                <h2>Welcome back, {user.username}!</h2>
                                <div className="quick-stats">
                                    <motion.div 
                                        className="stat-card"
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FaMusic />
                                        <h3>Your Playlists</h3>
                                        <p>{user.stats.playlists} playlists created</p>
                                    </motion.div>
                                    <motion.div 
                                        className="stat-card"
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FaHeart />
                                        <h3>Favorites</h3>
                                        <p>{user.stats.favorites} songs liked</p>
                                    </motion.div>
                                    <motion.div 
                                        className="stat-card"
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FaHistory />
                                        <h3>Listening Time</h3>
                                        <p>{user.stats.hoursPlayed}hr {user.stats.minutesPlayed}min</p>
                                    </motion.div>
                                </div>

                                <div className="top-artists-section">
                                    <h3>Top Artists</h3>
                                    <div className="artists-grid">
                                        {user.topArtists.map((artist, index) => (
                                            <motion.div 
                                                key={index}
                                                className="artist-card"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <img src={artist.image} alt={artist.name} />
                                                <h4>{artist.name}</h4>
                                                <p>{artist.plays} plays</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="recently-played-section">
                                    <h3>Recently Played</h3>
                                    <div className="recent-tracks">
                                        {user.recentlyPlayed.map((track, index) => (
                                            <motion.div 
                                                key={index}
                                                className="track-item"
                                                whileHover={{ x: 10 }}
                                                onClick={() => setCurrentSong(track)}
                                            >
                                                <img src={track.cover} alt={track.title} />
                                                <div className="track-info">
                                                    <h4>{track.title}</h4>
                                                    <p>{track.artist}</p>
                                                </div>
                                                <button className="play-button">
                                                    <FaPlay />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'achievements' && (
                            <div className="achievements-section">
                                <h2>Your Achievements</h2>
                                <div className="achievements-grid">
                                    {achievements.map((achievement) => (
                                        <motion.div 
                                            key={achievement.id}
                                            className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAchievementClick(achievement)}
                                        >
                                            <div className="achievement-icon">{achievement.icon}</div>
                                            <h3>{achievement.title}</h3>
                                            <p>{achievement.description}</p>
                                            <div className="achievement-status">
                                                {achievement.unlocked ? 'Unlocked!' : 'Locked'}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="activity-section">
                                <h2>Recent Activity</h2>
                                <div className="activity-list">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="activity-item">
                                            <div className="activity-icon">
                                                {activity.type === 'play' && <FaMusic />}
                                                {activity.type === 'like' && <FaHeart />}
                                            </div>
                                            <div className="activity-details">
                                                <p>{activity.description}</p>
                                                <span className="activity-time">{activity.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <motion.div 
                                className="favorites-section"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="favorites-header">
                                    <motion.h2 
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        Your Favorite Collection
                                    </motion.h2>
                                </div>
                                <div className="favorites-grid">
                                    {favoriteSongs.slice(0, 15).map((song, index) => (
                                        <motion.div 
                                            key={index} 
                                            className="favorite-item"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ 
                                                duration: 0.4,
                                                delay: index * 0.1
                                            }}
                                            whileHover={{ 
                                                scale: 1.03,
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            <div className="song-shape">
                                                <img src={song.albumCover} alt={song.title} />
                                                <div className="song-overlay">
                                                    <div className="song-info">
                                                        <h3>{song.title}</h3>
                                                        <p>{song.artist}</p>
                                                    </div>
                                                    <motion.button 
                                                        className={`play-pause-btn ${currentSong && currentSong.title === song.title && isPlaying ? 'playing' : ''}`}
                                                        onClick={() => {
                                                            if (currentSong && currentSong.title === song.title) {
                                                                // Toggle play/pause for current song
                                                                const event = new CustomEvent('togglePlayPause', {
                                                                    detail: { song }
                                                                });
                                                                window.dispatchEvent(event);
                                                                // Also dispatch songStateChanged to ensure MusicPlayer is in sync
                                                                const stateEvent = new CustomEvent('songStateChanged', {
                                                                    detail: { 
                                                                        song,
                                                                        isPlaying: !isPlaying
                                                                    }
                                                                });
                                                                window.dispatchEvent(stateEvent);
                                                            } else {
                                                                // Play new song
                                                                setSelectedTrack(song);
                                                                setCurrentSong(song);
                                                                setIsPlaying(true);
                                                                // Dispatch songStateChanged for new song
                                                                const stateEvent = new CustomEvent('songStateChanged', {
                                                                    detail: { 
                                                                        song,
                                                                        isPlaying: true
                                                                    }
                                                                });
                                                                window.dispatchEvent(stateEvent);
                                                            }
                                                        }}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        {currentSong && currentSong.title === song.title && isPlaying ? <FaPause /> : <FaPlay />}
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                {favoriteSongs.length > 15 && (
                                    <motion.div 
                                        className="show-more-container"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.button
                                            className="show-more-btn"
                                            onClick={() => navigate('/favorites')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Show More ({favoriteSongs.length - 15} more songs)
                                        </motion.button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="settings-section">
                                <h2>Profile Settings</h2>
                                {isEditing ? (
                                    <form onSubmit={handleProfileUpdate} className="edit-form">
                                        <div className="form-section">
                                            <h3>Basic Information</h3>
                                            <div className="form-group">
                                                <label><FaUser /> Username</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={editForm.username}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaEnvelope /> Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={editForm.email}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaMapMarkerAlt /> Location</label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={editForm.location}
                                                    onChange={handleInputChange}
                                                    placeholder="Your location"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaUserCircle /> Bio</label>
                                                <textarea
                                                    name="bio"
                                                    value={editForm.bio}
                                                    onChange={handleInputChange}
                                                    placeholder="Tell us about yourself..."
                                                    rows="4"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h3>Social Links</h3>
                                            <div className="form-group">
                                                <label><FaSpotify /> Spotify</label>
                                                <input
                                                    type="url"
                                                    name="socialLinks.spotify"
                                                    value={editForm.socialLinks.spotify}
                                                    onChange={handleInputChange}
                                                    placeholder="Your Spotify profile URL"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaInstagram /> Instagram</label>
                                                <input
                                                    type="url"
                                                    name="socialLinks.instagram"
                                                    value={editForm.socialLinks.instagram}
                                                    onChange={handleInputChange}
                                                    placeholder="Your Instagram profile URL"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaTwitter /> Twitter</label>
                                                <input
                                                    type="url"
                                                    name="socialLinks.twitter"
                                                    value={editForm.socialLinks.twitter}
                                                    onChange={handleInputChange}
                                                    placeholder="Your Twitter profile URL"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h3>Preferences</h3>
                                            <div className="form-group">
                                                <label><FaPalette /> Theme</label>
                                                <select
                                                    name="preferences.theme"
                                                    value={editForm.preferences.theme}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="dark">Dark</option>
                                                    <option value="light">Light</option>
                                                    <option value="system">System</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label><FaBell /> Notifications</label>
                                                <div className="checkbox-group">
                                                    <input
                                                        type="checkbox"
                                                        name="preferences.notifications"
                                                        checked={editForm.preferences.notifications}
                                                        onChange={handleInputChange}
                                                    />
                                                    <span>Enable notifications</span>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label><FaLock /> Privacy</label>
                                                <select
                                                    name="preferences.privacy"
                                                    value={editForm.preferences.privacy}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="private">Private</option>
                                                    <option value="friends">Friends Only</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label><FaGlobe /> Language</label>
                                                <select
                                                    name="preferences.language"
                                                    value={editForm.preferences.language}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                    <option value="de">German</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h3>Change Password</h3>
                                            <div className="form-group">
                                                <label><FaLock /> Current Password</label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={editForm.currentPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaLock /> New Password</label>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={editForm.newPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter new password"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label><FaLock /> Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={editForm.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-buttons">
                                            <button type="submit" className="save-button">
                                                <FaSave /> Save Changes
                                            </button>
                                            <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                                                <FaTimes /> Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="profile-settings">
                                        <div className="settings-section">
                                            <h3>Basic Information</h3>
                                            <div className="setting-item">
                                                <FaUser />
                                                <div className="setting-info">
                                                    <h4>Username</h4>
                                                    <p>{user.username}</p>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <FaEnvelope />
                                                <div className="setting-info">
                                                    <h4>Email</h4>
                                                    <p>{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <FaMapMarkerAlt />
                                                <div className="setting-info">
                                                    <h4>Location</h4>
                                                    <p>{user.location || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <FaUserCircle />
                                                <div className="setting-info">
                                                    <h4>Bio</h4>
                                                    <p>{user.bio || 'No bio yet'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="settings-section">
                                            <h3>Social Links</h3>
                                            {user.socialLinks && (
                                                <>
                                                    {user.socialLinks.spotify && (
                                                        <div className="setting-item">
                                                            <FaSpotify />
                                                            <div className="setting-info">
                                                                <h4>Spotify</h4>
                                                                <a href={user.socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                                                                    {user.socialLinks.spotify}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {user.socialLinks.instagram && (
                                                        <div className="setting-item">
                                                            <FaInstagram />
                                                            <div className="setting-info">
                                                                <h4>Instagram</h4>
                                                                <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                                                    {user.socialLinks.instagram}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {user.socialLinks.twitter && (
                                                        <div className="setting-item">
                                                            <FaTwitter />
                                                            <div className="setting-info">
                                                                <h4>Twitter</h4>
                                                                <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                                                                    {user.socialLinks.twitter}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="settings-section">
                                            <h3>Preferences</h3>
                                            <div className="setting-item">
                                                <FaPalette />
                                                <div className="setting-info">
                                                    <h4>Theme</h4>
                                                    <p>{user.preferences?.theme || 'Dark'}</p>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <FaBell />
                                                <div className="setting-info">
                                                    <h4>Notifications</h4>
                                                    <p>{user.preferences?.notifications ? 'Enabled' : 'Disabled'}</p>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <FaLock />
                                                <div className="setting-info">
                                                    <h4>Privacy</h4>
                                                    <p>{user.preferences?.privacy || 'Public'}</p>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <FaGlobe />
                                                <div className="setting-info">
                                                    <h4>Language</h4>
                                                    <p>{user.preferences?.language || 'English'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="edit-button" onClick={handleEditClick}>
                                            <FaEdit /> Edit Profile
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Profile; 