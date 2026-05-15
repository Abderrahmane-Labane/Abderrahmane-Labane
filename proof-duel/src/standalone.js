import { createProofDuelApp } from "./ProofDuelApp.js";

const ProofDuelApp = createProofDuelApp({
  React: window.React,
  motion: window.Motion?.motion || null,
});

const root = window.ReactDOM.createRoot(document.getElementById("root"));
root.render(window.React.createElement(ProofDuelApp));
