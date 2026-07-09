import { useState, useEffect } from "react";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import "./ChatInput.css";

function ChatInput({
  sendQuestion,
  disabled,
  placeholder = "Ask anything about your notes...",
}) {
  const [question, setQuestion] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Update textbox while speaking
  useEffect(() => {
    setQuestion(transcript);
  }, [transcript]);

  function submit() {
  const finalQuestion = transcript.trim() || question.trim();

  if (disabled) return;

  if (!finalQuestion) return;

  sendQuestion(finalQuestion);

  setQuestion("");
  resetTranscript();
}

  function handleMic() {
    if (!browserSupportsSpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({
        continuous: false,
        language: "en-US",
      });
    }
  }

  return (
    <div className="chat-input-container">
      <div className="chat-input">

        <textarea
          rows={1}
          value={question || transcript}
          disabled={disabled}
          placeholder={
            listening
              ? "🎤 Listening..."
              : placeholder
          }
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />

        <button
          className={`mic-btn ${listening ? "listening" : ""}`}
          disabled={disabled}
          onClick={handleMic}
        >
          <FaMicrophone />
        </button>

        <button
          className="send-btn"
          disabled={disabled}
          onClick={submit}
        >
          <FaPaperPlane />
        </button>

      </div>
    </div>
  );
}

export default ChatInput;