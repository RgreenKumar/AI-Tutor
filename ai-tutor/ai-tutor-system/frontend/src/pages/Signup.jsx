import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

function Signup() {

    const navigate = useNavigate();

    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");

    function handleSignup(e){

        e.preventDefault();

        navigate("/dashboard");

    }

    return(

        <div className="login-page">

            <div className="login-card">

                <h1>Create Account</h1>

                <p>Start Learning with AI Tutor</p>

                <form onSubmit={handleSignup}>

                    <input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e)=>setName(e.target.value)}
                    />

                    <input
                    placeholder="Email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    />

                    <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    />

                    <button>

                        Sign Up

                    </button>

                </form>

                <div className="bottom-links">

                    <Link to="/">

                        Already have an account?

                    </Link>

                </div>

            </div>

        </div>

    );

}

export default Signup;