import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Contract from "./pages/Contract";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contract/:id" element={<Contract />} />
      </Routes>
    </div>
  );
}
