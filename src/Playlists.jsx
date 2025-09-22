import { useState, useEffect } from 'react';
import { FaPlus, FaMusic, FaTrash, FaEdit, FaPlay, FaEllipsisV, FaCheck, FaSearch, FaSort } from 'react-icons/fa';
import './Playlists.css';

function Playlists({ setSelectedTrack }) {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showSongOptions, setShowSongOptions] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [isSongDeleteMode, setIsSongDeleteMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'playlist', 'playlists', 'song', 'songs'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [playlistSort, setPlaylistSort] = useState('recent');

  useEffect(() => {
    loadPlaylists();
    // Listen for playlist updates from other components
    const handlePlaylistUpdate = () => {
      loadPlaylists();
    };
    window.addEventListener('playlistsUpdated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('playlistsUpdated', handlePlaylistUpdate);
    };
  }, []);

  const loadPlaylists = () => {
    const username = localStorage.getItem('username');
    if (username) {
      const storedPlaylists = localStorage.getItem(`playlists_${username}`);
      if (storedPlaylists) {
        const parsedPlaylists = JSON.parse(storedPlaylists);
        setPlaylists(parsedPlaylists);
        // Update selected playlist if it exists
        if (selectedPlaylist) {
          const updatedSelectedPlaylist = parsedPlaylists.find(p => p.id === selectedPlaylist.id);
          setSelectedPlaylist(updatedSelectedPlaylist || null);
        }
      }
    }
  };

  const savePlaylists = (updatedPlaylists) => {
    const username = localStorage.getItem('username');
    if (username) {
      localStorage.setItem(`playlists_${username}`, JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
      // Dispatch event to notify other components
      const event = new CustomEvent('playlistsUpdated', {
        detail: { playlists: updatedPlaylists }
      });
      window.dispatchEvent(event);
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedPlaylists([]);
  };

  const togglePlaylistSelection = (playlist) => {
    if (!isDeleteMode) return;
    
    setSelectedPlaylists(prev => {
      const isSelected = prev.some(p => p.id === playlist.id);
      if (isSelected) {
        return prev.filter(p => p.id !== playlist.id);
      } else {
        return [...prev, playlist];
      }
    });
  };

  const handleSelectAllPlaylists = () => {
    if (selectedPlaylists.length === playlists.length) {
      setSelectedPlaylists([]);
    } else {
      setSelectedPlaylists([...playlists]);
    }
  };

  const handleDeleteSelectedPlaylists = () => {
    setDeleteType('playlists');
    setShowDeleteConfirm(true);
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist = {
      id: Date.now(),
      name: newPlaylistName.trim(),
      songs: [],
      createdAt: new Date().toISOString()
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    savePlaylists(updatedPlaylists);
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = (playlistId) => {
    setDeleteType('playlist');
    setItemToDelete(playlistId);
    setShowDeleteConfirm(true);
  };

  const handleEditPlaylist = (playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setShowCreateModal(true);
  };

  const handleUpdatePlaylist = () => {
    if (!newPlaylistName.trim() || !editingPlaylist) return;

    const updatedPlaylists = playlists.map(p => 
      p.id === editingPlaylist.id 
        ? { ...p, name: newPlaylistName.trim() }
        : p
    );

    savePlaylists(updatedPlaylists);
    setNewPlaylistName('');
    setShowCreateModal(false);
    setEditingPlaylist(null);
  };

  const handleRemoveFromPlaylist = (playlistId, songTitle) => {
    setDeleteType('song');
    setItemToDelete({ playlistId, songTitle });
    setShowDeleteConfirm(true);
  };

  const handlePlaySong = (song) => {
    setSelectedTrack(song);
  };

  const toggleSongDeleteMode = () => {
    setIsSongDeleteMode(!isSongDeleteMode);
    setSelectedSongs([]);
  };

  const toggleSongSelection = (song) => {
    if (!isSongDeleteMode) return;
    
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s.title === song.title);
      if (isSelected) {
        return prev.filter(s => s.title !== song.title);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleSelectAllSongs = () => {
    if (!selectedPlaylist) return;
    
    if (selectedSongs.length === selectedPlaylist.songs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs([...selectedPlaylist.songs]);
    }
  };

  const handleDeleteSelectedSongs = () => {
    setDeleteType('songs');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    switch (deleteType) {
      case 'playlist':
        const updatedPlaylists = playlists.filter(p => p.id !== itemToDelete);
        savePlaylists(updatedPlaylists);
        if (selectedPlaylist?.id === itemToDelete) {
          setSelectedPlaylist(null);
        }
        break;
      case 'playlists':
        const updatedPlaylistsAfterMultiDelete = playlists.filter(p => !selectedPlaylists.some(sp => sp.id === p.id));
        savePlaylists(updatedPlaylistsAfterMultiDelete);
        setSelectedPlaylists([]);
        setIsDeleteMode(false);
        if (selectedPlaylist && selectedPlaylists.some(p => p.id === selectedPlaylist.id)) {
          setSelectedPlaylist(null);
        }
        break;
      case 'song':
        const updatedPlaylistsAfterSongDelete = playlists.map(p => {
          if (p.id === itemToDelete.playlistId) {
            return {
              ...p,
              songs: p.songs.filter(s => s.title !== itemToDelete.songTitle)
            };
          }
          return p;
        });
        savePlaylists(updatedPlaylistsAfterSongDelete);
        setSelectedPlaylist(updatedPlaylistsAfterSongDelete.find(p => p.id === itemToDelete.playlistId));
        break;
      case 'songs':
        const updatedPlaylistsAfterMultiSongDelete = playlists.map(p => {
          if (p.id === selectedPlaylist.id) {
            return {
              ...p,
              songs: p.songs.filter(s => !selectedSongs.some(ss => ss.title === s.title))
            };
          }
          return p;
        });
        savePlaylists(updatedPlaylistsAfterMultiSongDelete);
        setSelectedSongs([]);
        setIsSongDeleteMode(false);
        setSelectedPlaylist(updatedPlaylistsAfterMultiSongDelete.find(p => p.id === selectedPlaylist.id));
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
      case 'playlist':
        return 'Are you sure you want to delete this playlist?';
      case 'playlists':
        return `Are you sure you want to delete ${selectedPlaylists.length} playlists?`;
      case 'song':
        return 'Are you sure you want to remove this song from the playlist?';
      case 'songs':
        return `Are you sure you want to remove ${selectedSongs.length} songs from the playlist?`;
      default:
        return 'Are you sure you want to delete this item?';
    }
  };

  // Filter and sort playlists
  const getFilteredAndSortedPlaylists = () => {
    let filtered = playlists;
    if (playlistSearch) {
      const query = playlistSearch.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }
    switch (playlistSort) {
      case 'recent':
        return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'name':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'count':
        return [...filtered].sort((a, b) => b.songs.length - a.songs.length);
      default:
        return filtered;
    }
  };

  return (
    <div className="playlists-page">
      <div className="playlists-header">
        <h1>Your Playlists</h1>
        <div className="playlist-controls">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={playlistSearch}
              onChange={e => setPlaylistSearch(e.target.value)}
            />
          </div>
          <div className="sort-controls">
            <select value={playlistSort} onChange={e => setPlaylistSort(e.target.value)}>
              <option value="recent">Recently Created</option>
              <option value="name">Name</option>
              <option value="count">Song Count</option>
            </select>
          </div>
        </div>
        <div className="playlist-actions">
          <button 
            className={`delete-mode-btn ${isDeleteMode ? 'active' : ''}`}
            onClick={toggleDeleteMode}
          >
            {isDeleteMode ? 'Cancel' : 'Delete Playlists'}
          </button>
          {isDeleteMode && (
            <>
              <button 
                className="select-all-btn"
                onClick={handleSelectAllPlaylists}
              >
                {selectedPlaylists.length === playlists.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedPlaylists.length > 0 && (
                <button 
                  className="delete-selected-btn"
                  onClick={handleDeleteSelectedPlaylists}
                >
                  Delete Selected ({selectedPlaylists.length})
                </button>
              )}
            </>
          )}
          <button 
            className="create-playlist-btn"
            onClick={() => {
              setEditingPlaylist(null);
              setNewPlaylistName('');
              setShowCreateModal(true);
            }}
          >
            <FaPlus /> Create New Playlist
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="playlist-input"
            />
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPlaylist(null);
                  setNewPlaylistName('');
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={editingPlaylist ? handleUpdatePlaylist : handleCreatePlaylist}
              >
                {editingPlaylist ? 'Update' : 'Create'}
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

      <div className="playlists-container">
        {getFilteredAndSortedPlaylists().length === 0 ? (
          <div className="no-playlists">
            <FaMusic className="empty-icon" />
            <p>No playlists yet</p>
            <button onClick={() => setShowCreateModal(true)}>Create Your First Playlist</button>
          </div>
        ) : (
          <div className="playlists-grid">
            {getFilteredAndSortedPlaylists().map(playlist => (
              <div 
                key={playlist.id} 
                className={`playlist-card ${selectedPlaylist?.id === playlist.id ? 'selected' : ''} ${
                  isDeleteMode && selectedPlaylists.some(p => p.id === playlist.id) ? 'delete-selected' : ''
                }`}
                onClick={() => {
                  if (isDeleteMode) {
                    togglePlaylistSelection(playlist);
                  } else {
                    setSelectedPlaylist(playlist);
                  }
                }}
              >
                <div className="playlist-info">
                  {isDeleteMode && (
                    <div className="selection-checkbox">
                      <FaCheck />
                    </div>
                  )}
                  <h3>{playlist.name}</h3>
                  <p>{playlist.songs.length} songs</p>
                  <span className="created-date">
                    Created {new Date(playlist.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="playlist-actions">
                  {!isDeleteMode && (
                    <>
                      <button 
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPlaylist(playlist);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist.id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPlaylist && !isDeleteMode && (
          <div className="playlist-songs">
            <div className="playlist-songs-header">
              <h2>{selectedPlaylist.name}</h2>
              <div className="playlist-songs-actions">
                <button 
                  className={`delete-mode-btn ${isSongDeleteMode ? 'active' : ''}`}
                  onClick={toggleSongDeleteMode}
                >
                  {isSongDeleteMode ? 'Cancel' : 'Delete Songs'}
                </button>
                {isSongDeleteMode && (
                  <>
                    <button 
                      className="select-all-btn"
                      onClick={handleSelectAllSongs}
                    >
                      {selectedSongs.length === selectedPlaylist.songs.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedSongs.length > 0 && (
                      <button 
                        className="delete-selected-btn"
                        onClick={handleDeleteSelectedSongs}
                      >
                        Delete Selected ({selectedSongs.length})
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {selectedPlaylist.songs.length === 0 ? (
              <p className="no-songs">No songs in this playlist yet</p>
            ) : (
              <div className="songs-list">
                {selectedPlaylist.songs.map((song, index) => (
                  <div 
                    key={index} 
                    className={`song-item ${isSongDeleteMode && selectedSongs.some(s => s.title === song.title) ? 'delete-selected' : ''}`}
                    onClick={() => {
                      if (isSongDeleteMode) {
                        toggleSongSelection(song);
                      } else {
                        handlePlaySong(song);
                      }
                    }}
                  >
                    {isSongDeleteMode && (
                      <div className="selection-checkbox">
                        <FaCheck />
                      </div>
                    )}
                    <img src={song.albumCover} alt={song.title} className="song-cover" />
                    <div className="song-info">
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
                    </div>
                    <div className="song-actions" onClick={(e) => e.stopPropagation()}>
                      {!isSongDeleteMode && (
                        <>
                          <button 
                            className="play-btn"
                            onClick={() => handlePlaySong(song)}
                          >
                            <FaPlay />
                          </button>
                          <button 
                            className="remove-btn"
                            onClick={() => handleRemoveFromPlaylist(selectedPlaylist.id, song.title)}
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Playlists; 