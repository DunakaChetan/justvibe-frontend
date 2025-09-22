import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaDownload } from 'react-icons/fa';
import DownloadQualityModal from './Components/DownloadQualityModal';
import { audioProcessor } from './utils/audioProcessor';
import './Songs.css';

function Songs({ albums = [], setSelectedTrack, selectedTrack, isPlaying, setIsPlaying }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const albumId = queryParams.get('id');
  const audioRef = useRef(null);
  const [favorites, setFavorites] = useState({
    liked: [],
    added: []
  });

  const [currentSong, setCurrentSong] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSongForDownload, setSelectedSongForDownload] = useState(null);
  const [showAlbumDownloadModal, setShowAlbumDownloadModal] = useState(false);
  const [downloadType, setDownloadType] = useState('song'); // 'song' or 'album'

  // Add fallback for isPlaying and setIsPlaying if not provided as props
  const [localIsPlaying, localSetIsPlaying] = useState(false);
  const actualIsPlaying = typeof isPlaying === 'boolean' ? isPlaying : localIsPlaying;
  const actualSetIsPlaying = typeof setIsPlaying === 'function' ? setIsPlaying : localSetIsPlaying;

  useEffect(() => {
    // Load favorites from localStorage
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

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  useEffect(() => {
    console.log('Songs component rendered');
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', () => {
        actualSetIsPlaying(false);
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => {
          actualSetIsPlaying(false);
        });
      }
    };
  }, []);

  // Listen for global song state changes
  useEffect(() => {
    const handleSongStateChange = (event) => {
      const { song, isPlaying: newIsPlaying } = event.detail;
      if (song) {
        setCurrentSong(song);
        actualSetIsPlaying(newIsPlaying);
      }
    };

    window.addEventListener('songStateChanged', handleSongStateChange);

    return () => {
      window.removeEventListener('songStateChanged', handleSongStateChange);
    };
  }, [actualSetIsPlaying]);

  const album = albums.find((album) => album.id === albumId);

  if (!album) {
    return <h2 className="not-found">Album not found</h2>;
  }

  // Removed togglePlayPause event to avoid recursion; rely solely on songStateChanged

  // Play/pause logic
  const handlePlay = (song) => {
    const songSrc = song.src || song.url;
    if (currentSong && currentSong.src === songSrc) {
      // Toggle play/pause for current song via songStateChanged only
      const stateEvent = new CustomEvent('songStateChanged', {
        detail: {
          song: { ...song, src: songSrc },
          isPlaying: !actualIsPlaying
        }
      });
      window.dispatchEvent(stateEvent);
      actualSetIsPlaying(!actualIsPlaying);
    } else {
      // Play new song
      setSelectedTrack({ ...song, src: songSrc });
      setCurrentSong({ ...song, src: songSrc });
      actualSetIsPlaying(true);
      // Dispatch songStateChanged for new song
      const stateEvent = new CustomEvent('songStateChanged', {
        detail: {
          song: { ...song, src: songSrc },
          isPlaying: true
        }
      });
      window.dispatchEvent(stateEvent);
    }
  };

  const handleDownloadClick = (song) => {
    setSelectedSongForDownload(song);
    setDownloadType('song');
    setShowDownloadModal(true);
  };

  const handleDownload = async (song, quality = 'high') => {
    try {
      console.log(`Starting download of ${song.title} in ${quality} quality...`);
      console.log(`Audio source: ${song.src}`);
      
      // Fetch the original audio file from Azure
      const response = await fetch(song.src, {
        mode: 'cors', // Enable CORS for Azure URLs
        headers: {
          'Accept': 'audio/mpeg, audio/*'
        }
      });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      
      const originalBlob = await response.blob();
      console.log(`Original file size: ${(originalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
      
      // For now, download the original file with quality suffix
      // In a real implementation, you would process the audio here
      const bitrate = audioProcessor.bitrates[quality] || 320;
      
      // Determine file extension from original blob type
      let extension = 'mp3'; // Default
      if (originalBlob.type.includes('wav')) extension = 'wav';
      else if (originalBlob.type.includes('m4a')) extension = 'm4a';
      else if (originalBlob.type.includes('flac')) extension = 'flac';
      
      // Download the original audio with quality suffix
      const filename = `${song.title.replace(/[^a-zA-Z0-9\s]/g, '')}_${bitrate}kbps.${extension}`;
      
      const url = URL.createObjectURL(originalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`Successfully downloaded ${song.title} in ${quality} quality (${bitrate}kbps)`);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  const handleAlbumDownloadClick = () => {
    if (album) {
      setDownloadType('album');
      setShowAlbumDownloadModal(true);
    }
  };

  const handleAlbumDownload = async (quality = 'high') => {
    if (!album) return;

    try {
      console.log(`Starting album download of ${album.title} in ${quality} quality...`);
      
      // Load JSZip from CDN
      const JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
      const zip = new JSZip();
      
      // Create album folder
      const albumFolder = zip.folder(album.title);
      
      const bitrate = audioProcessor.bitrates[quality] || 320;
      
      // Download each song
      for (let i = 0; i < album.songs.length; i++) {
        const song = album.songs[i];
        try {
          console.log(`Downloading ${song.title}... (${i + 1}/${album.songs.length})`);
          
          // Fetch original audio from Azure
          const response = await fetch(song.src, {
            mode: 'cors', // Enable CORS for Azure URLs
            headers: {
              'Accept': 'audio/mpeg, audio/*'
            }
          });
          if (!response.ok) throw new Error(`Failed to fetch ${song.title}: ${response.status}`);
          
          const originalBlob = await response.blob();
          console.log(`Original size for ${song.title}: ${(originalBlob.size / (1024 * 1024)).toFixed(2)} MB`);
          
          // Determine file extension from original blob type
          let extension = 'mp3'; // Default
          if (originalBlob.type.includes('wav')) extension = 'wav';
          else if (originalBlob.type.includes('m4a')) extension = 'm4a';
          else if (originalBlob.type.includes('flac')) extension = 'flac';
          
          // Add to ZIP with original format
          const fileName = `${song.title.replace(/[^a-zA-Z0-9\s]/g, '')}_${bitrate}kbps.${extension}`;
          albumFolder.file(fileName, originalBlob);
          
          console.log(`Added ${song.title} to ZIP`);
        } catch (error) {
          console.error(`Failed to add ${song.title} to ZIP:`, error);
        }
      }
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${album.title.replace(/[^a-zA-Z0-9\s]/g, '')}_${bitrate}kbps.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      console.log(`Successfully downloaded album ${album.title} in ${quality} quality (${bitrate}kbps)`);
      
    } catch (error) {
      console.error('Album download failed:', error);
      throw error;
    }
  };

  const handleLike = (song) => {
    const username = localStorage.getItem('username');
    if (!username) return;

    const songData = {
      ...song,
      albumId,
      albumCover: album.img,
      artist: album.artist,
      addedAt: new Date().toISOString(),
      src: song.src || song.url
    };

    const isLiked = favorites.liked.some(s => s.title === song.title);
    let newFavorites;

    if (isLiked) {
      newFavorites = {
        ...favorites,
        liked: favorites.liked.filter(s => s.title !== song.title)
      };
    } else {
      newFavorites = {
        ...favorites,
        liked: [...favorites.liked, songData]
      };
    }

    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));

    // Dispatch event to notify other components
    const event = new CustomEvent('favoritesUpdated', {
      detail: { favorites: newFavorites }
    });
    window.dispatchEvent(event);
  };

  const handleAddToLibrary = (song) => {
    const username = localStorage.getItem('username');
    if (!username) return;

    const songData = {
      ...song,
      albumId,
      albumCover: album.img,
      artist: album.artist,
      addedAt: new Date().toISOString(),
      src: song.src || song.url
    };

    const isAdded = favorites.added.some(s => s.title === song.title);
    let newFavorites;

    if (isAdded) {
      newFavorites = {
        ...favorites,
        added: favorites.added.filter(s => s.title !== song.title)
      };
    } else {
      newFavorites = {
        ...favorites,
        added: [...favorites.added, songData]
      };
    }

    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));

    // Dispatch event to notify other components
    const event = new CustomEvent('favoritesUpdated', {
      detail: { favorites: newFavorites }
    });
    window.dispatchEvent(event);
  };

  const isLiked = (song) => favorites.liked.some(s => s.title === song.title);
  const isAdded = (song) => favorites.added.some(s => s.title === song.title);

  return (
    <div className="songs-page-animated-pro">
      <div className="album-header-animated-pro">
        <div className="album-cover-container-pro">
          <img src={album.img} alt={album.title} className="album-cover-animated-pro" />
        </div>
        <div className="album-info-animated-pro">
          <h1 className="album-title-animated-pro">{album.title}</h1>
          <p className="album-artist-animated-pro">{album.artist}</p>
          <div className="album-actions">
            <button 
              className="album-download-btn"
              onClick={handleAlbumDownloadClick}
              title="Download entire album"
            >
              <FaDownload />
              Download Album
            </button>
          </div>
        </div>
      </div>
      <ul className="song-list-animated-pro">
        {album.songs.map((song, index) => (
          <li
            className="song-item-animated-pro"
            key={index}
            onClick={() => handlePlay(song)}
          >
            <span className="song-number-animated-pro">{index + 1}.</span>
            <p className="song-title-animated-pro">{song.title}</p>
            <div className="song-actions-pro">
            <motion.button 
              className={`play-pause-btn ${currentSong && currentSong.src === (song.src || song.url) && actualIsPlaying ? 'playing' : ''}`}
              onClick={() => handlePlay(song)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentSong && currentSong.src === (song.src || song.url) && actualIsPlaying ? <FaPause /> : <FaPlay />}
            </motion.button>
              <button
                className={`like-btn-animated-pro ${isLiked(song) ? 'liked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(song);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button
                className={`add-btn-animated-pro ${isAdded(song) ? 'added' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToLibrary(song);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
              <button
                className="download-btn-animated-pro"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadClick(song);
                }}
              >
                <svg className="download-icon-animated-pro" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <div className="download-effect-animated-pro"></div>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <audio ref={audioRef} />
      
      {/* Download Quality Modal */}
      <DownloadQualityModal
        isOpen={showDownloadModal}
        onClose={() => {
          setShowDownloadModal(false);
          setSelectedSongForDownload(null);
        }}
        song={selectedSongForDownload}
        onDownload={handleDownload}
      />

      {/* Album Download Modal */}
      <DownloadQualityModal
        isOpen={showAlbumDownloadModal}
        onClose={() => setShowAlbumDownloadModal(false)}
        album={album}
        onAlbumDownload={handleAlbumDownload}
      />
    </div>
  );
}

export default Songs;