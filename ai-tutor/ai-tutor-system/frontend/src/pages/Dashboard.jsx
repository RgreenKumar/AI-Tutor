import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { Link } from "react-router-dom";
function Dashboard() {

    const navigate = useNavigate();

    return(

        <div className="dashboard">

            <h1>Welcome to AI Tutor 🎓</h1>

            <p>Select what you want to do.</p>

            <div className="cards">

                <div
                className="card"
                onClick={()=>navigate("/tutor")}
                >
                    💬

                    <h2>AI Tutor</h2>

                    <p>Ask questions from uploaded notes.</p>

                </div>

                <div
                className="card"
                onClick={()=>navigate("/pdf")}
                >

                    📄
                    <Link to="/pdf" className="card">
                    <h2>Study Mode</h2>
                </Link>
                    <p>Manage your PDFs.</p>

                </div>

                <div
                className="card"
                onClick={()=>navigate("/profile")}
                >

                    👤
                    <Link to="/profile" className="dashboard-card">
                    <h2>Profile</h2>
                    </Link>
                    <p>Manage your account.</p>

                </div>

            </div>

        </div>

    );

}

export default Dashboard;