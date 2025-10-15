import React, { useCallback, useState } from "react";
import { Bell, AlertTriangle, Wrench, Clock, Calendar } from "lucide-react";
import "../styles/homepage.css";
import Nav from "../components/Nav";
import RepairList from "../components/RepairList";
import SummarySection from '../components/SummarySection'
import RepairDetails from "./RepairDetails";

function HomePage() {
  // Placeholder inspection data with more entries
    const [repairs] = useState([
      {
        id: 1,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "A2010",
        category: "Urgent (Current Year)",
        description: "Roof leakage above living room — needs immediate waterproofing.",
        bids: 8,
        budget: "$12,000 - $15,000",
        images: ["https://constrofacilitator.com/wp-content/uploads/2022/02/roof-repairing.jpg.webp"], // Updated
      },
      {
        id: 2,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "B2010",
        category: "Next Year",
        description: "Elevator door alignment issue — minor panel replacement required.",
        bids: 5,
        budget: "$4,500 - $6,000",
        images: ["https://doorguardinc.com/wp-content/uploads/2025/06/Flooring-1-scaled.jpg"],
      },
      {
        id: 3,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "C2010",
        category: "Year After",
        description: "Exterior wall repaint — faded color and minor cracks visible.",
        bids: 3,
        budget: "$28,000 - $32,000",
        images: ["https://www.thespruce.com/thmb/si4-qP1QEDzkql3hxQiRCZMcvJg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/thespruce-fadedyellowwallpaint-GettyImagesChristinaReichlPhotography-f7d53cdeff8749328b8cb8ba1cb379d4.png"],
      },
      {
        id: 4,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "D2010",
        category: "Urgent (Current Year)",
        description: "Boiler malfunction — no heat in multiple upper-floor units.",
        bids: 10,
        budget: "$18,000 - $22,000",
        images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXaqgmaQuIpVCHq4ILPczBJsclbw9OfLt9Xw&s"], // Updated
      },
      {
        id: 5,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "E2010",
        category: "Next Year",
        description: "Install new CCTV security cameras throughout corridors.",
        bids: 6,
        budget: "$7,000 - $8,500",
        images: ["https://www.phscompliance.co.uk/images/services/fire___security/cctv_outside.pagespeed.1586195523.jpg/rs-960x10000a.jpg"],
      },
      {
        id: 6,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "F2010",
        category: "Year After",
        description: "Upgrade lobby lighting to LED fixtures for better energy savings.",
        bids: 4,
        budget: "$2,500 - $3,000",
        images: ["https://picsum.photos/seed/lobby led lighting upgrade/500/300"],
      },
      {
        id: 7,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "G2010",
        category: "Urgent (Current Year)",
        description: "Broken fire escape railing — safety compliance update required.",
        bids: 9,
        budget: "$9,000 - $10,500",
        images: ["https://randpc.com/files/cache/6139af251090a805f96e1b34adbbdd9f_f389.jpg"], // Updated
      },
      {
        id: 8,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "H2010",
        category: "Next Year",
        description: "Balcony railing reinforcement for safety standards compliance.",
        bids: 7,
        budget: "$14,000 - $16,000",
        images: ["https://www.balconette.co.uk/content/uploads/a024f6b3-f021-484a-9607-2636757a232d/hung.jpg"],
      },
      {
        id: 9,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "I2010",
        category: "Year After",
        description: "Repaint underground parking and add new directional signage.",
        bids: 3,
        budget: "$4,000 - $4,800",
        images: ["https://picsum.photos/seed/underground parking repaint signage/500/300"],
      },
      {
        id: 10,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "J2010",
        category: "Urgent (Current Year)",
        description: "Burst pipe in laundry room — water damage on lower floor.",
        bids: 11,
        budget: "$6,000 - $7,500",
        images: ["https://picsum.photos/seed/burst pipe water damage floor/500/300"], // Updated
      },
      {
        id: 11,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "K2010",
        category: "Next Year",
        description: "Replace communal flooring with slip-resistant tiles.",
        bids: 5,
        budget: "$10,000 - $12,000",
        images: ["https://picsum.photos/seed/slip resistant communal tile/500/300"],
      },
      {
        id: 12,
        property: "Maple Heights, 123 Main St, Toronto",
        apartment: "L2010",
        category: "Year After",
        description: "Replace window seals for improved insulation and efficiency.",
        bids: 3,
        budget: "$8,000 - $9,000",
        images: ["https://picsum.photos/seed/window seal replacement insulation/500/300"],
      },
    ]);

    const [isHome, setIsHome] = useState(true)
    const [repair, setRepair] = useState(null)

    const handleUrgentRequest = () => {
      alert("Urgent Request Triggered — This would notify all entrepreneurs (placeholder).");
    };

    const handleRepairClicked = useCallback((value, repair) => {
      setIsHome(value);
      setRepair(repair);
    }, []);

  return (
    <div className="homepage">
      <Nav />
      {
        isHome?
        <div className="main-container">
          <header className="header">
            <h1>Repair Work Overview</h1>
            <div className="cta-buttons">
              <form className="search-form" onSubmit={(e) => e.preventDefault()}>
                <div className="search-wrapper">
                  <input
                    type="search"
                    placeholder="Search repairs, apartments, or categories..."
                  />
                  <button type="submit" aria-label="Search">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>
              </form>

              <button onClick={handleUrgentRequest} className="urgent-button">
                <Wrench size={18} />
                Urgent Request of Work
              </button>

              <button className="notification-btn">
                <Bell size={20} />
              </button>
            </div>
          </header>

          {/* Summary Cards */}
          <SummarySection />

          {/* Urgent Request Button */}
          <RepairList repairs={repairs} handleRepairClicked={handleRepairClicked} />

        </div> :
        <RepairDetails handleRepairClicked={handleRepairClicked} repair={repair} />
      }
    </div>
  );
}

export default HomePage;
