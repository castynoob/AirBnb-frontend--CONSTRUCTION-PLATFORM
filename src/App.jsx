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
import MessagesEntrepreneur from './pages/messages/MessagesEntrepreneur';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import SubmittedBids from './pages/submissions/SubmittedBids'

function App() {
  return (
    <Router>
      <div className="main-app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/homepage/manager" element={<HomePage/>} />
          <Route path="/messages/manager" element={<Messages/>} />
          <Route path="/submissions/manager" element={<Submissions/>} />
          <Route path="/favorites/manager" element={<FavoriteEntrepreneurs/>} />
          <Route path="/add-work/manager" element={<AddWorkForm/>} />
          <Route path="/profile/manager" element={<ProfilePageManager/>} />
          <Route path="/homepage/entrepreneur" element={<HomePageEntrepreneur/>} />
          <Route path="/messages/entrepreneur" element={<MessagesEntrepreneur/>} />
          <Route path="/subscription/entrepreneur" element={<SubscriptionPage/>} />
          <Route path="/submissions/entrepreneur" element={<SubmittedBids/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
