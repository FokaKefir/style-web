// src/pages/Register.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);
  const navigate = useNavigate();

  // Validation patterns similar to Kotlin implementation
  const patterns = useMemo(() => ({
    password: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,20}$/,
    username: /^[A-Za-z]\w{0,16}$/
  }), []);
  
  const showAlert = (type, title, description = "") => {
    setAlert({ type, title, description });
    if (type === "success") {
      setTimeout(() => setAlert(null), 2000);
    }
  };

  const validateName = useCallback((name) => {
    if (name.trim() === "") {
      return "Field can't be empty";
    }
    if (name.length > 16) {
      return "Username too long";
    }
    if (!patterns.username.test(name)) {
      return "Invalid characters";
    }
    return null;
  }, [patterns]);

  const validateEmail = useCallback((email) => {
    if (email.trim() === "") {
      return "Field can't be empty";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  }, []);

  const validatePassword = useCallback((password) => {
    if (password.trim() === "") {
      return "Field can't be empty";
    }
    if (password.length > 20) {
      return "Password too long";
    }
    if (!patterns.password.test(password)) {
      return "Password must contain at least 8 characters, one uppercase, one lowercase, and one number";
    }
    return null;
  }, [patterns]);

  const validatePasswordMatch = useCallback((password, confirmPassword) => {
    if (password !== confirmPassword) {
      return "Passwords need to match";
    }
    return null;
  }, []);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Update validation on input change, but only if the field has been touched or form was submitted
  useEffect(() => {
    const newErrors = {};
    
    if (touched.username || formSubmitAttempted) {
      newErrors.username = validateName(username);
    }
    if (touched.email || formSubmitAttempted) {
      newErrors.email = validateEmail(email);
    }
    if (touched.password || formSubmitAttempted) {
      newErrors.password = validatePassword(password);
    }
    if ((touched.confirmPassword || formSubmitAttempted) && confirmPassword) {
      newErrors.confirmPassword = validatePasswordMatch(password, confirmPassword);
    }

    setErrors(newErrors);
  }, [username, email, password, confirmPassword, touched, formSubmitAttempted, validateName, validateEmail, validatePassword, validatePasswordMatch]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormSubmitAttempted(true);

    const validationErrors = {
      username: validateName(username),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordMatch(password, confirmPassword)
    };

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(error => error !== null)) {
      showAlert("error", "Please fill in all fields correctly");
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), {
        name: username,
      });

      showAlert("success", "Registration successful!", "Please verify your email before logging in.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      showAlert("error", "Registration failed", error.message);
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
      
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md" noValidate>
        <h2 className="text-2xl mb-4">Register</h2>
        <div className="mb-4">
          <input
            className={`w-full border p-2 rounded ${errors.username && (touched.username || formSubmitAttempted) ? 'border-red-500' : ''}`}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => handleBlur('username')}
            autoComplete="off"
            spellCheck="false"
            required
          />
          {errors.username && (touched.username || formSubmitAttempted) && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        <div className="mb-4">
          <input
            className={`w-full border p-2 rounded ${errors.email && (touched.email || formSubmitAttempted) ? 'border-red-500' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            autoComplete="new-email"
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

        <div className="mb-4">
          <input
            className={`w-full border p-2 rounded ${errors.confirmPassword && (touched.confirmPassword || formSubmitAttempted) ? 'border-red-500' : ''}`}
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            autoComplete="new-password"
            required
          />
          {errors.confirmPassword && (touched.confirmPassword || formSubmitAttempted) && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed" 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-700">Login</Link>
        </p>
      </form>
    </div>
  );
}
