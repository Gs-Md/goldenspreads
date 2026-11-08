import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./Styles/App.css";
import "./Styles/Language.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./lib/LanguageContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
