import React, { useEffect } from 'react';
import './navbar.css';
import { pb } from '../Pocketbase'; // Import PocketBase instance
import { useNavigate } from 'react-router-dom';

// Define the navigation links
const links = [
    { name: 'Home', href: '/home' },
    { name: 'About', href: '/aboutus' },
    { name: 'Contact', href: '/aboutus#contact-us' }, // We will handle scrolling programmatically
];

const Navbar = () => {
    const navigate = useNavigate();
    const currentUser = pb.authStore.model; // Get the current user from PocketBase authStore

    // Function to handle logout
    const handleLogout = () => {
        if (currentUser) {
            pb.authStore.clear(); // Clear the PocketBase authentication store to log out the user
            console.log('User logged out successfully');
            navigate('/'); // Redirect the user to the login page after logging out
        } else {
            console.log('No user is logged in!'); // Log if no user is logged in
        }
    };

    // Function to handle navigation to the contact section
    const handleContactClick = () => {
        navigate('/aboutus'); // Navigate to the About page
        setTimeout(() => {
            const contactSection = document.getElementById('contact-us'); // Get the contact section
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to the contact section
            }
        }, 100); // Delay to ensure the navigation is complete
    };

    // Render the navbar
    return (
        <nav className="navbar">
            <img src="/virtualLogo.png" className="virtual-Logo" alt="Virtual Drive Logo" />
            <h1 className="navbar-heading">Virtual Drive</h1>
            <ul className="navbar-bar">
                {links.map((link, index) => (
                    <li key={index} className="navbar-list-item">
                        <a 
                            href={link.href} 
                            className="navbar-link"
                            onClick={link.name === 'Contact' ? (e) => { e.preventDefault(); handleContactClick(); } : null} // Handle click for Contact
                        >
                            {link.name}
                        </a>
                    </li>
                ))}
            </ul>
            {/* Display greeting with current user's name if they are logged in */}
            {currentUser ? (
                <div className="user-greetings">
                    <span>Hi, {currentUser.username}!</span>
                </div>
            ) : (
                <span>Welcome!</span>
            )}
            {/* Add the Logout button to the top-right side */}
            {currentUser && (
                <button className="logout-button" onClick={handleLogout}>
                    Logout
                </button>
            )}
        </nav>
    );
};

export default Navbar;
