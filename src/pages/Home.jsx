// src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-oceanblue text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Home Page</h1>
        <button
          onClick={handleRedirect}
          className="mt-4 px-6 py-2 bg-tumbleweed text-white rounded-lg hover:bg-moderatelybrown transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default Home;
