import React from "react";
import Chat from "./Chat";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import AppRoutes from "./routes";

function App() {
  // Detect system dark mode preference

  // Create a theme instance based on preference
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: "dark",
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ minHeight: "100vh" }}>
        <h1
          style={{
            textAlign: "center",
            margin: "32px 0 0 0",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Fix your plant!
        </h1>
        <AppRoutes />

        <Chat />
      </div>
    </ThemeProvider>
  );
}

export default App;
