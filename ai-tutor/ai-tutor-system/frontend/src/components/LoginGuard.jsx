import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../services/auth";

function LoginGuard({ children }) {

    if (!isLoggedIn()) {

        return <Navigate to="/" />;

    }

    return children;

}

export default LoginGuard;