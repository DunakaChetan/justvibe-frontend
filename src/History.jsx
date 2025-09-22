import React, { useEffect, useState } from 'react';
import { FaHistory, FaTrash, FaSearch, FaListUl, FaTimesCircle, FaPlay, FaMusic } from 'react-icons/fa';
import './History.css';

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const History = ({ setSelectedTrack }) => {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showConfirm, setShowConfirm] = useState(false);
  const [albumFilter, setAlbumFilter] = useState('');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (username) {
      const storedHistory = localStorage.getItem(`history_${username}`);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    }
    const handleHistoryUpdate = (event) => {
      setHistory(event.detail.history);
    };
    window.addEventListener('historyUpdated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdate);
    };
  }, [username]);

  // Filtered and sorted history
  let filteredHistory = history.filter(item => {
    const q = search.toLowerCase();
    const albumMatch = albumFilter ? (item.album && item.album === albumFilter) : true;
    return (
      (item.title.toLowerCase().includes(q) ||
      (item.artist && item.artist.toLowerCase().includes(q)) ||
      (item.album && item.album.toLowerCase().includes(q))) && albumMatch
    );
  });
  if (sortBy === 'title') filteredHistory = [...filteredHistory].sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === 'artist') filteredHistory = [...filteredHistory].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
  else filteredHistory = [...filteredHistory].sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));

  // Remove from history
  const handleRemove = (idx) => {
    const newHistory = [...history];
    newHistory.splice(idx, 1);
    setHistory(newHistory);
    if (username) {
      localStorage.setItem(`history_${username}`, JSON.stringify(newHistory));
      window.dispatchEvent(new CustomEvent('historyUpdated', { detail: { history: newHistory } }));
    }
  };

  // Clear all history
  const handleClearHistory = () => {
    setShowConfirm(true);
  };
  const confirmClear = () => {
    setHistory([]);
    setShowConfirm(false);
    if (username) {
      localStorage.setItem(`history_${username}`, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('historyUpdated', { detail: { history: [] } }));
    }
  };
  const cancelClear = () => setShowConfirm(false);

  // Album filter options
  const albumOptions = Array.from(new Set(history.map(item => item.album).filter(Boolean)));

  // Total listening time
  const totalSeconds = filteredHistory.reduce((sum, item) => sum + (item.duration || 0), 0);
  const totalTime = formatDuration(totalSeconds);

  return (
    <div className="history-page pro">
      <div className="history-header pro">
        <div className="header-left">
          <FaHistory className="history-icon" />
          <h1>Listening History</h1>
        </div>
        <div className="history-actions">
          <span className="history-count styled-count">{filteredHistory.length} song{filteredHistory.length !== 1 ? 's' : ''} in history</span>
          {totalSeconds > 0 && <span className="history-total-time">Total: {totalTime}</span>}
          <button className="clear-history-btn styled-btn" onClick={handleClearHistory} disabled={history.length === 0}>
            <FaTrash /> Clear History
          </button>
        </div>
      </div>
      <div className="history-controls-bar">
        <div className="history-search-bar styled-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search history by song, artist, or album..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="history-sort-bar styled-sort">
          <label htmlFor="sort-history">Sort by:</label>
          <select id="sort-history" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="recent">Recently Played</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
          </select>
        </div>
        {albumOptions.length > 1 && (
          <div className="history-album-filter styled-album-filter">
            <label htmlFor="album-filter">Album:</label>
            <select id="album-filter" value={albumFilter} onChange={e => setAlbumFilter(e.target.value)}>
              <option value="">All</option>
              {albumOptions.map((album, i) => (
                <option value={album} key={i}>{album}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="history-list pro">
        {filteredHistory.length === 0 ? (
          <div className="no-history pro">
            <FaListUl className="no-history-icon" />
            <p>No listening history found.</p>
          </div>
        ) : (
          <div className="history-grid">
            {filteredHistory.map((item, idx) => (
              <div className="history-card" key={idx}>
                <div className="history-album-art">
                  {item.albumCover ? (
                    <img src={item.albumCover} alt={item.title} />
                  ) : (
                    <div className="history-fallback-img"><FaMusic /></div>
                  )}
                  <button className="card-play-btn" onClick={() => setSelectedTrack && setSelectedTrack(item)}>
                    <FaPlay />
                  </button>
                </div>
                <div className="history-meta">
                  <h3>{item.title}</h3>
                  <p className="artist">{item.artist || <span className="no-artist">Unknown Artist</span>}</p>
                  {item.album && <p className="album album-link" onClick={() => setAlbumFilter(item.album)} title="Filter by album">Album: {item.album}</p>}
                  {item.genre && <p className="genre">Genre: {item.genre}</p>}
                  {item.duration && <p className="duration">Duration: {formatDuration(item.duration)}</p>}
                  <div className="history-extra">
                    <span className="last-played">{formatTimeAgo(item.playedAt)}</span>
                  </div>
                </div>
                <button className="remove-history-btn" title="Remove from history" onClick={() => handleRemove(idx)}>
                  <FaTimesCircle />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirm">
            <h2>Confirm Clear History</h2>
            <p>Are you sure you want to clear your entire listening history?</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelClear}>Cancel</button>
              <button className="delete-btn" onClick={confirmClear}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History; 