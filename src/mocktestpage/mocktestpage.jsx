import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./mocktestpage.css";
import { pb } from "../Pocketbase"; // Import your PocketBase instance
import '../loading.css';

const MockTestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    id: null,
    qtext: "",
    opt1: "",
    opt2: "",
    opt3: "",
    ans: "",
    qimage: null,
  });
  const [qimagePreview, setQimagePreview] = useState(null);

  const navigate = useNavigate(); // Define navigate

  useEffect(() => {
    pb.autoCancellation(false); // Disable auto cancellation

    const fetchQuestions = async () => {
      try {
        const records = await pb.collection("Questions").getFullList({
          sort: "-created",
        });
        const formattedQuestions = records.map((record) => ({
          id: record.id,
          qtext: record.qtext,
          opt1: record.opt1,
          opt2: record.opt2,
          opt3: record.opt3,
          ans: record.ans,
          qimage: record.qimage ? record.qimage : null,
        }));
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to load questions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion({ ...newQuestion, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file instanceof File) {
      setNewQuestion({ ...newQuestion, qimage: file });
      setQimagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddQuestion = async () => {
    if (
      newQuestion.qtext &&
      newQuestion.opt1 &&
      newQuestion.opt2 &&
      newQuestion.opt3 &&
      newQuestion.ans
    ) {
      try {
        const record = await pb.collection("Questions").create({
          ...newQuestion,
          qimage: newQuestion.qimage || null,
        });
        setQuestions((prevQuestions) => [
          ...prevQuestions,
          { ...newQuestion, id: record.id },
        ]);
        resetForm();
      } catch (error) {
        console.error("Error adding question:", error);
        alert("Failed to add question. Please try again.");
      }
    }
  };

  const handleEditQuestion = (question) => {
    setNewQuestion(question);

    if (question.qimage && typeof question.qimage === "string") {
      setQimagePreview(
        `https://virtualdrive.pockethost.io/api/files/519p4uxo8ox96vm/${question.id}/${question.qimage}`
      );
    } else if (question.qimage instanceof File) {
      setQimagePreview(URL.createObjectURL(question.qimage));
    } else {
      setQimagePreview(null);
    }
  };

  const handleUpdateQuestion = async () => {
    if (
      newQuestion.qtext &&
      newQuestion.opt1 &&
      newQuestion.opt2 &&
      newQuestion.opt3 &&
      newQuestion.ans
    ) {
      try {
        const formData = new FormData();
        formData.append("qtext", newQuestion.qtext);
        formData.append("opt1", newQuestion.opt1);
        formData.append("opt2", newQuestion.opt2);
        formData.append("opt3", newQuestion.opt3);
        formData.append("ans", newQuestion.ans);
        if (newQuestion.qimage instanceof File) {
          formData.append("qimage", newQuestion.qimage);
        }

        await pb.collection("Questions").update(newQuestion.id, formData);
        setQuestions(
          questions.map((q) => (q.id === newQuestion.id ? newQuestion : q))
        );
        resetForm();
      } catch (error) {
        console.error("Error updating question:", error);
        alert("Failed to update question. Please try again.");
      }
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await pb.collection("Questions").delete(id);
      setQuestions(questions.filter((question) => question.id !== id));
    } catch (error) {
      console.error(`Error deleting question with ID ${id}:`, error);
      alert("Failed to delete question. Please try again later.");
    }
  };

  const resetForm = () => {
    setNewQuestion({
      id: null,
      qtext: "",
      opt1: "",
      opt2: "",
      opt3: "",
      ans: "",
      qimage: null,
    });
    setQimagePreview(null);
  };

  useEffect(() => {
    return () => {
      if (qimagePreview) {
        URL.revokeObjectURL(qimagePreview);
      }
    };
  }, [qimagePreview]);

  if (loading) {
    return <div className="loader"></div>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="mocktestpage-body">
      <div className="mocktestpage-container">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate('/admindash')}>
          &larr; Back
        </button>
        <h1 className="mocktestpage-title">Mock Test Questions</h1>
        <div className="mocktestpage-form">
          <input
            type="text"
            name="qtext"
            placeholder="Enter Question"
            value={newQuestion.qtext}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="opt1"
            placeholder="Option 1"
            value={newQuestion.opt1}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="opt2"
            placeholder="Option 2"
            value={newQuestion.opt2}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="opt3"
            placeholder="Option 3"
            value={newQuestion.opt3}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="ans"
            placeholder="Correct Answer (1, 2 or 3)"
            value={newQuestion.ans}
            onChange={handleChange}
            required
          />
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {qimagePreview && (
            <div className="qimage-preview">
              <h3>Image Preview:</h3>
              <img
                src={qimagePreview}
                alt="Preview"
                style={{ maxWidth: "100%", borderRadius: "10px" }}
              />
            </div>
          )}
          {newQuestion.id ? (
            <button
              className="mocktestpage-btn-update"
              onClick={handleUpdateQuestion}
            >
              Update Question
            </button>
          ) : (
            <button
              className="mocktestpage-btn-add"
              onClick={handleAddQuestion}
            >
              Add Question
            </button>
          )}
        </div>
        <div className="mocktestpage-questions-list">
          <h2>Existing Questions</h2>
          {questions.length === 0 ? (
            <p className="no-questions-message">No questions available.</p>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="mocktestpage-question-item">
                <p>
                  <strong>Question:</strong> {question.qtext}
                </p>
                <p>
                  <strong>Options:</strong>
                </p>
                <div>1 - {question.opt1}</div>
                <div>2 - {question.opt2}</div>
                <div>3 - {question.opt3}</div>
                <p>
                  <strong>Correct Answer:</strong> {question.ans}
                </p>
                {question.qimage && (
                  <div className="qimage-preview">
                    <h3>Image:</h3>
                    <img
                      src={`https://virtualdrive.pockethost.io/api/files/519p4uxo8ox96vm/${question.id}/${question.qimage}`}
                      alt="Question"
                      style={{ maxWidth: "100%", borderRadius: "10px" }}
                    />
                  </div>
                )}
                <button
                  className="mocktestpage-btn-edit"
                  onClick={() => handleEditQuestion(question)}
                >
                  Edit
                </button>
                <button
                  className="mocktestpage-btn-delete"
                  onClick={() => handleDeleteQuestion(question.id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MockTestPage;
