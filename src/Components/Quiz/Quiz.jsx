import React, { useState, useEffect, useRef } from "react";
import "./Quizz.css";
import { pb } from "../../Pocketbase";
import { useNavigate } from "react-router-dom";
const Quiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState({});
  const [lock, setLock] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(false);
  const [timer, setTimer] = useState(30);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [testId, setTestId] = useState(1); // Initialize testId
  const Option1 = useRef(null);
  const Option2 = useRef(null);
  const Option3 = useRef(null);
  const option_array = [Option1, Option2, Option3];
  const navigate = useNavigate();
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preloadImage = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageUrl;
      img.onload = resolve;
    });
  };
  const [hasSaved, setHasSaved] = useState(false);

  // Fetch questions from PocketBase
  async function fetchQuestions() {
    try {
      const records = await pb.collection("Questions").getFullList({
        sort: "-created",
      });
      const questions = records.map((record) => ({
        id: record.id,
        qtext: record.qtext,
        options: [record.opt1, record.opt2, record.opt3],
        answer: parseInt(record.ans, 10),
        image: record.qimage ? record.qimage : null,
      }));
      return questions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      return [];
    }
  }

  // Fetch previous test count for the logged-in users
  const fetchTestCount = async (userId) => {
    try {
      const results = await pb.collection("results").getFullList({
        filter: `user = "${userId}"`, // Filter results by the user ID
      });
      return results.length; // Count of previous tests taken
    } catch (error) {
      console.error("Error fetching test count:", error);
      return 0; // Return 0 if there's an error
    }
  };

  // Fetch and set questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      const questions = await fetchQuestions();
      const randomQuestions = getRandomQuestions(questions);
      setQuizData(randomQuestions);
      if (randomQuestions.length > 0) {
        setQuestion(randomQuestions[0]);
      }
    };
    loadQuestions();
  }, []);

  // Get 5 random questions from the fetched list
  const getRandomQuestions = (questions) => {
    return questions.sort(() => 0.5 - Math.random()).slice(0, 20);
  };

  // Check the selected answer
  const checkAns = (e, selectedOption) => {
    setSelectedOption(selectedOption);
    option_array.forEach((option, idx) => {
      if (option.current) {
        option.current.classList.remove("wrong", "correct");
        if (idx + 1 === selectedOption) {
          option.current.classList.add(
            selectedOption === question.answer ? "correct" : "wrong"
          );
        }
      }
    });
  };

  // Move to the next question
  const next = async () => {
    if (isNextDisabled) return; // Prevent double clicks
    setIsNextDisabled(true);

    if (selectedOption === question.answer) {
      setScore((prev) => prev + 1);
    }

    if (index < quizData.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Delay for animations

      setIndex((prevIndex) => prevIndex + 1);
      setQuestion(quizData[index + 1]);
      setSelectedOption(null);
      setTimer(30);

      option_array.forEach((option) => {
        if (option.current) {
          option.current.classList.remove("wrong", "correct");
        }
      });
    } else {
      setResult(true);
    }
    setIsNextDisabled(false);
  };

  // Reset the quiz
  const resetQuiz = () => {
    setIndex(0);
    setScore(0);
    setLock(false);
    setResult(false);
    setTimer(30);
    setHasStarted(false);
    setTestId(1); // Reset testId for a new user or session
    const loadQuestions = async () => {
      const questions = await fetchQuestions();
      const randomQuestions = getRandomQuestions(questions);
      setQuizData(randomQuestions);
      if (randomQuestions.length > 0) {
        setQuestion(randomQuestions[0]);
      }
    };
    loadQuestions();
  };

  // Start the quiz
  const startQuiz = async () => {
    setIsLoading(true);
    const currentUser = pb.authStore.model;

    if (!currentUser) {
      console.error("No user is logged in!");
      return;
    }

    // Fetch the count of previous tests
    const count = await fetchTestCount(currentUser.id);
    setTestId(count + 1); // Set testId to count + 1

    // Delay before starting the quiz
    await new Promise((resolve) => setTimeout(resolve, 800)); // 1-second delay before starting the quiz

    setHasStarted(true); // Set quiz as started after the delay
    setIsLoading(false);
  };

  const exitQuiz = () => {
    setHasStarted(false);
    setIndex(0);
    setScore(0);
    setResult(false);
    setTimer(30);
    navigate("/mocktest");
  };

  // Timer effect
  useEffect(() => {
    let timerId;
    if (hasStarted && !result && timer > 0) {
      timerId = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      next();
    }
    return () => clearInterval(timerId);
  }, [hasStarted, result, timer]);

  // Save results function
  const saveResults = async (event) => {
    event.preventDefault();

    if (hasSaved) return; // Prevent multiple calls

    setHasSaved(true); // Set flag to true to block further clicks
    const currentUser = pb.authStore.model;

    if (!currentUser) {
      console.error("No user is logged in!");
      setHasSaved(false); // Allow retry if user is not logged in
      return;
    }

    const data = {
      score,
      user: currentUser.id,
      testId,
    };

    try {
      await pb.collection("results").create(data);
      setShowSuccess(true);
      navigate("/result");
    } catch (error) {
      console.error("Error saving user details:", error);
      setHasSaved(false); // Allow retry if there's an error
    }
  };

  return (
    <body className="boody">
      <div className="contain">
        <h1>Learners Test</h1>

        {!hasStarted ? (
          <>
            <div className="instructions">
              <h2>Instructions</h2>
              <p>- You have 30 seconds for each question.</p>
              <p>- All questions are compulsory.</p>
              <p>
                - If you don't answer within 30 seconds, it will move to the
                next question.
              </p>
              <p>- You can't go back to previous questions.</p>
              <p>
                - Your final score will be displayed at the end of the quiz.
              </p>
              <button className="start-button" onClick={startQuiz}>
                {isLoading ? "Test is loading..." : "Start Quiz"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="progress-bar">
              <div
                style={{ width: `${(index / quizData.length) * 100}%` }}
              ></div>
            </div>
            <div className="attempted-questions">
              Attempted: {index + 1} / {quizData.length}
            </div>
            <hr />
            {result ? (
              <>
                <h2>
                  You Scored {score} out of {quizData.length}
                </h2>
                <button
                  className="next-button"
                  onClick={saveResults}
                  disabled={hasSaved}
                >
                  {hasSaved ? "Saving..." : "Save Results"}
                </button>
                {showSuccess && <p>Results saved successfully!</p>}{" "}
                {/* Show success message */}
                <button className="next-button" onClick={resetQuiz}>
                  Restart
                </button>
              </>
            ) : (
              <>
                <h2>
                  {index + 1}. {question.qtext}
                </h2>
                {question.image && (
                  <img
                    src={`https://virtualdrive.pockethost.io/api/files/519p4uxo8ox96vm/${question.id}/${question.image}`}
                    alt="Question"
                    className="question-image"
                  />
                )}
                <ul>
                  <li ref={Option1} onClick={(e) => checkAns(e, 1)}>
                    {question.options && question.options[0]}
                  </li>
                  <li ref={Option2} onClick={(e) => checkAns(e, 2)}>
                    {question.options && question.options[1]}
                  </li>
                  <li ref={Option3} onClick={(e) => checkAns(e, 3)}>
                    {question.options && question.options[2]}
                  </li>
                </ul>
                <button
                  className={`next-button ${selectedOption ? "" : "disabled"}`}
                  onClick={next}
                  disabled={!selectedOption || isNextDisabled}
                >
                  Next
                </button>

                {/* <button className="exit-button" onClick={exitQuiz}>Exit</button> */}

                <div className="timer">Time remaining: {timer} seconds</div>
              </>
            )}
          </>
        )}
      </div>
    </body>
  );
};

export default Quiz;
