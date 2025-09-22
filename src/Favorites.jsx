import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaPlay, FaTrash, FaSort, FaFilter, FaCheck } from 'react-icons/fa';
import './Favorites.css';

function Favorites({ setSelectedTrack }) {
  const [favorites, setFavorites] = useState({
    liked: []
  });
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'song' or 'songs'
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      const storedFavorites = localStorage.getItem(`favorites_${username}`);
      if (storedFavorites) {
        const { liked } = JSON.parse(storedFavorites);
        setFavorites({ liked });
      }
    }

    // Listen for favorites updates
    const handleFavoritesUpdate = (event) => {
      const { liked } = event.detail.favorites;
      setFavorites({ liked });
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  const handlePlay = (song) => {
    if (isSelectMode) {
      toggleSongSelection(song);
      return;
    }
    if (setSelectedTrack) {
      setSelectedTrack(song);
    }
  };

  const handleRemove = (song) => {
    setDeleteType('song');
    setItemToDelete(song.title);
    setShowDeleteConfirm(true);
  };

  const handleRemoveSelected = () => {
    setDeleteType('songs');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const username = localStorage.getItem('username');
    if (!username) return;
    const storedFavorites = localStorage.getItem(`favorites_${username}`);
    if (storedFavorites) {
      const favorites = JSON.parse(storedFavorites);
      if (deleteType === 'song') {
        const newFavorites = {
          ...favorites,
          liked: favorites.liked.filter(s => s.title !== itemToDelete)
        };
        setFavorites({ liked: newFavorites.liked });
        localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));
        const event = new CustomEvent('favoritesUpdated', { detail: { favorites: newFavorites } });
        window.dispatchEvent(event);
      } else if (deleteType === 'songs') {
        const selectedTitles = selectedSongs.map(song => song.title);
        const newFavorites = {
          ...favorites,
          liked: favorites.liked.filter(s => !selectedTitles.includes(s.title))
        };
        setFavorites({ liked: newFavorites.liked });
        localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));
        const event = new CustomEvent('favoritesUpdated', { detail: { favorites: newFavorites } });
        window.dispatchEvent(event);
        setSelectedSongs([]);
        setIsSelectMode(false);
      }
    }
    setShowDeleteConfirm(false);
    setDeleteType(null);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteType(null);
    setItemToDelete(null);
  };

  const getDeleteMessage = () => {
    if (deleteType === 'song') {
      return 'Are you sure you want to remove this song from your favorites?';
    } else if (deleteType === 'songs') {
      return `Are you sure you want to remove ${selectedSongs.length} songs from your favorites?`;
    }
    return 'Are you sure you want to delete?';
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedSongs([]);
  };

  const toggleSongSelection = (song) => {
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s.title === song.title);
      if (isSelected) {
        return prev.filter(s => s.title !== song.title);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredSongs = getFilteredAndSortedSongs();
    if (selectedSongs.length === filteredSongs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(filteredSongs);
    }
  };

  const sortSongs = (songs) => {
    return [...songs].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.addedAt) - new Date(a.addedAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        default:
          return 0;
      }
    });
  };

  const filterSongs = (songs) => {
    if (!searchQuery) return songs;
    const query = searchQuery.toLowerCase();
    return songs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
    );
  };

  const getFilteredAndSortedSongs = () => {
    const filtered = filterSongs(favorites.liked);
    return sortSongs(filtered);
  };

  return (
    <div className="fav-page">
      <div className="fav-header">
        <h1>Your Favorites</h1>
        <div className="fav-controls">
          <div className="fav-search-bar">
            <input
              type="text"
              placeholder="Search in your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="fav-sort-controls">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Recently Added</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
            </select>
          </div>
          <div className="fav-selection-controls">
            <button 
              className={`fav-select-mode-btn ${isSelectMode ? 'active' : ''}`}
              onClick={toggleSelectMode}
            >
              {isSelectMode ? 'Cancel Selection' : 'Select Songs'}
            </button>
            {isSelectMode && (
              <>
                <button 
                  className="fav-select-all-btn"
                  onClick={handleSelectAll}
                >
                  {selectedSongs.length === getFilteredAndSortedSongs().length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedSongs.length > 0 && (
                  <button 
                    className="fav-remove-selected-btn"
                    onClick={handleRemoveSelected}
                  >
                    Remove Selected ({selectedSongs.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="fav-container">
        <div className="fav-list">
          {getFilteredAndSortedSongs().length === 0 ? (
            <div className="fav-no-favorites">
              <p>No liked songs yet</p>
              <button onClick={() => navigate('/')}>Discover Music</button>
            </div>
          ) : (
            getFilteredAndSortedSongs().map((song, index) => (
              <div 
                key={index} 
                className={`fav-item ${isSelectMode ? 'selectable' : ''} ${selectedSongs.some(s => s.title === song.title) ? 'selected' : ''}`}
                onClick={() => handlePlay(song)}
              >
                <div className="fav-item-content">
                  {isSelectMode && (
                    <div className="fav-selection-checkbox">
                      <FaCheck />
                    </div>
                  )}
                  <img src={song.albumCover} alt={song.title} className="fav-cover" />
                  <div className="fav-info">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                    <span className="fav-added-date">
                      Added {new Date(song.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="fav-actions" onClick={(e) => e.stopPropagation()}>
                  {!isSelectMode && (
                    <button 
                      className="fav-play-btn"
                      onClick={() => handlePlay(song)}
                    >
                      <FaPlay /> Play
                    </button>
                  )}
                  <button 
                    className="fav-remove-btn"
                    onClick={() => handleRemove(song)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm">
            <h2>Confirm Delete</h2>
            <p>{getDeleteMessage()}</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Favorites; 