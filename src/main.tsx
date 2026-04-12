
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { setupFetchInterceptor } from "./utils/auth-interceptor";

  setupFetchInterceptor();

  createRoot(document.getElementById("root")!).render(<App />);
  