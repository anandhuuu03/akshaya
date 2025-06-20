import React from 'react';
import './SimulationPage.css'; // Import your external stylesheet
import Navbar from '../tools/navigation';

// Import the images from your local project
import img1 from '../assets/1.jpg';
import img2 from '../assets/2.jpg';
import img4 from '../assets/4.jpg';
import img11 from '../assets/11.jpg';

// Import the background image
import backgroundImage from '../assets/s2.avif'; // Update the path as necessary

const Simulation = () => {
  return (
    <>
      <Navbar />
      <div 
        className="page-container" 
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Centered Simulation Heading */}
        <div className="simulation-heading-container">
          <h1 className="simulation-heading">Simulation</h1>
        </div>

        {/* Main Content Section */}
        <main>
          <section className="features-section">
            {/* Feature 1: Uses */}
            <div className="feature">
              <div className="feature-content">
                <img src={img11} alt="Uses" className="feature-image" />
                <h3>Uses</h3>
                <ul>
                  <li>Provides a realistic virtual driving experience.</li>
                  <li>Allows safe practice of driving skills from home.</li>
                  <li>Simulates various driving scenarios like traffic and weather conditions.</li>
                  <li>Helps users learn road signs and traffic rules interactively.</li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Merits */}
            <div className="feature">
              <div className="feature-content">
                <img src={img2} alt="Merits" className="feature-image" />
                <h3>Merits</h3>
                <ul>
                  <li>Accessible anytime, providing learning flexibility.</li>
                  <li>Offers a safe environment to practice without risks.</li>
                  <li>Tracks progress through performance analytics.</li>
                  <li>Engages users with an immersive learning experience.</li>
                </ul>
              </div>
            </div>

            {/* Feature 3: What we provide */}
            <div className="feature">
              <div className="feature-content">
                <img src={img1} alt="What we provide" className="feature-image" />
                <h3>What we provide</h3>
                <ul>
                  <li>VR-based car driving simulator for practical learning.</li>
                  <li>Comprehensive knowledge base on traffic rules and regulations.</li>
                  <li>Mock tests to evaluate and enhance theoretical knowledge.</li>
                  <li>Controller integration for enhanced simulation interactivity.</li>
                </ul>
              </div>
            </div>

            {/* Feature 4: About our App */}
            <div className="feature">
              <div className="feature-content">
                <img src={img4} alt="VR Control Guide" className="feature-image" />
                <h3>VR Control Guide</h3>
                <ul>
                  <li><strong>Start/Pause Game:</strong> Press X to start or pause the game.</li>
                  <li><strong>Main Menu:</strong> Press B to return to the main menu while paused.</li>
                  <li><strong>Quit Game:</strong> Press A to exit the current session.</li>
                  <li><strong>Brake:</strong> Press RB to apply the brake.</li>
                  <li><strong>Movement:</strong> Use the Left Axis to steer and control vehicle movement.</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Simulation;
