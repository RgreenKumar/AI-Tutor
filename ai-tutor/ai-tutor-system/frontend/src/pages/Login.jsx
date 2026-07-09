import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "../services/auth";
import "./Login.css";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  function handleLogin(e) {

    e.preventDefault();

    login({

      name: "Sayaa",

      email: email,

      profile:
        "https://ui-avatars.com/api/?name=Sayaa"

    });

    navigate("/tutor");

  }

  return (

    <div className="login-page">

      <div className="login-card">

        <h1>📘 AI Tutor</h1>

        <p>Your Personalized Learning Assistant</p>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button type="submit">

            Login

          </button>

        </form>

        <div className="bottom-links">

          <Link to="/signup">

            Create Account

          </Link>

        </div>

      </div>

    </div>

  );

}

export default Login;