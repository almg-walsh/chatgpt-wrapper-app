import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppRoutes from "./routes";

function App() {
  // Create a theme instance for dark mode
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
      </div>
    </ThemeProvider>
  );
}

export default App;
