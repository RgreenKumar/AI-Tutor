import { useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import AvatarPanel from "../components/AvatarPanel";

import "./Tutor.css";

function Tutor() {

    const [speaking, setSpeaking] = useState(false);

    const [mode, setMode] = useState("ai");

    const [selectedSubject, setSelectedSubject] = useState("");

    const [selectedChat, setSelectedChat] = useState(null);

    return (

        <div className="home">

            <Sidebar
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                onSelectChat={setSelectedChat}
            />

            <div className="chat-section">

                <ChatWindow
                    setSpeaking={setSpeaking}
                    mode={mode}
                    selectedSubject={selectedSubject}
                    selectedChat={selectedChat}
                />

            </div>

            <AvatarPanel
                speaking={speaking}
                mode={mode}
                setMode={setMode}
            />

        </div>

    );

}

export default Tutor;