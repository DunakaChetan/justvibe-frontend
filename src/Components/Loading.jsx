import React from "react";
import './Loading.css';

const Loading = () => {
    return (
        <div className="loading-overlay">
            <div className="loader">
                <span className="flask" style={{ '--i': 0 }}></span>
                <span className="flask" style={{ '--i': 1 }}></span>
                <span className="flask" style={{ '--i': 2 }}></span>
                <span className="flask" style={{ '--i': 3 }}></span>
                <span className="flask" style={{ '--i': 4 }}></span>
            </div>
        </div>
    );
};

export default Loading;