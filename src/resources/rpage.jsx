import React, { useRef, useState } from 'react';
import './resource.css';
import Navbar from '../tools/navigation';
import roadsignIcon from '../assets/roadsign.png';
import rulesIcon from '../assets/rules.png';
import speedIcon from '../assets/speed.png';
import webinarIcon from '../assets/webinar.png';
import trafficSignsPDF from '../assets/Traffic signs.pdf';
import rulesPDF from '../assets/kerala rules.pdf';

const videoIDs = {
    tips: 'n4jYnWi-HF8',
    dosanddonts: 'J-073AaTXQc',
    drivingCar: 'VIVaqt4VhKc'
};

const Resources = () => {
    const [selectedVideo, setSelectedVideo] = useState(null); 
    const trafficSignalsRef = useRef(null);
    const trafficRulesRef = useRef(null);
    const drivingTutorialsRef = useRef(null);
    const speedLimitRef = useRef(null);

    const resources = [
        {
            id: 'traffic-signals',
            title: 'Traffic Signals',
            ref: trafficSignalsRef,
            icon: roadsignIcon,
            content: (
                <>
                    <p>
                        Traffic signals are essential for managing road traffic. 
                        They provide instructions to drivers and pedestrians to 
                        ensure safe and efficient movement. Familiarizing yourself 
                        with traffic signals is crucial for road safety.
                    </p>
                    <a href={trafficSignsPDF} target="_blank" rel="noopener noreferrer" className="pdf-link">
                        Open Traffic Signals 
                    </a>
                </>
            )
        },
        {
            id: 'traffic-rules',
            title: 'Traffic Rules and Regulations',
            ref: trafficRulesRef,
            icon: rulesIcon,
            content: (
                <>
                    <p>
                        Understanding traffic rules is essential for road safety. 
                        The rules cover various aspects such as speed limits, overtaking, 
                        giving way, and using indicators. Following these rules helps 
                        reduce accidents and ensures smooth traffic flow.
                    </p>
                    <a href={rulesPDF} target="_blank" rel="noopener noreferrer" className="pdf-link">
                        Open Traffic Rules 
                    </a>
                </>
            )
        },
        {
            id: 'driving-tutorials',
            title: 'Driving Tutorials',
            ref: drivingTutorialsRef,
            icon: webinarIcon,
            content: (
                <>
                    <p>Learn driving skills through these video tutorials:</p>
                    <button className="video-button" onClick={() => setSelectedVideo(videoIDs.drivingCar)}>
                         Watch how to drive a Car
                    </button>
                    <button className="video-button" onClick={() => setSelectedVideo(videoIDs.tips)}>
                        Watch Tips for New Drivers
                    </button>
                    <button className="video-button" onClick={() => setSelectedVideo(videoIDs.dosanddonts)}>
                        Watch Do's and Don'ts of driving a manual
                    </button>
                    {selectedVideo && (
                        <iframe
                            width="100%"
                            height="350"
                            src={`https://www.youtube.com/embed/${selectedVideo}`}
                            title="Driving Tutorial"
                            style={{ border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )}
                </>
            )
        },
        {
            id: 'speed-limit',
            title: 'Speed Limits',
            ref: speedLimitRef,
            icon: speedIcon,
            content: (
                <table>
                    <thead>
                        <tr>
                            <th>Class</th>
                            <th>Vehicles</th>
                            <th>Near School</th>
                            <th>In Ghat Roads</th>
                            <th>Within Corporation/Municipality limits</th>
                            <th>National Highway</th>
                            <th>State Highway</th>
                            <th>Four Lane Road</th>
                            <th>All other Places</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Motor Cycle</td>
                            <td>30</td>
                            <td>45</td>
                            <td>50</td>
                            <td>60</td>
                            <td>50</td>
                            <td>70</td>
                            <td>50</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Motor Car</td>
                            <td>30</td>
                            <td>45</td>
                            <td>50</td>
                            <td>85</td>
                            <td>80</td>
                            <td>90</td>
                            <td>70</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Motor Car</td>
                            <td>30</td>
                            <td>45</td>
                            <td>50</td>
                            <td>85</td>
                            <td>80</td>
                            <td>90</td>
                            <td>70</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>Autorickshaw</td>
                            <td>30</td>
                            <td>35</td>
                            <td>30</td>
                            <td>50</td>
                            <td>50</td>
                            <td>50</td>
                            <td>40</td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td>Light motor vehicles other than a transport vehicle</td>
                            <td>30</td>
                            <td>45</td>
                            <td>50</td>
                            <td>85</td>
                            <td>80</td>
                            <td>90</td>
                            <td>60</td>
                        </tr>
                        <tr>
                            <td>6</td>
                            <td>Light motor vehicle and a transport vehicle</td>
                            <td>30</td>
                            <td>45</td>
                            <td>50</td>
                            <td>65</td>
                            <td>65</td>
                            <td>70</td>
                            <td>60</td>
                        </tr>
                        <tr>
                            <td>7</td>
                            <td>Medium or Heavy Passenger Motor vehicle</td>
                            <td>30</td>
                            <td>40</td>
                            <td>40</td>
                            <td>65</td>
                            <td>65</td>
                            <td>70</td>
                            <td>60</td>
                        </tr>
                        <tr>
                            <td>8</td>
                            <td>Medium or Heavy goods vehicle</td>
                            <td>30</td>
                            <td>40</td>
                            <td>40</td>
                            <td>65</td>
                            <td>65</td>
                            <td>65</td>
                            <td>60</td>
                        </tr>
                    </tbody>
                </table>
            )
        },
    ];

    const showContent = (ref) => {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="main-container">
            <Navbar />
            <h1 className="page-heading">RESOURCES</h1>
            <div className="container">
                {resources.map(resource => (
                    <div
                        key={resource.id}
                        className="flashcard"
                        onClick={() => showContent(resource.ref)}
                    >
                        <img
                            src={resource.icon}
                            alt={`${resource.title} Icon`}
                            className="flashcard-icon"
                        />
                        {resource.title}
                    </div>
                ))}
            </div>

            <div id="content">
                {resources.map(resource => (
                    <div key={resource.id} className="content-section" ref={resource.ref} style={{ padding: '80px', marginTop: '50px' }}>
                        <h2>{resource.title}</h2>
                        {resource.content}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Resources;
