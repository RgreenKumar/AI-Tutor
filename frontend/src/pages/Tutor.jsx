import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../services/auth";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import AvatarPanel from "../components/AvatarPanel";
import PdfModeModal from "../components/PdfModeModal";
import PdfManager from "./PdfManager";
import axios from "axios";
import "./Tutor.css";

function Tutor() {

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/");
    }
  }, [navigate]);

  const [speaking, setSpeaking] = useState(false);

  const [mode, setMode] = useState("ai");

  const [selectedSubject, setSelectedSubject] = useState("");

  const [selectedChat, setSelectedChat] = useState(null);

  const [showPdfModal, setShowPdfModal] = useState(false);

  const [pdfView, setPdfView] = useState("chat");
  
  const [pdfs, setPdfs] = useState([]);

async function loadPDFs() {

    try {

        const response = await axios.get(
            "http://localhost:8000/pdfs"
        );

        setPdfs(response.data);

    }

    catch(err){

        console.log(err);

    }

}

useEffect(() => {

    loadPDFs();

}, []);
  return (

    <div className="home">

      {/* LEFT SIDEBAR */}
      <Sidebar
    pdfs={pdfs}
    selectedSubject={selectedSubject}
    setSelectedSubject={setSelectedSubject}
    onSelectChat={setSelectedChat}
/>
      {/* CENTER PANEL */}
  
<div className="chat-section">

  {pdfView === "manager" ? (

    <PdfManager
      pdfs={pdfs}
      loadPDFs={loadPDFs}
    />

  ) : (

    <ChatWindow
      setSpeaking={setSpeaking}
      mode={mode}
      selectedSubject={selectedSubject}
      selectedChat={selectedChat}
    />

  )}

</div>
      {/* RIGHT PANEL */}
      <AvatarPanel
        speaking={speaking}
        mode={mode}
        setMode={setMode}
        setShowPdfModal={setShowPdfModal}
      />

      {/* PDF POPUP */}
      {showPdfModal && (
        <PdfModeModal
          setMode={setMode}
          setPdfView={setPdfView}
          setShowPdfModal={setShowPdfModal}
        />
      )}

    </div>

  );

}

export default Tutor;