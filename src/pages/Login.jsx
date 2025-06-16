// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already signed in
    const currentUser = auth.currentUser;
    if (currentUser?.emailVerified) {
      navigate("/gallery");
    }
  }, [navigate]);

  const showAlert = (type, title, description = "") => {
    setAlert({ type, title, description });
    if (type === "success") {
      setTimeout(() => setAlert(null), 2000);
    }
  };

  const validateEmail = (email) => {
    if (email.trim() === "") {
      return "Email field is empty";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (password.trim() === "") {
      return "Password field is empty";
    }
    return null;
  };

  // Update validation on input change, but only if the field has been touched or form was submitted
  useEffect(() => {
    if (touched.email || formSubmitAttempted) {
      const emailError = validateEmail(email);
      setErrors(prev => ({ ...prev, email: emailError }));
    }
    if (touched.password || formSubmitAttempted) {
      const passwordError = validatePassword(password);
      setErrors(prev => ({ ...prev, password: passwordError }));
    }
  }, [email, password, touched, formSubmitAttempted]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormSubmitAttempted(true);
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      email: emailError,
      password: passwordError
    });

    if (emailError || passwordError) {
      showAlert("error", "Please fill in all fields correctly");
      return;
    }

    setIsSubmitting(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      if (user.emailVerified) {
        showAlert("success", "Login successful!");
        setTimeout(() => navigate("/gallery"), 1500);
      } else {
        showAlert("error", "Email is not verified", "Please check your inbox and verify your email address.");
      }
    } catch (error) {
      showAlert("error", "Login failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* App Logo and Name Header */}
      <div className="flex flex-col items-center mb-6">
        <img 
          src="/logo.png" 
          alt="Style Gallery Logo" 
          className="h-16 w-16 mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-800">Style Gallery</h1>
        <p className="text-gray-600 text-center mt-2">Transform your images with AI-powered style transfer</p>
      </div>

      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"} className="mb-4">
          {alert.type === "error" ? 
            <AlertCircle className="h-4 w-4" /> : 
            <CheckCircle2 className="h-4 w-4" />
          }
          <AlertTitle>{alert.title}</AlertTitle>
          {alert.description && (
            <AlertDescription>{alert.description}</AlertDescription>
          )}
        </Alert>
      )}
      
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md" noValidate>
        <h2 className="text-2xl mb-4">Login</h2>
        
        <div className="mb-4">
          <input
            className={`w-full border p-2 rounded ${errors.email && (touched.email || formSubmitAttempted) ? 'border-red-500' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            autoComplete="off"
            spellCheck="false"
            required
          />
          {errors.email && (touched.email || formSubmitAttempted) && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <input
            className={`w-full border p-2 rounded ${errors.password && (touched.password || formSubmitAttempted) ? 'border-red-500' : ''}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            autoComplete="new-password"
            required
          />
          {errors.password && (touched.password || formSubmitAttempted) && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed" 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        <p className="mt-4 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-700">Register</Link>
        </p>
      </form>
    </div>
  );
}
