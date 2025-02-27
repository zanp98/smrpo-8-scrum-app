import React, { useContext } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Main app component that checks authentication
const AppContent = () => {
  const { currentUser, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return <div className="App">{currentUser ? <Dashboard /> : <Login />}</div>;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
