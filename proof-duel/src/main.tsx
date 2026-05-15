import React from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { createProofDuelApp } from "./ProofDuelApp.js";
import "./styles.css";

const ProofDuelApp = createProofDuelApp({ React, motion });

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ProofDuelApp />
  </React.StrictMode>
);
