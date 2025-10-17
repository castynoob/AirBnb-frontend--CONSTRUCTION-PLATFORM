import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./pages/auth/SignupPage";
import Login from "./pages/auth/LoginPage";
import HomePage from "./pages/homepage/HomePage"
import Messages from './pages/messages/Messages'
import Submissions from "./pages/submissions/Submissions";
import FavoriteEntrepreneurs from './pages/favorites/FavoriteEntrepreneurs'
import AddWorkForm from './pages/works/AddWorkForm'
import ProfilePageManager from "./pages/profile/ProfilePageManager";
import HomePageEntrepreneur from "./pages/homepage/HomePageEntrepreneur";
import MessagesEntrepreneur from './pages/messages/MessagesEntrepreneur'

function App() {
  return (
    <Router>
      <div className="main-app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/homepage/manager" element={<HomePage/>} />
          <Route path="/homepage/entrepreneur" element={<HomePageEntrepreneur/>} />
          <Route path="/messages/manager" element={<Messages/>} />
          <Route path="/messages/entrepreneur" element={<MessagesEntrepreneur/>} />
          <Route path="/submissions/manager" element={<Submissions/>} />
          <Route path="/favorites/manager" element={<FavoriteEntrepreneurs/>} />
          <Route path="/add-work/manager" element={<AddWorkForm/>} />
          <Route path="/profile/manager" element={<ProfilePageManager/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
