import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage/HomePage"
import Messages from './pages/messages/Messages'
import Submissions from "./pages/submissions/Submissions";
import FavoriteEntrepreneurs from './pages/favorites/FavoriteEntrepreneurs'
import AddWorkForm from './pages/works/AddWorkForm'
import ProfilePageManager from "./pages/profile/ProfilePageManager";
import HomePageEntrepreneur from "./pages/homepage/HomePageEntrepreneur";
import MessagesEntrepreneur from './pages/messages/MessagesEntrepreneur';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import SubmittedBids from './pages/submissions/SubmittedBids';
import AddPropertyPage from "./pages/profile/AddPropertyPage";
import LandingPage from "./pages/landingpage/LandingPage";
import ProfilePageEntrepreneur from "./pages/profile/ProfilePageEntrepreneur";

function App() {
  return (
    <Router>
      <div className="main-app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/homepage/property_manager" element={<HomePage/>} />
          <Route path="/messages/property_manager" element={<Messages/>} />
          <Route path="/submissions/property_manager" element={<Submissions/>} />
          <Route path="/favorites/property_manager" element={<FavoriteEntrepreneurs/>} />
          <Route path="/add-work/property_manager" element={<AddWorkForm/>} />
          <Route path="/profile/property_manager" element={<ProfilePageManager/>} />
          <Route path="/homepage/entrepreneur" element={<HomePageEntrepreneur/>} />
          <Route path="/messages/entrepreneur" element={<MessagesEntrepreneur/>} />
          <Route path="/subscription/entrepreneur" element={<SubscriptionPage/>} />
          <Route path="/submissions/entrepreneur" element={<SubmittedBids/>} />
          <Route path="/profile/add-property" element={<AddPropertyPage/>} />
          <Route path="/profile/entrepreneur" element={<ProfilePageEntrepreneur/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
