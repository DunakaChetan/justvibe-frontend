import React, { useState, useEffect } from 'react';
import { FaUser, FaPalette, FaMusic, FaBell, FaLock, FaGlobe, FaSpotify, FaGoogle, FaApple, FaCreditCard, FaInfoCircle, FaChevronRight, FaChevronLeft, FaMoon, FaSun, FaCloud, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Settings.css';

const defaultSettings = {
  account: {
    username: '',
    email: '',
    profilePicture: null,
  },
  theme: 'system',
  playback: {
    autoplay: true,
    crossfade: 5,
    quality: 'high',
    explicit: false,
  },
  notifications: {
    email: true,
    push: true,
    newReleases: true,
    recommendations: true,
  },
  privacy: {
    profileVisible: true,
    activityVisible: true,
    dataDownload: false,
    dataDelete: false,
  },
  language: 'en',
  connected: {
    spotify: false,
    google: false,
    apple: false,
  },
  subscription: {
    plan: 'Free',
    renewal: '2024-12-31',
    paymentMethod: 'Visa **** 1234',
  },
};

const sectionList = [
  { key: 'account', label: 'Account', icon: <FaUser /> },
  { key: 'theme', label: 'Theme', icon: <FaPalette /> },
  { key: 'playback', label: 'Playback', icon: <FaMusic /> },
  { key: 'notifications', label: 'Notifications', icon: <FaBell /> },
  { key: 'privacy', label: 'Privacy', icon: <FaLock /> },
  { key: 'language', label: 'Language', icon: <FaGlobe /> },
  { key: 'connected', label: 'Connected Apps', icon: <FaSpotify /> },
  { key: 'subscription', label: 'Subscription', icon: <FaCreditCard /> },
  { key: 'about', label: 'About', icon: <FaInfoCircle /> },
];

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeSection, setActiveSection] = useState('account');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('settings');
    if (stored) setSettings(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // Handlers for each section
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setSettings(s => ({ ...s, account: { ...s.account, [name]: value } }));
  };
  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSettings(s => ({ ...s, account: { ...s.account, profilePicture: ev.target.result } }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleThemeChange = (theme) => setSettings(s => ({ ...s, theme }));
  const handlePlaybackChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(s => ({
      ...s,
      playback: {
        ...s.playback,
        [name]: type === 'checkbox' ? checked : (name === 'crossfade' ? Number(value) : value),
      },
    }));
  };
  const handleNotificationsChange = (e) => {
    const { name, checked } = e.target;
    setSettings(s => ({ ...s, notifications: { ...s.notifications, [name]: checked } }));
  };
  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target;
    setSettings(s => ({ ...s, privacy: { ...s.privacy, [name]: checked } }));
  };
  const handleLanguageChange = (e) => setSettings(s => ({ ...s, language: e.target.value }));
  const handleConnectedChange = (key) => setSettings(s => ({ ...s, connected: { ...s.connected, [key]: !s.connected[key] } }));

  // Section renderers
  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <motion.div className="settings-card" key="account" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaUser /> Account</h2>
            <div className="settings-row">
              <div className="profile-pic-upload">
                <label htmlFor="profilePic">
                  {settings.account.profilePicture ? (
                    <img src={settings.account.profilePicture} alt="Profile" className="profile-pic" />
                  ) : (
                    <div className="profile-pic-placeholder"><FaUser /></div>
                  )}
                  <input id="profilePic" type="file" accept="image/*" onChange={handleProfilePic} />
                </label>
              </div>
              <div className="account-fields">
                <label>Username
                  <input name="username" value={settings.account.username} onChange={handleAccountChange} />
                </label>
                <label>Email
                  <input name="email" value={settings.account.email} onChange={handleAccountChange} />
                </label>
                <label>Password
                  <input name="password" type="password" value={settings.account.password || ''} onChange={handleAccountChange} />
                </label>
              </div>
            </div>
          </motion.div>
        );
      case 'theme':
        return (
          <motion.div className="settings-card" key="theme" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaPalette /> Theme</h2>
            <div className="theme-options">
              <button className={settings.theme === 'light' ? 'active' : ''} onClick={() => handleThemeChange('light')}><FaSun /> Light</button>
              <button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => handleThemeChange('dark')}><FaMoon /> Dark</button>
              <button className={settings.theme === 'system' ? 'active' : ''} onClick={() => handleThemeChange('system')}><FaCloud /> System</button>
            </div>
          </motion.div>
        );
      case 'playback':
        return (
          <motion.div className="settings-card" key="playback" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaMusic /> Playback</h2>
            <div className="settings-row">
              <label className="switch-label">Autoplay
                <input type="checkbox" name="autoplay" checked={settings.playback.autoplay} onChange={handlePlaybackChange} />
                <span className="switch-slider"></span>
              </label>
              <label>Crossfade
                <input type="range" name="crossfade" min="0" max="12" value={settings.playback.crossfade} onChange={handlePlaybackChange} />
                <span>{settings.playback.crossfade}s</span>
              </label>
              <label>Audio Quality
                <select name="quality" value={settings.playback.quality} onChange={handlePlaybackChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="switch-label">Allow Explicit Content
                <input type="checkbox" name="explicit" checked={settings.playback.explicit} onChange={handlePlaybackChange} />
                <span className="switch-slider"></span>
              </label>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div className="settings-card" key="notifications" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaBell /> Notifications</h2>
            <div className="settings-row">
              <label className="switch-label">Email
                <input type="checkbox" name="email" checked={settings.notifications.email} onChange={handleNotificationsChange} />
                <span className="switch-slider"></span>
              </label>
              <label className="switch-label">Push
                <input type="checkbox" name="push" checked={settings.notifications.push} onChange={handleNotificationsChange} />
                <span className="switch-slider"></span>
              </label>
              <label className="switch-label">New Releases
                <input type="checkbox" name="newReleases" checked={settings.notifications.newReleases} onChange={handleNotificationsChange} />
                <span className="switch-slider"></span>
              </label>
              <label className="switch-label">Recommendations
                <input type="checkbox" name="recommendations" checked={settings.notifications.recommendations} onChange={handleNotificationsChange} />
                <span className="switch-slider"></span>
              </label>
            </div>
          </motion.div>
        );
      case 'privacy':
        return (
          <motion.div className="settings-card" key="privacy" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaLock /> Privacy</h2>
            <div className="settings-row">
              <label className="switch-label">Profile Visible
                <input type="checkbox" name="profileVisible" checked={settings.privacy.profileVisible} onChange={handlePrivacyChange} />
                <span className="switch-slider"></span>
              </label>
              <label className="switch-label">Listening Activity Visible
                <input type="checkbox" name="activityVisible" checked={settings.privacy.activityVisible} onChange={handlePrivacyChange} />
                <span className="switch-slider"></span>
              </label>
              <button className="download-btn" onClick={() => alert('Download started!')}>Download My Data</button>
              <button className="delete-btn" onClick={() => alert('Account deletion requested!')}>Delete My Account</button>
            </div>
          </motion.div>
        );
      case 'language':
        return (
          <motion.div className="settings-card" key="language" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaGlobe /> Language</h2>
            <div className="settings-row">
              <select value={settings.language} onChange={handleLanguageChange}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="hi">Hindi</option>
                <option value="ar">Arabic</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </motion.div>
        );
      case 'connected':
        return (
          <motion.div className="settings-card" key="connected" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaSpotify /> Connected Apps</h2>
            <div className="settings-row connected-apps">
              <button className={settings.connected.spotify ? 'connected' : ''} onClick={() => handleConnectedChange('spotify')}><FaSpotify /> Spotify {settings.connected.spotify && <FaCheckCircle />}</button>
              <button className={settings.connected.google ? 'connected' : ''} onClick={() => handleConnectedChange('google')}><FaGoogle /> Google {settings.connected.google && <FaCheckCircle />}</button>
              <button className={settings.connected.apple ? 'connected' : ''} onClick={() => handleConnectedChange('apple')}><FaApple /> Apple {settings.connected.apple && <FaCheckCircle />}</button>
            </div>
          </motion.div>
        );
      case 'subscription':
        return (
          <motion.div className="settings-card" key="subscription" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaCreditCard /> Subscription</h2>
            <div className="settings-row subscription-info">
              <div><strong>Plan:</strong> {settings.subscription.plan}</div>
              <div><strong>Renewal:</strong> {settings.subscription.renewal}</div>
              <div><strong>Payment:</strong> {settings.subscription.paymentMethod}</div>
              <button className="upgrade-btn" onClick={() => alert('Upgrade coming soon!')}>Upgrade</button>
              <button className="cancel-btn" onClick={() => alert('Cancelation coming soon!')}>Cancel</button>
            </div>
          </motion.div>
        );
      case 'about':
        return (
          <motion.div className="settings-card" key="about" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <h2><FaInfoCircle /> About</h2>
            <div className="settings-row about-info">
              <p><strong>JustVibe</strong> v1.0.0</p>
              <p>Made with ❤️ for music lovers. <br /> For support, contact <a href="mailto:support@justvibe.com">support@justvibe.com</a></p>
              <p><a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> | <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div className="settings-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className={`settings-sidebar${sidebarOpen ? ' open' : ''}`}>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>{sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}</button>
        <nav>
          {sectionList.map(section => (
            <button
              key={section.key}
              className={activeSection === section.key ? 'active' : ''}
              onClick={() => setActiveSection(section.key)}
            >
              {section.icon} <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="settings-content">
        <AnimatePresence mode="wait">
          {renderSection()}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Settings; 