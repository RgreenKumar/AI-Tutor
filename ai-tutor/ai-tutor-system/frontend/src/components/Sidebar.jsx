import { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import "./Sidebar.css";

function Sidebar({
  pdfs,
  selectedSubject,
  setSelectedSubject,
  onSelectChat
}) {

  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {

    try {

      const res = await fetch("http://localhost:8000/chats");

      const data = await res.json();

      setChats(data);

    } catch (err) {

      console.log(err);

    }

  }

  async function deleteChat(chatId) {

    if (!window.confirm("Delete this chat?")) return;

    await fetch(`http://localhost:8000/chat/${chatId}`, {
      method: "DELETE"
    });

    fetchChats();

  }

  return (

    <div className="sidebar">

      <h2>📚 AI Tutor</h2>

      {pdfs.map((pdf) => {

        const subject = pdf.name.replace(".pdf", "");

        return (

          <button
            key={pdf.name}
            className={
              selectedSubject === subject
                ? "active-subject"
                : "subject-btn"
            }
            onClick={() => setSelectedSubject(subject)}
          >
            {subject}
          </button>

        );

      })}

      <hr />

      <div className="recent-section">

        <h3>Recent Chats</h3>

        {chats.length === 0 ? (

          <p className="no-chat">
            No recent chats
          </p>

        ) : (

          chats.map(chat => (

            <div
              key={chat.chat_id}
              className="chat-card"
            >

              <span
                className="chat-title"
                onClick={() => onSelectChat(chat.chat_id)}
              >
                {chat.title}
              </span>

              <FaTrash
                className="delete-icon"
                onClick={() => deleteChat(chat.chat_id)}
              />

            </div>

          ))

        )}

      </div>

    </div>

  );

}

export default Sidebar;