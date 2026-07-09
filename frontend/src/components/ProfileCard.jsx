import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../services/auth";
import "./ProfileCard.css";

function ProfileCard() {

    const navigate = useNavigate();

    const user = getUser();

    return (

        <div className="profile-box" >

            <div className="profile-top">

                <FaUserCircle className="profile-icon" onClick={() => navigate("/profile")}/>

                <div>

                    <h4>{user?.name}</h4>

                    <p>{user?.email}</p>

                </div>

            </div>

            <button
                className="logout-btn"
                onClick={() => {

                    logout();
                    navigate("/");

                }}
            >
                <FaSignOutAlt /> Logout
            </button>

        </div>

    );

}

export default ProfileCard;