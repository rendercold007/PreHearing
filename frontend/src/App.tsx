import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { AuthPage } from "./pages/AuthPage";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

function App(){
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route
                    path="/app"
                    element={
                        <RequireAuth>
                            <AnalyzePage />
                        </RequireAuth>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;
