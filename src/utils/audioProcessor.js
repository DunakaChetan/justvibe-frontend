// Audio processing utilities for quality downloads
export class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.bitrates = {
            low: 128,
            medium: 256,
            high: 320
        };
    }

    // Initialize audio context
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Calculate estimated file size based on duration and bitrate
    calculateFileSize(durationInSeconds, bitrateKbps) {
        // Formula: (bitrate in kbps * duration in seconds) / 8 = size in KB
        // Then convert to MB
        const sizeInKB = (bitrateKbps * durationInSeconds) / 8;
        const sizeInMB = sizeInKB / 1024;
        return sizeInMB;
    }

    // Format file size for display
    formatFileSize(sizeInMB) {
        if (sizeInMB < 1) {
            return `${Math.round(sizeInMB * 1024)} KB`;
        } else if (sizeInMB < 10) {
            return `${sizeInMB.toFixed(1)} MB`;
        } else {
            return `${Math.round(sizeInMB)} MB`;
        }
    }

    // Get quality options with calculated file sizes
    getQualityOptions(durationInSeconds) {
        return Object.entries(this.bitrates).map(([quality, bitrate]) => {
            const fileSize = this.calculateFileSize(durationInSeconds, bitrate);
            return {
                quality,
                bitrate: `${bitrate}k`,
                size: this.formatFileSize(fileSize),
                sizeInMB: fileSize,
                description: this.getQualityDescription(quality, bitrate)
            };
        });
    }

    // Get quality description
    getQualityDescription(quality, bitrate) {
        const descriptions = {
            low: `Standard quality - ${bitrate}kbps`,
            medium: `High quality - ${bitrate}kbps`,
            high: `Premium quality - ${bitrate}kbps`
        };
        return descriptions[quality] || `Custom quality - ${bitrate}kbps`;
    }

    // Process audio file to different quality using Web Audio API
    async processAudioToQuality(audioBlob, targetBitrate) {
        try {
            console.log(`Processing audio to ${targetBitrate}kbps...`);
            
            // Create audio context
            const audioContext = this.initAudioContext();
            
            // Convert blob to array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log(`Original audio: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
            
            // Process the audio to simulate different bitrates
            const processedBlob = await this.reEncodeAudio(audioBuffer, targetBitrate);
            
            console.log(`Processed audio: ${(processedBlob.size / (1024 * 1024)).toFixed(2)} MB`);
            return processedBlob;
        } catch (error) {
            console.error('Audio processing error:', error);
            // Fallback to original blob if processing fails
            return audioBlob;
        }
    }

    // Re-encode audio to simulate different bitrates without cropping
    async reEncodeAudio(audioBuffer, targetBitrate) {
        return new Promise(async (resolve) => {
            try {
                // For now, return the original blob to maintain format and prevent speed issues
                // In a real implementation, you would use a proper MP3 encoder library
                console.log(`Simulating ${targetBitrate}kbps quality (keeping original format)`);
                
                // Convert original audio buffer back to blob in original format
                const originalBlob = await this.audioBufferToBlob(audioBuffer);
                resolve(originalBlob);
            } catch (error) {
                console.error('Re-encoding error:', error);
                // Fallback: return original as blob
                const originalBlob = await this.audioBufferToBlob(audioBuffer);
                resolve(originalBlob);
            }
        });
    }

    // Get compression ratio based on target bitrate
    getCompressionRatio(targetBitrate) {
        const ratios = {
            128: 0.4,  // 40% of original quality
            256: 0.7,  // 70% of original quality
            320: 1.0   // 100% of original quality
        };
        return ratios[targetBitrate] || 1.0;
    }

    // Compress audio data by reducing resolution and applying filtering
    compressAudioData(channelData, compressionRatio) {
        const length = channelData.length;
        const compressedLength = Math.floor(length * compressionRatio);
        const compressed = new Float32Array(compressedLength);
        
        // Downsample and apply smoothing
        const step = length / compressedLength;
        for (let i = 0; i < compressedLength; i++) {
            const start = Math.floor(i * step);
            const end = Math.floor((i + 1) * step);
            
            // Average samples in the range for smoothing
            let sum = 0;
            for (let j = start; j < end && j < length; j++) {
                sum += channelData[j];
            }
            compressed[i] = sum / (end - start);
        }
        
        return compressed;
    }

    // Create audio buffer from processed channels
    createAudioBuffer(channels, sampleRate) {
        const audioContext = this.initAudioContext();
        const buffer = audioContext.createBuffer(channels.length, channels[0].length, sampleRate);
        
        for (let i = 0; i < channels.length; i++) {
            buffer.copyToChannel(channels[i], i);
        }
        
        return buffer;
    }

    // Convert audio buffer to blob - return original format
    async audioBufferToBlob(audioBuffer) {
        // For now, we'll create a simple WAV file to maintain compatibility
        // In a real implementation, you'd detect the original format and re-encode accordingly
        
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const numberOfChannels = audioBuffer.numberOfChannels;
        
        // Calculate WAV file size
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert audio data to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    // Download processed audio
    downloadProcessedAudio(processedBlob, filename, quality) {
        const url = URL.createObjectURL(processedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Get actual audio duration from audio file (works with Azure URLs)
    async getAudioDuration(audioSrc) {
        return new Promise((resolve) => {
            const audio = new Audio();
            
            // Set timeout to prevent hanging
            const timeout = setTimeout(() => {
                resolve(210); // Default fallback after 5 seconds
            }, 5000);
            
            audio.addEventListener('loadedmetadata', () => {
                clearTimeout(timeout);
                const duration = audio.duration;
                console.log(`Audio duration for ${audioSrc}: ${duration} seconds`);
                resolve(duration || 210); // Default to 3.5 minutes if duration not available
            });
            
            audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                console.warn(`Could not load audio metadata for ${audioSrc}:`, e);
                resolve(210); // Default fallback
            });
            
            // Add CORS handling for Azure URLs
            audio.crossOrigin = 'anonymous';
            audio.src = audioSrc;
        });
    }

    // Get real-time file size for a song (works with Azure URLs)
    async getSongFileSize(songSrc, durationInSeconds) {
        try {
            // First, try to get the actual file size from the server
            const response = await fetch(songSrc, { 
                method: 'HEAD',
                mode: 'cors' // Enable CORS for Azure URLs
            });
            const contentLength = response.headers.get('content-length');
            
            if (contentLength) {
                const actualSizeInMB = parseInt(contentLength) / (1024 * 1024);
                console.log(`Actual file size for ${songSrc}: ${actualSizeInMB.toFixed(2)} MB`);
                return this.formatFileSize(actualSizeInMB);
            }
        } catch (error) {
            console.warn('Could not get actual file size from server:', error);
        }

        // Fallback to estimated size based on duration
        // Assume average bitrate of 192kbps for estimation
        const estimatedSize = this.calculateFileSize(durationInSeconds, 192);
        console.log(`Estimated file size for ${songSrc}: ${estimatedSize.toFixed(2)} MB (${durationInSeconds}s duration)`);
        return this.formatFileSize(estimatedSize);
    }
}

// Export singleton instance
export const audioProcessor = new AudioProcessor();
