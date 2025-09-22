import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaTrash, FaSort, FaFilter, FaCheck, FaMusic, FaList, FaPlus, FaSearch } from 'react-icons/fa';
import Playlists from './Playlists';
import './Library.css';

function Library({ setSelectedTrack }) {
  const [library, setLibrary] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [activeTab, setActiveTab] = useState('library'); // 'library' or 'playlists'
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [isPlaylistSelectMode, setIsPlaylistSelectMode] = useState(false);
  const [selectedSongsForPlaylist, setSelectedSongsForPlaylist] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'song', 'songs'
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadLibrary();
    loadPlaylists();

    // Listen for favorites updates
    const handleFavoritesUpdate = (event) => {
      const { added } = event.detail.favorites;
      setLibrary(added);
    };

    // Listen for playlist updates
    const handlePlaylistUpdate = (event) => {
      const { playlists: updatedPlaylists } = event.detail;
      setPlaylists(updatedPlaylists);
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('playlistsUpdated', handlePlaylistUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('playlistsUpdated', handlePlaylistUpdate);
    };
  }, []);

  const loadLibrary = () => {
    const username = localStorage.getItem('username');
    if (username) {
      const storedFavorites = localStorage.getItem(`favorites_${username}`);
      if (storedFavorites) {
        const { added } = JSON.parse(storedFavorites);
        setLibrary(added);
      }
    }
  };

  const loadPlaylists = () => {
    const username = localStorage.getItem('username');
    if (username) {
      const storedPlaylists = localStorage.getItem(`playlists_${username}`);
      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      }
    }
  };

  const handlePlay = (song) => {
    if (isSelectMode) {
      toggleSongSelection(song);
      return;
    }
    if (isPlaylistSelectMode) {
      togglePlaylistSongSelection(song);
      return;
    }
    if (setSelectedTrack) {
      setSelectedTrack(song);
    }
  };

  const handleRemove = (song) => {
    const username = localStorage.getItem('username');
    if (!username) return;

    const storedFavorites = localStorage.getItem(`favorites_${username}`);
    if (storedFavorites) {
      const favorites = JSON.parse(storedFavorites);
      const newFavorites = {
        ...favorites,
        added: favorites.added.filter(s => s.title !== song.title)
      };

      setLibrary(newFavorites.added);
      localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent('favoritesUpdated', {
        detail: { favorites: newFavorites }
      });
      window.dispatchEvent(event);

      // Also remove the song from all playlists
      const updatedPlaylists = playlists.map(playlist => ({
        ...playlist,
        songs: playlist.songs.filter(s => s.title !== song.title)
      }));
      
      localStorage.setItem(`playlists_${username}`, JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
      
      // Notify about playlist updates
      const playlistEvent = new CustomEvent('playlistsUpdated', {
        detail: { playlists: updatedPlaylists }
      });
      window.dispatchEvent(playlistEvent);
    }
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

  const togglePlaylistSongSelection = (song) => {
    setSelectedSongsForPlaylist(prev => {
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

  const handleRemoveSelected = () => {
    setDeleteType('songs');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const username = localStorage.getItem('username');
    if (!username) return;

    switch (deleteType) {
      case 'song':
        const updatedLibrary = library.filter(song => song.title !== itemToDelete);
        localStorage.setItem('favoriteSongs', JSON.stringify(updatedLibrary));
        setLibrary(updatedLibrary);
        break;
      case 'songs':
        const storedFavorites = localStorage.getItem(`favorites_${username}`);
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          const selectedTitles = selectedSongs.map(song => song.title);
          const newFavorites = {
            ...favorites,
            added: favorites.added.filter(s => !selectedTitles.includes(s.title))
          };

          setLibrary(newFavorites.added);
          localStorage.setItem(`favorites_${username}`, JSON.stringify(newFavorites));
          
          // Dispatch custom event to notify other components
          const event = new CustomEvent('favoritesUpdated', {
            detail: { favorites: newFavorites }
          });
          window.dispatchEvent(event);

          // Also remove selected songs from all playlists
          const updatedPlaylists = playlists.map(playlist => ({
            ...playlist,
            songs: playlist.songs.filter(s => !selectedTitles.includes(s.title))
          }));
          
          localStorage.setItem(`playlists_${username}`, JSON.stringify(updatedPlaylists));
          setPlaylists(updatedPlaylists);
          
          // Notify about playlist updates
          const playlistEvent = new CustomEvent('playlistsUpdated', {
            detail: { playlists: updatedPlaylists }
          });
          window.dispatchEvent(playlistEvent);

          // Reset selection mode
          setSelectedSongs([]);
          setIsSelectMode(false);
        }
        break;
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
    switch (deleteType) {
      case 'song':
        return 'Are you sure you want to remove this song from your library?';
      case 'songs':
        return `Are you sure you want to remove ${selectedSongs.length} songs from your library?`;
      default:
        return 'Are you sure you want to delete this item?';
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
    const filtered = filterSongs(library);
    return sortSongs(filtered);
  };

  const handleAddToPlaylist = (song) => {
    if (isPlaylistSelectMode) {
      togglePlaylistSongSelection(song);
      return;
    }
    setSelectedSongForPlaylist(song);
    setShowPlaylistModal(true);
  };

  const handleAddToSelectedPlaylist = (playlistId) => {
    const songsToAdd = isPlaylistSelectMode ? selectedSongsForPlaylist : [selectedSongForPlaylist];
    if (!songsToAdd.length) return;

    const updatedPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        const newSongs = songsToAdd.filter(song => 
          !p.songs.some(s => s.title === song.title)
        ).map(song => ({
          ...song,
          addedAt: new Date().toISOString()
        }));
        return {
          ...p,
          songs: [...p.songs, ...newSongs]
        };
      }
      return p;
    });

    const username = localStorage.getItem('username');
    if (username) {
      localStorage.setItem(`playlists_${username}`, JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
      
      // Notify about playlist updates
      const playlistEvent = new CustomEvent('playlistsUpdated', {
        detail: { playlists: updatedPlaylists }
      });
      window.dispatchEvent(playlistEvent);
    }

    setShowPlaylistModal(false);
    setSelectedSongForPlaylist(null);
    setSelectedSongsForPlaylist([]);
    setIsPlaylistSelectMode(false);
  };

  const togglePlaylistSelectMode = () => {
    setIsPlaylistSelectMode(!isPlaylistSelectMode);
    setSelectedSongsForPlaylist([]);
  };

  const handleSelectAllForPlaylist = () => {
    const filteredSongs = getFilteredAndSortedSongs();
    if (selectedSongsForPlaylist.length === filteredSongs.length) {
      setSelectedSongsForPlaylist([]);
    } else {
      setSelectedSongsForPlaylist(filteredSongs);
    }
  };

  const handleRemoveFromLibrary = (songTitle) => {
    setDeleteType('song');
    setItemToDelete(songTitle);
    setShowDeleteConfirm(true);
  };

  const renderLibraryContent = () => (
    <>
      <div className="library-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search in your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sort-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Recently Added</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
          </select>
        </div>
        <div className="selection-controls">
          <button 
            className={`select-mode-btn ${isSelectMode ? 'active' : ''}`}
            onClick={toggleSelectMode}
          >
            {isSelectMode ? 'Cancel Selection' : 'Select Songs'}
          </button>
          {isSelectMode && (
            <>
              <button 
                className="select-all-btn"
                onClick={handleSelectAll}
              >
                {selectedSongs.length === getFilteredAndSortedSongs().length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedSongs.length > 0 && (
                <button 
                  className="remove-selected-btn"
                  onClick={handleRemoveSelected}
                >
                  Remove Selected ({selectedSongs.length})
                </button>
              )}
            </>
          )}
          <button 
            className={`select-mode-btn ${isPlaylistSelectMode ? 'active' : ''}`}
            onClick={togglePlaylistSelectMode}
          >
            {isPlaylistSelectMode ? 'Cancel Selection' : 'Add to Playlist'}
          </button>
          {isPlaylistSelectMode && (
            <>
              <button 
                className="select-all-btn"
                onClick={handleSelectAllForPlaylist}
              >
                {selectedSongsForPlaylist.length === getFilteredAndSortedSongs().length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedSongsForPlaylist.length > 0 && (
                <button 
                  className="add-to-playlist-btn"
                  onClick={() => setShowPlaylistModal(true)}
                >
                  Add Selected ({selectedSongsForPlaylist.length})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="library-container">
        <div className="library-list">
          {getFilteredAndSortedSongs().length === 0 ? (
            <div className="no-songs">
              <p>No songs in your library yet</p>
              <button onClick={() => navigate('/')}>Discover Music</button>
            </div>
          ) : (
            getFilteredAndSortedSongs().map((song, index) => (
              <div 
                key={index} 
                className={`library-item ${isSelectMode || isPlaylistSelectMode ? 'selectable' : ''} ${
                  isSelectMode && selectedSongs.some(s => s.title === song.title) ? 'selected' : ''
                } ${
                  isPlaylistSelectMode && selectedSongsForPlaylist.some(s => s.title === song.title) ? 'selected' : ''
                }`}
                onClick={() => handlePlay(song)}
              >
                <div className="library-item-content">
                  {(isSelectMode || isPlaylistSelectMode) && (
                    <div className="selection-checkbox">
                      <FaCheck />
                    </div>
                  )}
                  <img src={song.albumCover} alt={song.title} className="library-cover" />
                  <div className="library-info">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                    <span className="added-date">
                      Added {new Date(song.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="library-actions" onClick={(e) => e.stopPropagation()}>
                  {!isSelectMode && !isPlaylistSelectMode && (
                    <>
                      <button 
                        className="play-btn"
                        onClick={() => handlePlay(song)}
                      >
                        <FaPlay /> Play
                      </button>
                      <button 
                        className="add-to-playlist-btn"
                        onClick={() => handleAddToPlaylist(song)}
                      >
                        <FaPlus /> Add to Playlist
                      </button>
                    </>
                  )}
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveFromLibrary(song.title)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPlaylistModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add to Playlist</h2>
            {isPlaylistSelectMode ? (
              <p className="selected-song-info">
                {selectedSongsForPlaylist.length} songs selected
              </p>
            ) : (
              <p className="selected-song-info">
                {selectedSongForPlaylist?.title} - {selectedSongForPlaylist?.artist}
              </p>
            )}
            <div className="playlists-list">
              {playlists.length === 0 ? (
                <p className="no-playlists-message">No playlists available. Create a playlist first!</p>
              ) : (
                playlists.map(playlist => (
                  <div 
                    key={playlist.id} 
                    className="playlist-option"
                    onClick={() => handleAddToSelectedPlaylist(playlist.id)}
                  >
                    <h3>{playlist.name}</h3>
                    <p>{playlist.songs.length} songs</p>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSelectedSongForPlaylist(null);
                  setSelectedSongsForPlaylist([]);
                  setIsPlaylistSelectMode(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Your Library</h1>
        <div className="library-tabs">
          <button 
            className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <FaList /> Library
          </button>
          <button 
            className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            <FaMusic /> Playlists
          </button>
        </div>
      </div>

      {activeTab === 'library' ? renderLibraryContent() : <Playlists setSelectedTrack={setSelectedTrack} />}
    </div>
  );
}

export default Library; 