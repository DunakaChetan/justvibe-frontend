import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import { FaSearch } from 'react-icons/fa';
import { BiBell } from 'react-icons/bi';
import { FaUserCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';

const dropdownVariants = {
    initial: { opacity: 0, y: -5, scaleY: 0 },
    animate: { opacity: 1, y: 0, scaleY: 1, transition: { duration: 0.15, ease: "easeOut" } },
    exit: { opacity: 0, y: -5, scaleY: 0, transition: { duration: 0.1, ease: "easeIn" } },
};

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const dropdownRef = useRef(null);
    const profileInfoRef = useRef(null);
    const [username, setUsername] = useState(localStorage.getItem('username') || null);

    const homepage = () => {
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSearchIconClick = () => {
        navigate('/search');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleClickOutside = (event) => {
        if (
            isDropdownOpen &&
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target) &&
            profileInfoRef.current &&
            !profileInfoRef.current.contains(event.target)
        ) {
            setIsDropdownOpen(false);
        }
    };

    const navigateToPage = (path) => {
        navigate(path);
        setIsDropdownOpen(false);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
        setIsDropdownOpen(false);
    };

    const confirmLogout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        setUsername(null);
        setShowLogoutConfirm(false);
        window.dispatchEvent(new Event('userLogout'));
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <div id='header'>
            <div id='logo' onClick={homepage}>
                <span>Just</span>Vibe
            </div>
            <div id='userinfo'>
                <div className="animated-search-icon" onClick={handleSearchIconClick}>
                    <FaSearch className="search-icon" />
                </div>
                {username && (
                    <div className='notification-wrapper'>
                        <BiBell className='notification-icon' />
                        <span className='notification-badge'>3</span>
                    </div>
                )}
                {username ? (
                    <div className="profile-info" ref={profileInfoRef} onClick={toggleDropdown}>
                        <FaUserCircle id='profilepic' />
                        <label id='profileid'>{username}</label>
                        <motion.div
                            className="profile-dropdown"
                            ref={dropdownRef}
                            variants={dropdownVariants}
                            initial="initial"
                            animate={isDropdownOpen ? "animate" : "exit"}
                            exit="exit"
                            style={{ originY: "top" }}
                        >
                            <ul className="dropdown-options">
                                <li><button onClick={() => navigateToPage('/profile')}><FiUser className="dropdown-icon" /> Profile</button></li>
                                <li><button onClick={() => navigateToPage('/settings')}><FiSettings className="dropdown-icon" /> Settings</button></li>
                                <li><button onClick={handleLogout}><FiLogOut className="dropdown-icon" /> Logout</button></li>
                            </ul>
                            <div className="dropdown-footer">
                                <small>Developed By Dunaka Chetan</small>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <button id='login' onClick={handleLogin}>
                        <span>Log</span>in
                    </button>
                )}
            </div>

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
        </div>
    );
}

export default Header;
