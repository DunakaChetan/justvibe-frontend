import { useNavigate, useLocation } from "react-router-dom";
import { useState } from 'react';
import { FaHome, FaMusic, FaList, FaHeart, FaHistory, FaCog, FaSignOutAlt, FaSearch, FaBook } from 'react-icons/fa';
import './SideBar.css';

const SideBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const username = localStorage.getItem('username');

    const protectedRoutes = ['/library', '/playlists', '/favorites', '/history'];

    const handleNavigation = (path) => {
        if (protectedRoutes.includes(path) && !username) {
            setShowLoginPopup(true);
            return;
        }
        navigate(path);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        setShowLogoutConfirm(false);
        window.dispatchEvent(new Event('userLogout'));
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const handleLogin = () => {
        setShowLoginPopup(false);
        navigate('/login');
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            <nav className={`sidebar ${isExpanded ? 'expanded' : ''}`} onMouseEnter={toggleExpand} onMouseLeave={toggleExpand}>
                <div className="sidebar-header">
                    <div className="logo">JVibe</div>
                </div>
                <ul className='sidebar-menu'>
                    <li
                        className={location.pathname === "/" ? "active" : ""}
                        onClick={() => handleNavigation("/")}
                    >
                        <span className='sbl'>
                            <FaHome className='menu-icon' aria-label="Home" />
                            <span className='menu-text'>Home</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    <li
                        className={location.pathname === "/songs" ? "active" : ""}
                        onClick={() => handleNavigation("/songs")}
                    >
                        <span className='sbl'>
                            <FaMusic className='menu-icon' aria-label="Songs" />
                            <span className='menu-text'>Songs</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    <li
                        className={location.pathname === "/search" ? "active" : ""}
                        onClick={() => handleNavigation("/search")}
                    >
                        <span className='sbl'>
                            <FaSearch className='menu-icon' aria-label="Search" />
                            <span className='menu-text'>Search</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    <li
                        className={location.pathname === "/favorites" ? "active" : ""}
                        onClick={() => handleNavigation("/favorites")}
                    >
                        <span className='sbl'>
                            <FaHeart className='menu-icon' aria-label="Favorites" />
                            <span className='menu-text'>Favorites</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    <li
                        className={location.pathname === "/library" ? "active" : ""}
                        onClick={() => handleNavigation("/library")}
                    >
                        <span className='sbl'>
                            <FaBook className='menu-icon' aria-label="Library" />
                            <span className='menu-text'>Library</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    <li
                        className={location.pathname === "/history" ? "active" : ""}
                        onClick={() => handleNavigation("/history")}
                    >
                        <span className='sbl'>
                            <FaHistory className='menu-icon' aria-label="History" />
                            <span className='menu-text'>History</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    <li
                        className={location.pathname === "/settings" ? "active" : ""}
                        onClick={() => handleNavigation("/settings")}
                    >
                        <span className='sbl'>
                            <FaCog className='menu-icon' aria-label="Settings" />
                            <span className='menu-text'>Settings</span>
                        </span>
                        <div className="indicator"></div>
                    </li>
                    {username ? (
                        <li onClick={handleLogout} className="logout">
                            <span className='sbl'>
                                <FaSignOutAlt className='menu-icon sidebar-logout-icon' aria-label="Logout" />
                                <span className='menu-text logout-text'>Logout</span>
                            </span>
                            <div className="indicator"></div>
                        </li>
                    ) : (
                        <li onClick={() => navigate('/login')} className="logout">
                            <span className='sbl'>
                                <FaSignOutAlt className='menu-icon sidebar-logout-icon' aria-label="Login" />
                                <span className='menu-text logout-text'>Login</span>
                            </span>
                            <div className="indicator"></div>
                        </li>
                    )}
                </ul>
                <div className="sidebar-footer">
                    <p className="footer-text">&copy; 2025 JVibe</p>
                </div>
            </nav>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <div className="logout-confirm-overlay">
                    <div className="logout-confirm-dialog">
                        <h3>Confirm Logout</h3>
                        <p>Are you sure you want to logout?</p>
                        <div className="logout-confirm-buttons">
                            <button onClick={confirmLogout} className="confirm-yes">Yes</button>
                            <button onClick={cancelLogout} className="confirm-no">No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Popup */}
            {showLoginPopup && (
                <div className="login-popup-overlay">
                    <div className="login-popup-content">
                        <h2>Login Required</h2>
                        <p>Please login to access this feature</p>
                        <div className="login-popup-buttons">
                            <button onClick={handleLogin} className="login-button-p">Login</button>
                            <button onClick={() => setShowLoginPopup(false)} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SideBar;