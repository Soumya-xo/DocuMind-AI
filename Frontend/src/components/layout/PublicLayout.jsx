import React from "react";
import Navbar from "./Navbar.jsx";

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-14">{children}</div>
    </div>
  );
};

export default PublicLayout;
