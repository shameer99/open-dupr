import { ThemeProvider } from "./lib/ThemeProvider";
import Login from "./components/pages/Login";

function App() {
  return (
    <ThemeProvider>
      <Login />
    </ThemeProvider>
  );
}

export default App;
