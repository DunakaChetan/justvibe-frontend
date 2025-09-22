import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Search.css';
import { FaSearch } from 'react-icons/fa';

function Search({ albums = [], setSelectedTrack }) {
    const location = useLocation();
    const initialSearchTerm = location.state?.searchTerm?.toLowerCase() || '';
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [results, setResults] = useState([]);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (searchTerm) {
            const filtered = [];

            albums.forEach(album => {
                if (album.title.toLowerCase().includes(searchTerm)) {
                    filtered.push({ type: 'album', name: album.title, id: album.id, img: album.img }); // Include image
                }

                if (album.artist.toLowerCase().includes(searchTerm)) {
                    const exists = filtered.some(res => res.type === 'artist' && res.name === album.artist);
                    if (!exists) filtered.push({ type: 'artist', name: album.artist, id: album.id });
                }

                album.songs.forEach(song => {
                    if (song.title.toLowerCase().includes(searchTerm)) {
                        filtered.push({ type: 'song', name: song.title, id: album.id, albumTitle: album.title, albumImg: album.img }); // Include image
                    }
                });

                if (album.category?.toLowerCase().includes(searchTerm)) {
                    const exists = filtered.some(res => res.type === 'category' && res.name === album.category);
                    if (!exists) filtered.push({ type: 'category', name: album.category, id: album.id });
                }
            });

            const unique = filtered.filter((result, index, self) =>
                index === self.findIndex(t =>
                    t.type === result.type && t.name === result.name && t.id === result.id
                )
            );

            setResults(unique);
        } else {
            setResults([]);
        }
    }, [searchTerm]);

    const getLinkPath = (result) => {
        return `/songs?id=${result.id}`;
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    return (
        <div className="search-results-page">
            <div className="search-bar-container">
                <div className="animated-search-input">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search music, artists, albums..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        className="search-input"
                        ref={searchInputRef}
                    />
                </div>
            </div>

            {!searchTerm ? (
                <div className="default-content">
                    <h2>Explore Music</h2>
                    <div className="default-grid">
                        {albums.map(album => (
                            <Link
                                to={{
                                    pathname: `/songs`,
                                    search: `?id=${album.id}`,
                                    state: { album }
                                }}
                                key={album.id}
                                className="default-album-card animated-album-card" // Added class for animation
                            >
                                <div className="album-image-container">
                                    <img src={album.img} alt={album.title} className="album-image" />
                                </div>
                                <h3 className="album-title">{album.title}</h3>
                                <p className="album-artist">{album.artist}</p>
                                <ul className="album-songs-preview">
                                    {album.songs.slice(0, 3).map((song, index) => (
                                        <li key={index}>{song.title}</li>
                                    ))}
                                    {album.songs.length > 3 && <li>...and more</li>}
                                </ul>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <h2>Search Results for: <span className="term">{searchTerm}</span></h2>
                    {results.length > 0 ? (
                        <ul className="result-list animated-results"> {/* Added class for animation */}
                            {results.map((result, index) => (
                                <li key={index} style={{ '--delay': `${index * 0.05}s` }}>
                                    <Link
                                        to={getLinkPath(result)}
                                        className="result-link animated-result-link" // Added class for animation
                                        onClick={() => {
                                            const album = albums.find(album => album.id === result.id);
                                            if (album && result.type === 'song') {
                                                const trackToPlay = album.songs.find(song => song.title === result.name);
                                                if (trackToPlay) {
                                                    setSelectedTrack({ ...trackToPlay, album });
                                                }
                                            }
                                        }}
                                    >
                                        {result.img || result.albumImg ? (
                                            <div className="search-result-image-wrapper"> {/* NEW CLASS NAME */}
                                                <img
                                                    src={result.img || result.albumImg}
                                                    alt={result.name}
                                                    className="search-result-image"
                                                />
                                            </div>
                                        ) : null}
                                        <span className="result-name">{result.name}</span>
                                        <span className="result-type">
                                            ({result.type}
                                            {result.albumTitle && ` - ${result.albumTitle}`}
                                            {result.type === 'category' && ` Albums`})
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-results animated-no-results">No results found.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default Search;