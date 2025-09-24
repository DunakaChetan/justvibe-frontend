import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Songs from './Songs';
import './HomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faMusic, faHeadphonesAlt } from '@fortawesome/free-solid-svg-icons';

function HomePage({ albums = [], isLoading, error, setSelectedTrack }) {
    const navigate = useNavigate();
    const [heroAlbums, setHeroAlbums] = useState([]);
    const [heroIndex, setHeroIndex] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        // Select a few random albums for the hero section
        const shuffledAlbums = [...albums].sort(() => 0.5 - Math.random());
        setHeroAlbums(shuffledAlbums.slice(0, Math.min(5, albums.length)));

        const intervalId = setInterval(() => {
            setHeroIndex((prevIndex) => (prevIndex + 1) % heroAlbums.length);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [albums, heroAlbums.length]);

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (totalHeight > 0) {
                setScrollProgress((window.scrollY / totalHeight) * 100);
            } else {
                setScrollProgress(0);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const currentHeroAlbum = heroAlbums[heroIndex];

    const goToAlbumById = (album) => {
        if (album) navigate(`/songs?id=${album.id}`);
    };

    // Group albums by a (simplified) genre for demonstration
    const genreGroups = albums.reduce((acc, album) => {
        const genre = album.genre || 'General';
        acc[genre] = acc[genre] || [];
        acc[genre].push(album);
        return acc;
    }, {});

    // Group albums by mood/category
    const categoryGroups = albums.reduce((acc, album) => {
        const category = album.category || 'General';
        acc[category] = acc[category] || [];
        acc[category].push(album);
        return acc;
    }, {});

    return (
        <div className="home-container">
            <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>

            <section className="hero">
                <div className="hero-background">
                    {currentHeroAlbum && (
                        <img
                            key={currentHeroAlbum.id}
                            src={currentHeroAlbum.img}
                            alt={currentHeroAlbum.title}
                            className="hero-bg-image fade-kenburns"
                        />
                    )}
                    <div className="overlay"></div>
                </div>
                <div className="hero-content">
                    {currentHeroAlbum && (
                        <>
                            <h1>{currentHeroAlbum.title}</h1>
                            <p className="hero-artist">By {currentHeroAlbum.artist}</p>
                            <p>{currentHeroAlbum.description || 'Hello, Welcome to JustVibe.'}</p>
                            <div className="hero-buttons">
                                <button onClick={() => goToAlbumById(currentHeroAlbum)}>
                                    <FontAwesomeIcon icon={faPlayCircle} /> Play Album
                                </button>
                                <button onClick={() => navigate(`/artist/${currentHeroAlbum.artist.replace(/\s+/g, '-').toLowerCase()}`)}>
                                    View Artist
                                </button>
                            </div>
                        </>
                    )}
                    {!currentHeroAlbum && (
                        <>
                            <h1>Discover Your Next Favorite Music</h1>
                            <p>Explore a vast library of songs and albums from talented artists.</p>
                            <button onClick={() => window.scrollTo({ top: document.querySelector('.all-albums-section').offsetTop, behavior: 'smooth' })}>
                                <FontAwesomeIcon icon={faMusic} /> Explore All Albums
                            </button>
                        </>
                    )}
                </div>
            </section>

            <section className="all-albums-section">
                <h2>All Albums</h2>
                {isLoading && <p className="loading">Loading albums...</p>}
                {error && <p className="error">{error}</p>}
                <div className="album-grid">
                    {albums.map((album) => (
                        <div key={album.id} className="album-card" onClick={() => goToAlbumById(album)}>
                            <div className="album-cover">
                                <img src={album.img} alt={album.title} />
                            </div>
                            <div className="album-info">
                                <h3>{album.title}</h3>
                                <p>{album.artist}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {Object.entries(categoryGroups).map(([category, albumGroup]) => (
                <section key={category} className={`category-section category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                    <h2>{category} Songs</h2>
                    <div className="album-carousel">
                        {albumGroup.slice(0, 7).map((album) => (
                            <div
                                key={album.id}
                                className={`carousel-item category-item category-item-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => goToAlbumById(album)}
                            >
                                <img src={album.img} alt={album.title} />
                                <div className="carousel-item-info">
                                    <h3>{album.title}</h3>
                                    <p>{album.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {Object.entries(genreGroups).map(([genre, albumGroup]) => (
                <section key={genre} className={`genre-section genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}>
                    <h2>{genre} Albums</h2>
                    <div className="album-carousel">
                        {albumGroup.slice(0, 7).map((album) => (
                            <div
                                key={album.id}
                                className={`carousel-item genre-item genre-item-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => goToAlbumById(album)}
                            >
                                <img src={album.img} alt={album.title} />
                                <div className="carousel-item-info">
                                    <h3>{album.title}</h3>
                                    <p>{album.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <section className="songs-section">
                <Songs albums={albums} setSelectedTrack={setSelectedTrack} />
            </section>
        </div>
    );
}

export default HomePage;
