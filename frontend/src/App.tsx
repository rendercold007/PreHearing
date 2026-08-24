import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AnalyzePage } from "./pages/AnalyzePage";

function App(){
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<AnalyzePage />} />
        </Routes>
    );
}

export default App;
