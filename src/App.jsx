import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./pages/SignupPage";
import Login from "./pages/LoginPage";
import HomePage from "./pages/HomePage"
import Messages from './pages/Messages'
import Submissions from "./pages/Submissions";

function App() {
  return (
    <Router>
      <div className="main-app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/homepage" element={<HomePage/>} />
          <Route path="/messages" element={<Messages/>} />
          <Route path="/submissions" element={<Submissions/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
