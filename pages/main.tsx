import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Index } from "../src/routes/index";
import "../src/styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento raiz do aplicativo não encontrado.");
}

createRoot(root).render(
  <StrictMode>
    <Index />
  </StrictMode>,
);
