import "./TalkingAvatar.css";
import avatar from "../assets/avatar.png";

function TalkingAvatar({ speaking }) {
  return (
    <div className="avatar-wrapper">
      <img
        src={avatar}
        alt="AI Tutor"
        className={speaking ? "avatar talking" : "avatar"}
      />
    </div>
  );
}

export default TalkingAvatar;