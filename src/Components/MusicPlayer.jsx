import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaHeart, FaRedo, FaRandom, FaMinus, FaExpand } from "react-icons/fa";
import { BsVolumeUp, BsVolumeMute, BsMusicNoteList, BsPlus } from "react-icons/bs";
import { MdRepeatOne } from "react-icons/md";
import "./MusicPlayer.css";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const MusicPlayer = ({ selectedTrack, setSelectedTrack, albums = [] }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);
    const [isVolumeVisible, setIsVolumeVisible] = useState(false);
    const [favorites, setFavorites] = useState({
        liked: [],
        added: []
    });
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);
    const volumeControlRef = useRef(null);
    const volumeBarRef = useRef(null);
    const volumeBarFilledRef = useRef(null);
    const [currentAlbum, setCurrentAlbum] = useState(null);
    const [currentSongIndex, setCurrentSongIndex] = useState(null);
    const [repeat, setRepeat] = useState('off'); // 'off', 'track'
    const [shuffle, setShuffle] = useState(false); // New shuffle state
    const [isMinimized, setIsMinimized] = useState(false); // New minimize state
    const [isStateChanging, setIsStateChanging] = useState(false); // For visual feedback
    const [showDropdown, setShowDropdown] = useState(false); // Dropdown visibility
    const [showSpeedOptions, setShowSpeedOptions] = useState(false); // Speed options visibility
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Current playback speed
    const navigate = useNavigate(); // Get the navigate function

    useEffect(() => {
        if (selectedTrack && audioRef.current) {
            audioRef.current.src = selectedTrack.src;
            audioRef.current.currentTime = 0;
            audioRef.current.playbackRate = playbackSpeed; // Set playback speed
            audioRef.current.play().catch(error => console.error("Playback failed:", error));
            setIsPlaying(true);
            const album = albums.find(album => album.songs.some(song => song.src === selectedTrack.src));
            setCurrentAlbum(album);
            if (album) {
                const songIndex = album.songs.findIndex(song => song.src === selectedTrack.src);
                setCurrentSongIndex(songIndex);
            } else {
                setCurrentSongIndex(null);
            }
        }
    }, [selectedTrack]);

    // Separate useEffect for playback speed changes
    useEffect(() => {
        if (audioRef.current && selectedTrack) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    useEffect(() => {
        // Load favorites from localStorage with user-specific key
        const username = localStorage.getItem('username');
        if (username) {
            const storedFavorites = localStorage.getItem(`favorites_${username}`);
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
        }

        // Listen for favorites updates
        const handleFavoritesUpdate = (event) => {
            setFavorites(event.detail.favorites);
        };

        // Listen for song state changes
        const handleSongStateChange = (event) => {
            const { song, isPlaying: newIsPlaying } = event.detail;
            if (selectedTrack && selectedTrack.title === song.title) {
                setIsPlaying(newIsPlaying);
                if (newIsPlaying) {
                    audioRef.current.play().catch(error => console.error("Playback failed:", error));
                } else {
                    audioRef.current.pause();
                }
            }
        };

        window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
        window.addEventListener('songStateChanged', handleSongStateChange);

        return () => {
            window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
            window.removeEventListener('songStateChanged', handleSongStateChange);
        };
    }, [selectedTrack]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(error => console.error("Playback failed:", error));
        }
        setIsPlaying(!isPlaying);
        
        // Dispatch event to sync with Songs page (single source of truth: songStateChanged)
        if (selectedTrack) {
            const stateEvent = new CustomEvent('songStateChanged', {
                detail: {
                    song: selectedTrack,
                    isPlaying: !isPlaying
                }
            });
            window.dispatchEvent(stateEvent);
        }
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
    };

    const handleSeek = (e) => {
        if (!audioRef.current || !progressBarRef.current) return;
        const progressBar = progressBarRef.current;
        const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
        const progressBarWidth = progressBar.offsetWidth;
        const newTime = (clickPosition / progressBarWidth) * (audioRef.current.duration || 0);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeMouseDown = (e) => {
        setIsDraggingVolume(true);
        setIsVolumeVisible(true); // Keep it visible while dragging
        handleVolumeDrag(e); // Initial update
    };

    const handleVolumeMouseMove = (e) => {
        if (isDraggingVolume && volumeBarRef.current) {
            handleVolumeDrag(e);
        }
    };

    const handleVolumeMouseUp = () => {
        setIsDraggingVolume(false);
        setTimeout(() => {
            if (volumeControlRef.current && !volumeControlRef.current.matches(':hover')) {
                setIsVolumeVisible(false);
            }
        }, 100);
    };

    const handleVolumeDrag = (e) => {
        if (!volumeBarRef.current) return;
        const volumeBar = volumeBarRef.current;
        const clickPosition = e.clientX - volumeBar.getBoundingClientRect().left;
        const volumeBarWidth = volumeBar.offsetWidth;
        let newVolume = clickPosition / volumeBarWidth;
        newVolume = Math.max(0, Math.min(1, newVolume));

        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
        if (volumeBarFilledRef.current) {
            volumeBarFilledRef.current.style.width = `${newVolume * 100}%`;
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
        }
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) {
            return "0:00";
        }
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    const handleNextTrack = () => {
        if (currentAlbum && currentAlbum.songs) {
            if (shuffle) {
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * currentAlbum.songs.length);
                } while (newIndex === currentSongIndex && currentAlbum.songs.length > 1);
                setSelectedTrack(currentAlbum.songs[newIndex]);
                setCurrentSongIndex(newIndex);
            } else if (currentSongIndex !== null) {
                const nextIndex = (currentSongIndex + 1) % currentAlbum.songs.length;
                setSelectedTrack(currentAlbum.songs[nextIndex]);
                setCurrentSongIndex(nextIndex);
            }
        }
    };

    const handlePrevTrack = () => {
        if (currentAlbum && currentAlbum.songs) {
            if (shuffle) {
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * currentAlbum.songs.length);
                } while (newIndex === currentSongIndex && currentAlbum.songs.length > 1);
                setSelectedTrack(currentAlbum.songs[newIndex]);
                setCurrentSongIndex(newIndex);
            } else if (currentSongIndex !== null) {
                const prevIndex = (currentSongIndex - 1 + currentAlbum.songs.length) % currentAlbum.songs.length;
                setSelectedTrack(currentAlbum.songs[prevIndex]);
                setCurrentSongIndex(prevIndex);
            }
        }
    };

    const toggleRepeat = () => {
        setRepeat(prevRepeat => (prevRepeat === 'off' ? 'track' : 'off'));
    };

    const toggleShuffle = () => {
        setShuffle(!shuffle);
    };

    const showVolumeBar = () => {
        setIsVolumeVisible(true);
    };

    const hideVolumeBar = () => {
        if (!isDraggingVolume && volumeControlRef.current && !volumeControlRef.current.matches(':hover')) {
            setIsVolumeVisible(false);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingVolume && volumeBarRef.current) {
                handleVolumeDrag(e);
            }
        };

        if (isDraggingVolume) {
            document.addEventListener('mousemove', handleMouseMove);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
        }

        document.addEventListener('mouseup', handleVolumeMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleVolumeMouseUp);
        };
    }, [isDraggingVolume]);

    useEffect(() => {
        const handleSongEnd = () => {
            if (repeat === 'track') {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(error => console.error("Playback failed:", error));
            } else {
                handleNextTrack();
            }
        };

        if (audioRef.current) {
            audioRef.current.onended = handleSongEnd;
        }
    }, [audioRef, handleNextTrack, repeat, shuffle]);

    const handleManualNext = () => {
        if (repeat === 'track') {
            setRepeat('off'); // Temporarily turn off repeat one
            handleNextTrack();
            setRepeat('track'); // Turn it back on after going to the next
        } else {
            handleNextTrack();
        }
    };

    const handleLike = () => {
        if (!selectedTrack) return;
        const username = localStorage.getItem('username');
        if (!username) return;

        const songData = {
            ...selectedTrack,
            albumId: currentAlbum?.id,
            albumCover: currentAlbum?.img,
            artist: currentAlbum?.artist,
            addedAt: new Date().toISOString(),
            src: selectedTrack.src || selectedTrack.url // Ensure we have the audio source
        };

        const isLiked = favorites.liked.some(s => s.title === selectedTrack.title);
        let newFavorites;

        if (isLiked) {
            newFavorites = {
                ...favorites,
                liked: favorites.liked.filter(s => s.title !== selectedTrack.title)
            };
        } else {
            newFavorites = {
                ...favorites,
                liked: [...favorites.liked, songData]
            };
        }

        setFavorites(newFavorites);
        localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));
    };

    const handleAddToLibrary = () => {
        if (!selectedTrack) return;
        const username = localStorage.getItem('username');
        if (!username) return;

        const songData = {
            ...selectedTrack,
            albumId: currentAlbum?.id,
            albumCover: currentAlbum?.img,
            artist: currentAlbum?.artist,
            addedAt: new Date().toISOString(),
            src: selectedTrack.src || selectedTrack.url // Ensure we have the audio source
        };

        const isAdded = favorites.added.some(s => s.title === selectedTrack.title);
        let newFavorites;

        if (isAdded) {
            newFavorites = {
                ...favorites,
                added: favorites.added.filter(s => s.title !== selectedTrack.title)
            };
        } else {
            newFavorites = {
                ...favorites,
                added: [...favorites.added, songData]
            };
        }

        setFavorites(newFavorites);
        localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));
    };

    const isLiked = () => selectedTrack && favorites.liked.some(s => s.title === selectedTrack.title);
    const isAdded = () => selectedTrack && favorites.added.some(s => s.title === selectedTrack.title);

    // Custom click handler for artwork with visual feedback
    const handleArtworkClick = () => {
        if (!isMinimized) return;
        
        // Add visual feedback
        setIsStateChanging(true);
        
        // Toggle play/pause
        togglePlay();
        
        // Remove visual feedback after animation
        setTimeout(() => {
            setIsStateChanging(false);
        }, 500);
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
        setShowSpeedOptions(false);
    };

    // Toggle speed options
    const toggleSpeedOptions = () => {
        setShowSpeedOptions(!showSpeedOptions);
    };

    // Handle speed change
    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
        setShowSpeedOptions(false);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setShowDropdown(false);
                setShowSpeedOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <div className={`music-player ${isPlaying ? 'playing' : ''} ${isMinimized ? 'minimized' : ''} ${selectedTrack ? 'has-song' : ''}`}>
            <button 
                className="minimize-btn" 
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand player' : 'Minimize player'}
            >
                {isMinimized ? <FaExpand /> : <FaMinus />}
            </button>
            
            <div className="progress-bar-container" ref={progressBarRef} onClick={handleSeek}>
                <div className="progress-bar" style={{ width: `${(duration ? (currentTime / duration) : 0) * 100}%` }}></div>
            </div>

            <div className="player-content">
                <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} />

                {selectedTrack ? (
                    <div className="song-info">
                        <div 
                            className={`artwork-container ${isMinimized ? 'clickable-artwork' : ''} ${isStateChanging ? 'state-changing' : ''}`}
                            onClick={handleArtworkClick}
                            title={isMinimized ? (isPlaying ? 'Pause' : 'Play') : ''}
                        >
                            <img src={selectedTrack.img} alt={selectedTrack.title} className={`artwork ${isPlaying ? 'rotating' : ''}`} />
                            {isMinimized && (
                                <div className="play-pause-overlay">
                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4>{selectedTrack.title}</h4>
                            <p>{selectedTrack.artist}</p>
                        </div>
                        <div className="player-actions">
                            <FaHeart 
                                className={`like-btn-animated-pro ${isLiked() ? 'liked' : ''}`}
                                onClick={handleLike}
                            />
                            <BsPlus 
                                className={`add-btn-animated-pro ${isAdded() ? 'added' : ''}`}
                                onClick={handleAddToLibrary}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="empty-state">Select a song to play</p>
                )}

                <div className="controls">
                    <FaRandom
                        className={`icon shuffle-spin ${shuffle ? 'shuffle-active' : ''}`}
                        onClick={toggleShuffle}
                    />
                    <FaStepBackward className="icon skip-backward-forward" onClick={handlePrevTrack} />
                    {isPlaying ? (
                        <FaPause className="icon play-pause" onClick={togglePlay} />
                    ) : (
                        <FaPlay className="icon play-pause" onClick={togglePlay} />
                    )}
                    <FaStepForward className="icon skip-backward-forward" onClick={handleManualNext} />
                    <button className="icon-button" onClick={toggleRepeat}>
                        {repeat === 'track' ? <MdRepeatOne className="icon repeat-active repeat-bounce" /> : <FaRedo className="icon repeat-bounce" />}
                    </button>
                </div>

                <div className="progress-volume">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>

                    <div
                        className="volume-control"
                        onMouseEnter={showVolumeBar}
                        onMouseLeave={hideVolumeBar}
                        ref={volumeControlRef}
                    >
                        <div
                            className={`volume-bar ${isVolumeVisible ? 'visible' : ''}`}
                            ref={volumeBarRef}
                            onMouseDown={handleVolumeMouseDown}
                        >
                            <div
                                className="volume-bar-filled"
                                ref={volumeBarFilledRef}
                                style={{ width: `${volume * 100}%` }}
                            ></div>
                        </div>
                        {isMuted ? (
                            <BsVolumeMute className="icon volume-icon volume-pulse" onClick={toggleMute} />
                        ) : (
                            <BsVolumeUp className="icon volume-icon volume-pulse" onClick={toggleMute} />
                        )}
                    </div>

                    <div className="dropdown-container">
                        <BsMusicNoteList 
                            className={`icon playlist-fade ${showDropdown ? 'active' : ''}`} 
                            onClick={toggleDropdown}
                            title="Music Options"
                        />
                        
                        {showDropdown && (
                            <div className="music-dropdown">
                                <div className="dropdown-item" onClick={toggleSpeedOptions}>
                                    <span>Playback Speed</span>
                                    <span className="speed-value">{playbackSpeed}x</span>
                                    <span className="arrow">▶</span>
                                </div>
                                
                                {showSpeedOptions && (
                                    <div className="speed-dropdown">
                                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                                            <div 
                                                key={speed}
                                                className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                                                onClick={() => handleSpeedChange(speed)}
                                            >
                                                {speed}x
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="dropdown-item">
                                    <span>Crossfade</span>
                                    <input type="checkbox" />
                                </div>
                                
                                <div className="dropdown-item">
                                    <span>Gapless Playback</span>
                                    <input type="checkbox" defaultChecked />
                                </div>
                                
                                <div className="dropdown-item">
                                    <span>Auto-play Next</span>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MusicPlayer;