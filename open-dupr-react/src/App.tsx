import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./lib/useAuth";
import Login from "./components/pages/Login";

function App() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (token && !isRedirecting) {
      setIsRedirecting(true);
      navigate("/profile", { replace: true });
    }
  }, [token, navigate, isRedirecting]);

  if (token) {
    return null;
  }

  return <Login />;
}

export default App;
