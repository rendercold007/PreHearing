import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { CasesPage } from "./pages/CasesPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AuthPage } from "./pages/AuthPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

function App(){
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                    path="/app"
                    element={
                        <RequireAuth>
                            <AnalyzePage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/cases"
                    element={
                        <RequireAuth>
                            <CasesPage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/cases/:caseId"
                    element={
                        <RequireAuth>
                            <CaseDetailPage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <RequireAuth>
                            <ProfilePage />
                        </RequireAuth>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;
