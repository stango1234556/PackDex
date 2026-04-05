import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetSelectPage from "./pages/SetSelectPage";
import SimulatorPage from "./pages/SimulatorPage";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetSelectPage />} />
        <Route path="/simulator/:language/:setId" element={<SimulatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}