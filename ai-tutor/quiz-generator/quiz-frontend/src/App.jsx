import { useState, useRef } from "react";

function App() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState({});
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfTopic, setPdfTopic] = useState("");
  const [mode, setMode] = useState("");
  const controllerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const generateQuiz = async () => {
    try {
      setErrorMessage("");
      setLoading(true);
      controllerRef.current = new AbortController();
      const response = await fetch(
        "http://127.0.0.1:8000/generate-quiz",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
          }),
          signal: controllerRef.current.signal,
        }
      );

      const data = await response.json();

      if (data.questions) {
        setErrorMessage("");
        setQuiz(data.questions);
        setAnswered({});
        setScore(0);
        setCompleted(false);
      } else {
        setErrorMessage(
  "Quiz generation failed. Please try again."
);
setTimeout(() => {
    setErrorMessage("");
  }, 5000);
      }
    } catch (error) {
       if (error.name === "AbortError") {
    console.log("Request cancelled");
    return;
  }

     console.error(error);
     setErrorMessage(
  "Unable to connect to the server. Please try again."
);
setTimeout(() => {
  setErrorMessage("");
}, 5000);
    } 
    finally {
      setLoading(false);
    }
  };

  const generatePdfQuiz = async () => {
    setErrorMessage("");
  if (!file) {
    setErrorMessage("Please select a PDF file.");
    return;
  }
  if (!pdfTopic.trim()) {
  setErrorMessage("Please enter a topic from the PDF.");
  return;
}

  try {
    setLoading(true);
    controllerRef.current = new AbortController();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic", pdfTopic);

    const response = await fetch(
      "http://127.0.0.1:8000/generate-pdf-quiz",
      {
        method: "POST",
        body: formData,
        signal: controllerRef.current.signal,
      }
    );

    const data = await response.json();

    if (data.questions) {
      setErrorMessage("");
      setQuiz(data.questions);
      setAnswered({});
      setScore(0);
      setCompleted(false);
    } else {
      setErrorMessage(
    data.error || "Failed to generate quiz from PDF."
  );
  setTimeout(() => {
  setErrorMessage("");
}, 5000);
      console.log(data);
    }
  } catch (error) {
     if (error.name === "AbortError") {
    console.log("Request cancelled");
    return;
  }
    console.error(error);
    setErrorMessage(
  "Unable to connect to the server. Please try again."
);
setTimeout(() => {
  setErrorMessage("");
}, 5000);
  } 
  finally {
    setLoading(false);
  }
};

  const checkAnswer = (index, selected, correct) => {
    if (answered[index]) return;

    const isCorrect = selected === correct;

    const updated = {
      ...answered,
      [index]: {
        selected,
        isCorrect,
      },
    };

    setAnswered(updated);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

  };

  const percentage =
    quiz.length > 0
      ? ((score / quiz.length) * 100).toFixed(0)
      : 0;

  let performance = "";

  if (percentage >= 80) {
    performance = "Excellent ";
  } else if (percentage >= 60) {
    performance = "Good ";
  } else if (percentage >= 40) {
    performance = "Average ";
  } else {
    performance = "Needs Improvement ";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f9",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "20px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        }}
      >
        <h1
  style={{
    textAlign: "center",
    color: "black",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "bold",
  }}
>
  AI Quiz Generator
</h1>

{mode === "" && (
  <div style={{ textAlign: "center" }}>
    <h2 style={{ color: "navy" }}>
      Choose Quiz Type
    </h2>

    <button
      onClick={() => setMode("topic")}
      style={{
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#4c7faf",
        color: "white",
        fontWeight: "bold",
        marginBottom: "15px",
      }}
    >
      Topic Based Quiz
    </button>

    <button
      onClick={() => setMode("pdf")}
      style={{
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#4c7faf",
        color: "white",
        fontWeight: "bold",
      }}
    >
      PDF Based Quiz
    </button>
  </div>
)}

{mode === "topic" && (
  <>
    <button
  onClick={() => {

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setErrorMessage("");
    setLoading(false);
    setQuiz([]);
    setAnswered({});
    setScore(0);
    setCompleted(false);
    setTopic("");
    setPdfTopic("");
    setFile(null);
    setMode("");
  }}
  style={{
    padding: "10px 15px",
    marginBottom: "15px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: "#4c7faf",
    color: "white",
    fontWeight: "bold",
  }}
>
  ← Back
</button>

    <input
      type="text"
      placeholder="Enter Topic"
      value={topic}
      onChange={(e) => setTopic(e.target.value)}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #ccc",
        marginBottom: "15px",
        fontSize: "16px",
        backgroundColor: "#c8d7d8",
        fontWeight: "bold",
        color: "black",
      }}
    />

    <button
      onClick={generateQuiz}
      disabled={loading || !topic}
      style={{
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: loading
          ? "#84aed6"
          : "#4c7faf",
        color: "white",
        fontWeight: "bold",
      }}
    >
      {loading
        ? " Generating Quiz..."
        : "Generate Quiz"}
    </button>
  </>
)}
{errorMessage && (
  <div
    style={{
      marginTop: "15px",
      padding: "12px",
      backgroundColor: "#ffe5e5",
      color: "#b00020",
      border: "1px solid #ffb3b3",
      borderRadius: "10px",
      fontWeight: "bold",
    }}
  >
    ⚠️ {errorMessage}
  </div>
)}
{mode === "pdf" && (
  <>
   <button
  onClick={() => {

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    setErrorMessage("");
    setLoading(false);
    setQuiz([]);
    setAnswered({});
    setScore(0);
    setCompleted(false);
    setTopic("");
    setPdfTopic("");
    setFile(null);
    setMode("");
  }}
  style={{
    padding: "10px 15px",
    marginBottom: "15px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: "#4c7faf",
    color: "white",
    fontWeight: "bold",
  }}
>
  ← Back
</button>

    <div style={{ marginBottom: "15px" }}>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) =>
          setFile(e.target.files[0])
        }
      />
    </div>
    <input
  type="text"
  placeholder="Enter Topic From PDF"
  value={pdfTopic}
  onChange={(e) => setPdfTopic(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    marginBottom: "15px",
    fontSize: "16px",
    backgroundColor:"#c8d7d8",
    fontWeight:"bold",
    color:"black"
  }}
/>

    <button
      onClick={generatePdfQuiz}
      disabled={loading || !file || !pdfTopic}
      style={{
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: loading
          ? "#84aed6"
          : "#4c7faf",
        color: "white",
        fontWeight: "bold",
      }}
    >
      {loading
        ? " Generating Quiz..."
        : "Generate Quiz From PDF"}
    </button>
  </>
)}

        {!completed && quiz.length > 0 && (
          <>
            <hr style={{ marginTop: "25px" }} />

            <h3 style={{color:"navy"}}>
              Score: {score}/{quiz.length}
            </h3>

            <h3 style={{color:"navy"}}>
              Progress: {Object.keys(answered).length}/
              {quiz.length}
            </h3>

            {quiz.map((q, index) => (
              <div
                key={index}
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  borderRadius: "15px",
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #ddd",
                }}
              >
                <h3 style={{color:"navy"}}>
                  Q{index + 1}. {q.question}
                </h3>

                {q.options.map((option, i) => (
                  <button
                    key={i}
                    disabled={answered[index]}
                    onClick={() =>
                      checkAnswer(
                        index,
                        option,
                        q.answer
                      )
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      marginBottom: "10px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      cursor: answered[index]
                        ? "not-allowed"
                        : "pointer",
                      backgroundColor:"#4c7faf",
                      fontSize:"large"

                    }}
                  >
                    {option}
                  </button>
                ))}

                {answered[index] && (
                  <p
                    style={{
                      color: answered[index]
                        .isCorrect
                        ? "green"
                        : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {answered[index].isCorrect
                      ? "✅ Correct"
                      : `❌ Wrong (Correct Answer: ${q.answer})`}
                  </p>
                )}
              </div>
            ))}
          </>
        )}
        {quiz.length > 0 &&
 Object.keys(answered).length === quiz.length &&
 !completed && (
  <div
    style={{
      textAlign: "center",
      marginTop: "20px",
    }}
  >
    <button
      onClick={() => setCompleted(true)}
      style={{
        padding: "12px 20px",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        backgroundColor: "#2196F3",
        color: "white",
        fontWeight: "bold",
        }}
      >
        Track Performance
       </button>
       </div>
     )}
        {completed && (
          <div
            style={{
              marginTop: "30px",
              textAlign: "center",
              
            }}
          >
            <h2 style={{color:"green",
            fontWeight:"bold"
            }}> Quiz Completed</h2>

            <h2 style={{color:"navy"}}>
              Score: {score}/{quiz.length}
            </h2>

            <h2 style={{color:"navy"}}>Percentage: {percentage}%</h2>

            <h2 style={{color:"navy"}}>Performance: {performance}</h2>

            <button
              onClick={() => {
                if (mode === "topic") {
                    generateQuiz();
                } else if (mode === "pdf") {
                  generatePdfQuiz();
                }
              }}
              style={{
                padding: "12px 20px",
                marginRight: "10px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                backgroundColor: "#2196F3",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Continue Practice
            </button>

            <button
              onClick={() => {
                 if (controllerRef.current) {
                   controllerRef.current.abort();
                 }

                setQuiz([]);
                setAnswered({});
                setScore(0);
                setCompleted(false);
                setTopic("");
                setPdfTopic("");
                setFile(null);
                setErrorMessage("");
                setMode("");
              }}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                backgroundColor: "#f44336",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;