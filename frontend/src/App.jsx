import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Tutor from "./pages/Tutor";
import Profile from "./pages/Profile";
import PdfManager from "./pages/PdfManager";
import LoginGuard from "./components/LoginGuard";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route
    path="/tutor"
    element={
        <LoginGuard>
            <Tutor />
        </LoginGuard>
    }
/>

        <Route path="/pdf" element={<PdfManager />} />

        <Route path="/profile" element={<Profile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;