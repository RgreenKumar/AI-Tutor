import { useState } from "react";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import "./ChatInput.css";
function ChatInput({
  sendQuestion,
  disabled,
  placeholder
}) {

  const [question, setQuestion] = useState("");

  function submit() {

    if (disabled) return;

    if (!question.trim()) return;

    sendQuestion(question);

    setQuestion("");

  }

  return (

    <div className="chat-input-container">

    <div className="chat-input">

        <textarea
            rows={1}
            value={question}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e)=>setQuestion(e.target.value)}
            onKeyDown={(e)=>{

                if(e.key==="Enter" && !e.shiftKey){

                    e.preventDefault();

                    submit();

                }

            }}
        />

        <button className="mic-btn" disabled={disabled}>
            <FaMicrophone/>
        </button>

        <button
            className="send-btn"
            disabled={disabled}
            onClick={submit}
        >
            <FaPaperPlane/>
        </button>

    </div>

</div>

  );

}

export default ChatInput;