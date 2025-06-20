import React, { useState } from 'react';
import './AboutUs.css';
import Navbar from '../tools/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faHandsHelping, faLightbulb } from '@fortawesome/free-solid-svg-icons';

function AboutUs() {
    // State to handle success or error message
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setShowSuccess(false);
        setShowError(false);

        let email = event.target.email.value;
        email = email.toLowerCase();  // Convert the email to lowercase

        // Modify the form data with the normalized email
        const formData = new FormData(event.target);
        formData.set('email', email);  // Update the email field to lowercase

        // Append API access key
        formData.append("access_key", "82151e31-45dc-440c-aba6-1670be870d86");

        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        try {
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: json
            }).then((res) => res.json());

            if (res.success) {
                setShowSuccess(true);
                setShowError(false);
                console.log("Success", res);
                // Optionally, you can reset the form here:
                event.target.reset();
            } else {
                setShowError(true);
                console.log("Submission failed", res);
            }
        } catch (error) {
            setShowError(true);
            console.error("Error submitting the form", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format regex
        return emailRegex.test(email);
    };

    return (
        <div className="about-us-container">
            <Navbar />
            <h1 className="about-us-title">About Us</h1>

            {/* Mission Section */}
            <div className="section">
                <h2 className="section-title"><FontAwesomeIcon icon={faBullseye} /> Our Mission</h2>
                <div className="paragraph-container">
                    <p>
                        We aim to revolutionize driver education through cutting-edge Virtual Reality (VR) technology. Our mission is to provide a comprehensive and immersive learning experience that enhances driving skills and safety.
                    </p>
                </div>
            </div>

            {/* Values Section */}
            <div className="section">
                <h2 className="section-title"><FontAwesomeIcon icon={faHandsHelping} /> Our Values</h2>
                <div className="paragraph-container">
                    <p><strong>1. Innovation:</strong> Leveraging VR technology to create a unique and effective learning environment.</p>
                </div>
                <div className="paragraph-container">
                    <p><strong>2. Safety:</strong> Prioritizing the safety of our students with realistic and risk-free training scenarios.</p>
                </div>
                <div className="paragraph-container">
                    <p><strong>3. Education:</strong> Delivering top-notch driving education and practical skills that prepare students for real-world driving.</p>
                </div>
                <div className="paragraph-container">
                    <p><strong>4. Customer Focus:</strong> Tailoring our approach to meet the needs and goals of each student.</p>
                </div>
            </div>

            {/* Vision Section */}
            <div className="section">
                <h2 className="section-title"><FontAwesomeIcon icon={faLightbulb} /> Our Vision</h2>
                <div className="paragraph-container">
                    <p>We envision a future where VR technology is an integral part of driver education worldwide. Our goal is to set a new standard in how driving skills are taught, making learning more engaging, effective, and accessible to everyone.</p>
                </div>
            </div>

            {/* Contact Us Section */}
            <div className="section contact-us" id="contact-us">
                <h2 className="section-title">Contact Us</h2>
                <div className="contact-info">
                    <div className="paragraph-container">
                        <p><i className="fas fa-phone"></i> Phone: (+91) 9847150666</p>
                    </div>
                    <div className="paragraph-container">
                        <p><i className="fas fa-envelope"></i> Email: officialvirtualdrive@gmail.com</p>
                    </div>
                </div>

                {/* Message Form */}
                <div className="message-container">
                    <form autoComplete="off" onSubmit={onSubmit}>
                        <input 
                            type="text" 
                            placeholder="Name" 
                            required 
                            name="name" 
                        />
                        <input 
                            type="email" 
                            placeholder="Email" 
                            required 
                            name="email"
                        />
                        <textarea 
                            placeholder="Message" 
                            required 
                            name="message"
                        />
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Sending message..." : "Send Message"}
                        </button>
                    </form>
                    {/* Show success or error message */}
                    {showSuccess && <p className="success-message">Your message has been sent!</p>}
                    {showError && <p className="error-message">There was an error submitting your message. Please try again.</p>}
                </div>
            </div>
        </div>
    );
}

export default AboutUs;
