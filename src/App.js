import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./Components/NavBar";
import Footer from "./Components/Footer";
import ChatBot from "./Components/ChatBot";

import Home from "./Pages/Home";

export default function App() {
  return (
    <div className="page">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>

      <Footer/>
      <ChatBot/>
    </div>
  );
}