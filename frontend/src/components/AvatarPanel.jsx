import { useEffect, useRef } from "react";
import "./AvatarPanel.css";

function AvatarPanel({
  speaking,
  mode,
  setMode
}) {

  const videoRef = useRef(null);

  useEffect(() => {

    if (!videoRef.current) return;

    if (speaking) {

      videoRef.current.src = "/avatar/talking.mp4";

    } else {

      videoRef.current.src = "/avatar/idle.mp4";

    }

    videoRef.current.loop = true;
    videoRef.current.play();

  }, [speaking]);

  return (

    <div className="avatar-panel">

      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        className="avatar-video"
      />

      <div className="avatar-card">

        <h2>AI Tutor</h2>

        <div className="status">

          <span className="dot"></span>

          Online

        </div>

      </div>

      <div className="help-card">

        ✨ I'm here to help you understand your study material.

        <br /><br />

        Choose a study mode below.

      </div>

      <div className="mode-box">

        <h3>Study Mode</h3>

        <label>

          <input
            type="radio"
            checked={mode === "pdf"}
            onChange={() => setMode("pdf")}
          />

          PDF Tutor

        </label>

        <label>

          <input
            type="radio"
            checked={mode === "ai"}
            onChange={() => setMode("ai")}
          />

          AI Tutor

        </label>

      </div>

    </div>

  );

}

export default AvatarPanel;