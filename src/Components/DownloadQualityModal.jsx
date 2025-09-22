import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaCheck, FaSpinner, FaMusic, FaFolder } from 'react-icons/fa';
import { audioProcessor } from '../utils/audioProcessor';
import './DownloadQualityModal.css';

const DownloadQualityModal = ({ isOpen, onClose, song, album, onDownload, onAlbumDownload }) => {
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [qualityOptions, setQualityOptions] = useState([]);
  const [isLoadingSizes, setIsLoadingSizes] = useState(true);

  const isAlbumDownload = !!album;

  // Calculate quality options with real file sizes
  useEffect(() => {
    const calculateQualityOptions = async () => {
      setIsLoadingSizes(true);
      
      try {
        if (isAlbumDownload && album) {
          // For album downloads, get actual file sizes from Azure
          const fileSizes = await Promise.all(
            album.songs.map(async (song) => {
              try {
                const response = await fetch(song.src, { 
                  method: 'HEAD',
                  mode: 'cors'
                });
                const contentLength = response.headers.get('content-length');
                return contentLength ? parseInt(contentLength) : 0;
              } catch (error) {
                console.warn(`Could not get file size for ${song.title}:`, error);
                return 0;
              }
            })
          );
          
          const totalSizeBytes = fileSizes.reduce((sum, size) => sum + size, 0);
          const totalSizeMB = totalSizeBytes / (1024 * 1024);
          
          console.log('Total album size from Azure:', totalSizeMB.toFixed(2), 'MB');
          
          // Create quality options with actual sizes
          const options = [
            {
              id: 'low',
              label: 'Low Quality',
              description: 'Standard quality - 128kbps',
              size: audioProcessor.formatFileSize(totalSizeMB * 0.4), // 40% of original
              color: 'rgb(255, 140, 0)'
            },
            {
              id: 'medium',
              label: 'Medium Quality',
              description: 'High quality - 256kbps',
              size: audioProcessor.formatFileSize(totalSizeMB * 0.7), // 70% of original
              color: 'rgb(255, 123, 47)'
            },
            {
              id: 'high',
              label: 'High Quality',
              description: 'Premium quality - 320kbps',
              size: audioProcessor.formatFileSize(totalSizeMB), // 100% of original
              color: 'rgb(255, 87, 34)'
            }
          ];
          
          setQualityOptions(options);
          
        } else if (song) {
          // For single song downloads, get actual file size from Azure
          let actualSizeMB = 0;
          
          try {
            const response = await fetch(song.src, { 
              method: 'HEAD',
              mode: 'cors'
            });
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              actualSizeMB = parseInt(contentLength) / (1024 * 1024);
              console.log('Actual file size from Azure:', actualSizeMB.toFixed(2), 'MB');
            }
          } catch (error) {
            console.warn('Could not get actual file size:', error);
          }
          
          // If we couldn't get actual size, fallback to estimated size
          if (actualSizeMB === 0) {
            const duration = song.duration || 210; // Default 3.5 minutes
            actualSizeMB = audioProcessor.calculateFileSize(duration, 192); // Assume 192kbps average
            console.log('Using estimated size:', actualSizeMB.toFixed(2), 'MB');
          }
          
          // Create quality options with actual/estimated sizes
          const options = [
            {
              id: 'low',
              label: 'Low Quality',
              description: 'Standard quality - 128kbps',
              size: audioProcessor.formatFileSize(actualSizeMB * 0.4), // 40% of original
              color: 'rgb(255, 140, 0)'
            },
            {
              id: 'medium',
              label: 'Medium Quality',
              description: 'High quality - 256kbps',
              size: audioProcessor.formatFileSize(actualSizeMB * 0.7), // 70% of original
              color: 'rgb(255, 123, 47)'
            },
            {
              id: 'high',
              label: 'High Quality',
              description: 'Premium quality - 320kbps',
              size: audioProcessor.formatFileSize(actualSizeMB), // 100% of original
              color: 'rgb(255, 87, 34)'
            }
          ];
          
          setQualityOptions(options);
        }
      } catch (error) {
        console.error('Error calculating quality options:', error);
        // Fallback to default options
        setQualityOptions([
          { id: 'low', label: 'Low Quality', description: 'Standard quality - 128kbps', size: '~2.5 MB', color: 'rgb(255, 140, 0)' },
          { id: 'medium', label: 'Medium Quality', description: 'High quality - 256kbps', size: '~5.0 MB', color: 'rgb(255, 123, 47)' },
          { id: 'high', label: 'High Quality', description: 'Premium quality - 320kbps', size: '~6.5 MB', color: 'rgb(255, 87, 34)' }
        ]);
      } finally {
        setIsLoadingSizes(false);
      }
    };

    if (isOpen && (song || album)) {
      calculateQualityOptions();
    }
  }, [isOpen, song, album, isAlbumDownload]);

  // Early return after all hooks
  if (!isOpen || (!song && !album)) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      if (isAlbumDownload) {
        // Real album download with progress tracking
        const progressInterval = setInterval(() => {
          setDownloadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 10;
          });
        }, 200);

        await onAlbumDownload(selectedQuality);
        
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
          setDownloadProgress(0);
        }, 1000);
      } else {
        // Real single song download with quality processing
        await onDownload(song, selectedQuality);
        onClose();
      }
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(0);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    if (!isDownloading) {
      onClose();
      setDownloadProgress(0);
    }
  };

  return (
    <div className="download-modal-overlay" onClick={handleClose}>
      <div className="download-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="download-modal-header">
          <div className="download-modal-title">
            {isAlbumDownload ? (
              <>
                <FaFolder className="download-icon" />
                <h2>Download Album</h2>
              </>
            ) : (
              <>
                <FaDownload className="download-icon" />
                <h2>Download Song</h2>
              </>
            )}
          </div>
          <button 
            className="download-modal-close" 
            onClick={handleClose}
            disabled={isDownloading}
          >
            <FaTimes />
          </button>
        </div>

        <div className="download-song-info">
          <img 
            src={isAlbumDownload ? album.img : (song.albumCover || song.img)} 
            alt={isAlbumDownload ? album.title : song.title} 
            className="download-song-cover" 
          />
          <div className="download-song-details">
            <h3>{isAlbumDownload ? album.title : song.title}</h3>
            <p>{isAlbumDownload ? album.artist : song.artist}</p>
            {isAlbumDownload && (
              <div className="album-stats">
                <span className="song-count">
                  <FaMusic /> {album.songs.length} songs
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="download-quality-section">
          <h3>Select Download Quality</h3>
          {isLoadingSizes ? (
            <div className="quality-loading">
              <FaSpinner className="spinning" />
              <span>Calculating file sizes...</span>
            </div>
          ) : (
            <div className="quality-options">
              {qualityOptions.map((option) => (
              <div
                key={option.id}
                className={`quality-option ${selectedQuality === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedQuality(option.id)}
              >
                <div className="quality-option-header">
                  <div className="quality-radio">
                    {selectedQuality === option.id && <FaCheck />}
                  </div>
                  <div className="quality-info">
                    <h4>{option.label}</h4>
                    <p>{option.description}</p>
                    <span className="quality-size">{option.size}</span>
                  </div>
                </div>
                <div 
                  className="quality-indicator"
                  style={{ backgroundColor: option.color }}
                ></div>
              </div>
            ))}
            </div>
          )}
        </div>

        {isDownloading && isAlbumDownload && (
          <div className="download-progress-section">
            <div className="download-quality-modal">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">
                Downloading album... {Math.round(downloadProgress)}%
              </p>
            </div>
          </div>
        )}

        <div className="download-modal-actions">
          <button 
            className="download-cancel-btn" 
            onClick={handleClose}
            disabled={isDownloading}
          >
            Cancel
          </button>
          <button 
            className="download-confirm-btn"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <FaSpinner className="spinning" />
                Downloading...
              </>
            ) : (
              <>
                <FaDownload />
                Download {isAlbumDownload ? 'Album' : 'Song'} {qualityOptions.find(q => q.id === selectedQuality)?.label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadQualityModal;
