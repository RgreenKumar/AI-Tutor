import TalkingAvatar from "./TalkingAvatar";
import "./MessageBubble.css";

const MessageBubble = ({ message }) => {
  return (
    <div
      className={`message-row ${
        message.sender === "user" ? "user-row" : "bot-row"
      }`}
    >

      <div
        className={`message ${
          message.sender === "user" ? "user-message" : "bot-message"
        }`}
      >
        <div className="message-text">
    {message.text}
</div>
      </div>
      <div className="time">
          {message.time}
      </div>
    </div>
  );
};

export default MessageBubble;