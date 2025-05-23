import React from "react";
import { Routes, Route } from "react-router-dom";
import Chat from "./Chat";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Chat />} />
  </Routes>
);

export default AppRoutes;
