import React, { useState } from 'react';
import './LoginPage.css';
import { FaUser, FaLock, FaEnvelope, FaSignOutAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(clearMessage, 3000);
  };

  const clearBorders = () => {
    const inputs = document.querySelectorAll('.inp, .inpass');
    inputs.forEach(input => input.classList.remove('error'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      userRegistration();
    } else {
      signIn();
    }
  };

  const toggleRegister = (e) => {
    e.preventDefault();
    setIsRegistering(!isRegistering);
    clearMessage();
    clearBorders();
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/');
  };

  const userRegistration = () => {
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("signup-password");
    const confirmPassword = document.getElementById("confirm-password");

    clearBorders();
    clearMessage();

    if (
      username.value === "" ||
      email.value === "" ||
      password.value === "" ||
      confirmPassword.value === ""
    ) {
      showMessage("Please fill out all fields.", "error");

      if (username.value === "") {
        username.focus();
        username.classList.add("error");
      } else if (email.value === "") {
        email.focus();
        email.classList.add("error");
      } else if (password.value === "") {
        password.focus();
        password.classList.add("error");
      } else if (confirmPassword.value === "") {
        confirmPassword.focus();
        confirmPassword.classList.add("error");
      }
      return;
    }

    if (password.value !== confirmPassword.value) {
      showMessage("Passwords do not match!", "error");
      password.focus();
      password.classList.add("error");
      confirmPassword.classList.add("error");
      return;
    }

    const data = JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value,
    });

    fetch("http://localhost:9090/justvibe-backend/users/insert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
    })
      .then((response) => response.text())
      .then((res) => {
        const resData = res.split("::");
        if (resData[0] === "200") {
          showMessage("Registration successful! Please login.", "success");
          setIsRegistering(false);
          clearBorders();
          // Clear form fields
          username.value = "";
          email.value = "";
          password.value = "";
          confirmPassword.value = "";
        } else {
          showMessage(resData[1] || "Registration failed", "error");
        }
      })
      .catch((error) => {
        showMessage("An error occurred. Please try again.", "error");
        console.error("Error:", error);
      });
  };

  const signIn = () => {
    const email = document.getElementById("logininput");
    const password = document.getElementById("loginPass");

    clearBorders();
    clearMessage();

    if (email.value === "" || password.value === "") {
      showMessage("Please enter both email and password.", "error");

      if (email.value === "") {
        email.focus();
        email.classList.add("error");
      } else {
        password.focus();
        password.classList.add("error");
      }
      return;
    }

    const data = JSON.stringify({
      email: email.value,
      password: password.value,
    });

    fetch("http://localhost:9090/justvibe-backend/users/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
    })
      .then((response) => response.text())
      .then((res) => {
        const resData = res.split("::");
        if (resData[0] === "200") {
          showMessage("Login successful!", "success");
          localStorage.setItem("token", resData[1]);
          // Get username using the token
          fetch("http://localhost:9090/justvibe-backend/users/getusername", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ csrid: resData[1] }),
          })
            .then((response) => response.text())
            .then((username) => {
              localStorage.setItem("username", username);
              setTimeout(() => {
                window.location.replace("/");
              }, 1000);
            });
        } else {
          showMessage(resData[1] || "Invalid credentials", "error");
        }
      })
      .catch((error) => {
        showMessage("An error occurred during login.", "error");
        console.error("Error:", error);
      });
  };

  return (
    <div className='login-wrapper'>
      <form onSubmit={handleSubmit}>
        <FaSignOutAlt className='logout-icon' onClick={handleLogout} />
        <h1>{isRegistering ? 'Sign Up' : 'Login'}</h1>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {!isRegistering && (
          <div className='field'>
            <input className='inp' type='text' id='logininput' required autoComplete='off' />
            <label className='label' htmlFor='logininput'>Email</label>
            <FaEnvelope className='icon' />
          </div>
        )}

        {isRegistering && (
          <div className='field'>
            <input className='inp' type='text' id='username' required autoComplete='off' />
            <label className='label' htmlFor='username'>Username</label>
            <FaUser className='icon' />
          </div>
        )}

        {isRegistering && (
          <div className='field'>
            <input className='inp' type='email' id='email' required autoComplete='off' />
            <label className='label' htmlFor='email'>Email</label>
            <FaEnvelope className='icon' />
          </div>
        )}

        {!isRegistering && (
          <div className='field'>
            <input className='inpass' type={showPassword ? 'text' : 'password'} id='loginPass' required />
            <label className='label' htmlFor='loginPass'>Password</label>
            <FaLock className='icon' />
            {showPassword ? (
              <FaEyeSlash className='eye-icon' onClick={() => setShowPassword(false)} />
            ) : (
              <FaEye className='eye-icon' onClick={() => setShowPassword(true)} />
            )}
          </div>
        )}

        {isRegistering && (
          <div className='field'>
            <input className='inpass' type={showSignupPassword ? 'text' : 'password'} id='signup-password' required />
            <label className='label' htmlFor='signup-password'>Password</label>
            <FaLock className='icon' />
            {showSignupPassword ? (
              <FaEyeSlash className='eye-icon' onClick={() => setShowSignupPassword(false)} />
            ) : (
              <FaEye className='eye-icon' onClick={() => setShowSignupPassword(true)} />
            )}
          </div>
        )}

        {isRegistering && (
          <div className='field'>
            <input className='inpass' type={showConfirmPassword ? 'text' : 'password'} id='confirm-password' required />
            <label className='label' htmlFor='confirm-password'>Confirm Password</label>
            <FaLock className='icon' />
            {showConfirmPassword ? (
              <FaEyeSlash className='eye-icon' onClick={() => setShowConfirmPassword(false)} />
            ) : (
              <FaEye className='eye-icon' onClick={() => setShowConfirmPassword(true)} />
            )}
          </div>
        )}

        {!isRegistering && (
          <button type='submit' className='login-button'>LOGIN</button>
        )}

        {isRegistering && (
          <button type='submit' className='login-button'>SIGNUP</button>
        )}

        <div className='register-link'>
          <p>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <a href='#' onClick={toggleRegister}>
              {isRegistering ? 'Login' : 'Register'}
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
