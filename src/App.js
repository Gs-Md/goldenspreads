import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./Components/NavBar";
import Footer from "./Components/Footer";
import ChatBot from "./Components/ChatBot";

import Home from "./Pages/Home";
import Rewards from "./Pages/Rewards";
import AdminRewards from "./Pages/AdminRewards";

export default function App() {
  return (
    <div className="page">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/admin/rewards" element={<AdminRewards />} />
      </Routes>

      <Footer/>
      <ChatBot/>
    </div>
  );
}