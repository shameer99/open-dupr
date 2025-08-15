import { Navigate } from "react-router-dom";
import { useAuth } from "./lib/useAuth";

function App() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/profile" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default App;
