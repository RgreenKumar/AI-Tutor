import { ThreeDots } from "react-loader-spinner";
import "./TypingIndicator.css";

export default function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="typing-box">
        <ThreeDots
          height="35"
          width="35"
          color="#4f46e5"
          visible={true}
        />
      </div>
    </div>
  );
}