import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { FiEye, FiEyeOff } from "react-icons/fi";
import PropTypes from "prop-types";

const LoginPage = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
    
        try {
            const userData = await loginUser(username, password);
            console.log("Login Successful: ", userData); 
    
            localStorage.setItem("user", JSON.stringify(userData.user)); // Store user in localStorage
            setUser(userData.user); // Set user state
            navigate("/"); // Redirect to Dashboard
        } catch (error) {
            setError(`Invalid username or password: ${error.message}`);
        }
    };
    

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded shadow-md w-96">
                <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                <form onSubmit={handleLogin} className="relative">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded mb-2 pr-10"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>

                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

LoginPage.propTypes = {
    setUser: PropTypes.func.isRequired, // Ensures setUser is a function and required
};

export default LoginPage;
