import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./pages/auth/SignupPage";
import Login from "./pages/auth/LoginPage";
import HomePage from "./pages/homepage/HomePage"
import Messages from './pages/messages/Messages'
import Submissions from "./pages/submissions/Submissions";
import FavoriteEntrepreneurs from './pages/favorites/FavoriteEntrepreneurs'
import AddWorkForm from './pages/works/AddWorkForm'

function App() {
  return (
    <Router>
      <div className="main-app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/homepage/manager" element={<HomePage/>} />
          <Route path="/messages" element={<Messages/>} />
          <Route path="/submissions" element={<Submissions/>} />
          <Route path="/favorites/manager" element={<FavoriteEntrepreneurs/>} />
          <Route path="/add-work/manager" element={<AddWorkForm/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
