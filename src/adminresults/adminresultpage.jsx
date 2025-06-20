import React, { useState, useEffect } from "react";
import { pb } from "../Pocketbase";
import { useNavigate } from "react-router-dom";
import "./adminresults.css";

const AdminResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    pb.autoCancellation(false);

    const fetchResults = async () => {
      try {
        const records = await pb.collection("results").getFullList({
          sort: "-created",
          expand: "user",
        });
        setResults(records);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return <div className="loader"></div>;
  }

  if (error) {
    return <p className="admin-error">{error}</p>;
  }

  // Filter results based on the search term
  const filteredResults = results.filter((result) =>
    result.expand?.user?.username
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="results-container">
      <button className="back-button" onClick={() => navigate("/admindash")}>
        &larr; Back
      </button>
      <h1 className="results-title">Admin Results Page</h1>

      {filteredResults.length > 0 ? (
        <table className="results-table">
          <thead>
            <tr>
              <th className="username-admin">

                {/* New search input design */}
                <div className="containero">
                  <input
                    type="text"
                    name="text"
                    className="input"
                    required
                    placeholder="search username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="ionicon"
                      viewBox="0 0 512 512"
                    >
                      <title>Search</title>
                      <path
                        d="M221.09 64a157.09 157.09 0 10157.09 157.09A157.1 157.1 0 00221.09 64z"
                        fill="none"
                        stroke="currentColor"
                        strokeMiterlimit="10"
                        strokeWidth="32"
                      ></path>
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeMiterlimit="10"
                        strokeWidth="32"
                        d="M338.29 338.29L448 448"
                      ></path>
                    </svg>
                  </div>
                </div>
                <span className="userba">Username</span>
              </th>
              <th>Score</th>
              <th>Test ID</th>
              <th>Test Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <tr key={result.id}>
                <td>{result.expand?.user?.username || "Unknown User"}</td>
                <td>{result.score}</td>
                <td>{result.testId}</td>
                <td>{new Date(result.created).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No results available.</p>
      )}
    </div>
  );
};

export default AdminResultsPage;
