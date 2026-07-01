import React from "react"
import ReactDOM from "react-dom/client"
import PublicRegistration from "./pages/PublicRegistration"
import { Toaster } from "sonner"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PublicRegistration />
    <Toaster position="top-right" richColors />
  </React.StrictMode>
)
