import { useState, useEffect } from "react";
import axios from "axios";
import ScrollToBottom from "react-scroll-to-bottom";

import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

import "./ChatWindow.css";

function ChatWindow({
    setSpeaking,
    mode,
    selectedSubject,
    selectedChat
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);

  // -----------------------------
  // Create a new AI chat session
  // -----------------------------
  useEffect(() => {
    async function createChat() {
      try {
        const res = await axios.post(
          "http://localhost:8000/chat/new"
        );

        setChatId(res.data.chat_id);
      } catch (err) {
        console.error("Failed to create chat", err);
      }
    }

    createChat();
  }, []);

  // -----------------------------
  // Welcome Message
  // -----------------------------
  useEffect(() => {
    if (mode === "ai") {
      setMessages([
        {
          sender: "bot",
          text:
            "👋 Welcome!\n\nI'm your AI Tutor.\n\nAsk me anything.",
        },
      ]);
    } else {
      if (selectedSubject === "") {
        setMessages([
          {
            sender: "bot",
            text:
              "📚 PDF Tutor\n\nPlease choose a subject from the left sidebar.",
          },
        ]);
      } else {
        setMessages([
          {
            sender: "bot",
            text:
              `📘 ${selectedSubject}\n\nAsk me anything from this subject.`,
          },
        ]);
      }
    }
  }, [mode, selectedSubject]);
  useEffect(() => {

    if (!selectedChat) return;

    async function loadChat() {

        try {

            const res = await axios.get(
                `http://localhost:8000/chat/${selectedChat}`
            );

            const loaded = res.data.map(msg => ({

                sender:
                    msg.role === "assistant"
                        ? "bot"
                        : "user",

                text: msg.message

            }));

            setMessages(loaded);

        }

        catch (err) {

            console.log(err);

        }

    }

    loadChat();

}, [selectedChat]);
  // -----------------------------
  // Send Question
  // -----------------------------
  async function sendQuestion(question) {
    if (!question.trim()) return;

    // Prevent asking PDF questions before selecting a subject
    if (mode === "pdf" && selectedSubject === "") {
      return;
    }

    // Wait until AI chat is created
    if (mode === "ai" && !chatId) {
      alert("Please wait...");
      return;
    }

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: question,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setLoading(true);

    try {
      let response;

      // -----------------------------
      // AI Mode
      // -----------------------------
      if (mode === "ai") {
        response = await axios.post(
          `http://localhost:8000/chat/${chatId}`,
          {
            question,
          }
        );
      }

      // -----------------------------
      // PDF Tutor Mode
      // -----------------------------
      else {
        response = await axios.post(
          "http://localhost:8000/rag-ask",
          {
            question,
            subject: selectedSubject,
          }
        );
      }

      const answer = response.data.answer;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: answer,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      // Speak Answer
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(answer);

      setSpeaking(true);

      speech.onend = () => {
        setSpeaking(false);
      };

      window.speechSynthesis.speak(speech);
    } catch (err) {
      console.error(err);

      let errorMessage = "⚠ Backend unavailable.";

      if (err.response) {
        console.log(err.response.data);

        errorMessage =
          err.response.data.detail ||
          JSON.stringify(err.response.data);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorMessage,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(errorMessage);

      setSpeaking(true);

      speech.onend = () => {
        setSpeaking(false);
      };

      window.speechSynthesis.speak(speech);
    }

    setLoading(false);
  }

  return (
    <div className="chat-container">
      <ScrollToBottom className="chat-window">
        <div className="messages">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg}
            />
          ))}

          {loading && <TypingIndicator />}
        </div>
      </ScrollToBottom>

      <div className="chat-input-fixed">
        <ChatInput
          sendQuestion={sendQuestion}
          disabled={
            mode === "pdf" &&
            selectedSubject === ""
          }
          placeholder={
            mode === "pdf"
              ? selectedSubject
                ? `Ask anything from ${selectedSubject}...`
                : "Select a subject from the left sidebar first..."
              : "Ask me anything..."
          }
        />
      </div>
    </div>
  );
}

export default ChatWindow;