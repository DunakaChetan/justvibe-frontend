import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPopup.css';

function LoginPopup({ isOpen, onClose }) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogin = () => {
        onClose();
        navigate('/login');
    };

    return (
        <div className="login-popup-overlay">
            <div className="login-popup-content">
                <h2>Login Required</h2>
                <p>Please login to play songs</p>
                <div className="login-popup-buttons">
                    <button onClick={handleLogin} className="login-button-p">Login</button>
                    <button onClick={onClose} className="close-button">Close</button>
                </div>
            </div>
        </div>
    );
}

export default LoginPopup; 