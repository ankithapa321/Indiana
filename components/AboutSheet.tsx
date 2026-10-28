"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react"; // Added useEffect and useRef

type AboutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutSheet({ open, onOpenChange }: AboutSheetProps) {
  // 1. Create a reference to the scrollable panel
  const panelRef = useRef<HTMLDivElement>(null);

  // 2. Whenever 'open' changes to true, reset the scroll position to 0
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [open]);

  return (
    <>
      <div 
        className={`about-backdrop ${open ? "open" : ""}`} 
        onClick={() => onOpenChange(false)} 
      />
      {/* 3. Attach the ref to the panel */}
      <div 
        ref={panelRef}
        className={`about-panel ${open ? "open" : ""}`}
      >
        <div className="about-head">
          <div className="grab" />
          <button 
            className="about-close" 
            onClick={() => onOpenChange(false)}
            aria-label="Close About Panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="about-inner">
          {/* --- HEADER SECTION --- */}
          <p className="about-eyebrow">WELCOME TO INDIANA</p>
          <h1 className="about-title">INDIANA STATE APPAREL</h1>
          <p className="about-sub">Celebrate the Great State of Indiana</p>

          <div className="about-landscape">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            >
              <source src="/videos/Indiana1.mp4" type="video/mp4" />
            </video>
          </div>

          {/* --- INTRODUCTION --- */}
          <p>To our friends across America and around the world, come discover Indiana.</p>
          <p>Indiana is more than somewhere to pass through. It is a place worth slowing down for, exploring, protecting and remembering.</p>
          <p>Come walk beneath the trees. Come follow the rivers. Come find the quiet places. Come experience Indiana for yourself.</p>

          {/* --- WATERWAYS --- */}
          <h2>INDIANA IS CONNECTED BY WATER</h2>
          <p>Indiana is a landscape connected by water. Rivers and streams have helped shape our geography, communities, wildlife habitats and history. Creeks become larger streams. Streams enter rivers. Rivers travel through forests, farmland, wetlands and communities. Lakes create entirely different freshwater environments.</p>
          <p>Water connects Indiana. And you do not have to simply stand on the shore and look at it.</p>
          <p><strong>You can paddle through it.</strong></p>
          <p>Indiana has designated water trails where people can canoe, kayak, raft, paddleboard, fish and experience wildlife and natural landscapes from the water. Among Indiana's specially recognized waterways are Cedar Creek, Wildcat Creek and Blue River, portions of which belong to Indiana's Natural, Scenic and Recreational River System.</p>
          <p>Travel north and Indiana's relationship with water changes again. Northern Indiana contains numerous lakes formed through glacial processes thousands of years ago. Travel south and the landscape increasingly becomes one of hardwood hills, reservoirs, limestone country, winding streams, ravines and river valleys.</p>
          <p>These waters are much more than beautiful scenery.</p>
          <ul>
            <li>They support wildlife.</li>
            <li>They support recreation.</li>
            <li>They contribute to agriculture.</li>
            <li>They provide freshwater.</li>
            <li>They connect habitats and communities.</li>
          </ul>
          <p>Indiana DNR reports that more than half of Indiana's clean freshwater comes from rivers, lakes and streams. That makes protecting our water about much more than preserving a beautiful view.</p>

          {/* --- FORESTS & WETLANDS --- */}
          <h2>INDIANA'S FORESTS</h2>
          <p>Follow those waterways into Indiana's forests and another remarkable landscape begins.</p>
          <p>Indiana has approximately 4.8 million acres of forestland, representing roughly 21 percent of the state's land base. These are forests of oak, hickory, beech and other eastern hardwoods. Approximately 72.3 percent of Indiana forestland is classified as oak and hickory forest type.</p>
          <p>These are forests of towering hardwoods, changing seasons, shaded ravines, fallen timber, wildlife, limestone, creeks and generations of natural history. Autumn may transform them with gold, amber, orange and red, but these ecosystems are alive throughout the year.</p>
          <p>And the forest and water are connected. Forests help filter pollutants from air and water, store carbon, moderate temperatures and provide habitat for wildlife. Protecting a forest can also mean protecting the water moving through it.</p>
          <p>Trees, soil, wetlands, creeks, wildlife and people downstream are all parts of a much larger environmental system.</p>

          <h2>WETLANDS & CONSERVATION</h2>
          <p>Indiana's wetlands are another important part of that system. Forested wetlands can filter sediment and pollutants, support groundwater, retain stormwater and slow the movement of water toward rivers during flooding. They also provide specialized habitat for birds, mammals, reptiles, amphibians and water dependent plants.</p>
          <p>Conservation therefore matters. Indiana has lost substantial portions of its historic wetlands, and waterways continue to face pressures from pollution, runoff, habitat disturbance and other environmental changes. That gives all of us another reason to care.</p>
          <p>Celebrate what remains. Restore what we can. Protect what we have. Leave something living for the people who come after us.</p>
          
          <div className="about-mission">
            <span>PRESERVE. PROTECT. INSPIRE.</span>
          </div>

          {/* --- STATE PARKS --- */}
          <h2>EXPLORE INDIANA'S NATURAL HERITAGE</h2>
          <p>Preservation in Indiana is more than an idea. The Indiana Department of Natural Resources Division of Nature Preserves works to identify, protect and manage natural areas representing Indiana's natural communities while also working with endangered, threatened and rare species.</p>
          <p>Indiana's Classified Forest program had more than 877,851 acres across 18,127 tracts enrolled as of 2024.</p>
          <p>And there are extraordinary opportunities to experience Indiana's natural heritage firsthand.</p>
          <ul>
            <li>Indiana's State Parks system manages 24 state parks, together with reservoir properties, state forest recreation areas and other outdoor properties.</li>
            <li>State Park properties collectively offer approximately 700 miles of trails.</li>
            <li>Indiana's State Forest recreation system encompasses approximately 160,778 acres, an estimated 63.8 million trees, 435 miles of trails and 159 lakes.</li>
          </ul>

          <h2>COME SEE US</h2>
          <p>So if you have never been to Indiana, come see us. If you are traveling across America from another part of the world, give yourself time to discover some of the extraordinary landscapes between the country's most famous destinations.</p>
          <p>Walk beneath an Indiana hardwood canopy. Paddle one of our waterways. Follow a forest trail. Watch morning mist rise from the water. Listen to a forest before the rest of the world wakes up. See wildlife where it belongs. Watch the seasons change. Stand beside water that has been shaping the landscape for generations.</p>
          <p>And while you are here, help us care for it.</p>
          
          <h2>EXPLORE INDIANA RESPONSIBLY</h2>
          <p>Because enjoying nature and protecting nature should never be competing ideas.</p>
          <ul>
            <li>Respect wildlife and its habitat.</li>
            <li>Respect private property.</li>
            <li>Leave natural places cleaner than you found them.</li>
            <li>Support parks, forests, preserves and conservation programs.</li>
            <li>Teach the next generation why these places matter.</li>
          </ul>

          <p>Indiana is something each generation inherits temporarily. Its rivers were flowing before us. Its limestone records a history immeasurably older than our communities. Its forests contain living systems stretching from microorganisms beneath the soil to towering hardwood canopies overhead. Its waters connect one landscape to another.</p>
          <p>Our responsibility is not simply to enjoy these places. It is to make certain someone else can experience them after us.</p>

          <h2>COME TO INDIANA</h2>
          <ul>
            <li>Come for the rivers.</li>
            <li>Come for the lakes.</li>
            <li>Come for the forests.</li>
            <li>Come for the trails.</li>
            <li>Come for those quiet mornings when sunlight reaches through the trees and the only thing moving is water.</li>
          </ul>
          
          <p>Come discover places you may never have expected to find here.</p>
          <p>And when you leave, carry something of Indiana with you while helping us leave Indiana itself exactly where it belongs.</p>

          {/* --- FINAL CLOSING SECTION --- */}
          <div style={{ marginTop: "0.5rem", }}>
            <p style={{ marginBottom: "0.5rem" }}>
              Not because these lands belong only to us. Because for a little while, they have been entrusted to us.
            </p>
            
            <p style={{ marginBottom: "1.5rem" }}>
              Come experience a land like no other.
            </p>
            
            <p style={{ 
              fontFamily: "var(--font-bebas)", 
              fontSize: "1.6rem", 
              color: "var(--accent)", 
              letterSpacing: "0.05em", 
              marginBottom: "0.5rem" 
            }}>
              Come celebrate the Great State of Indiana.
            </p>

            <div>
              <div style={{ 
                borderLeft: "3px solid var(--accent)", 
                paddingLeft: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem" 
              }}>
                <span style={{ fontFamily: "var(--font-bebas)", fontSize: "1.6rem", color: "#fff", lineHeight: "1.1" }}>EXPLORE INDIANA.</span>
                <span style={{ fontFamily: "var(--font-bebas)", fontSize: "1.6rem", color: "#fff", lineHeight: "1.1" }}>PROTECT INDIANA.</span>
                <span style={{ fontFamily: "var(--font-bebas)", fontSize: "1.6rem", color: "#fff", lineHeight: "1.1" }}>PRESERVE INDIANA.</span>
              </div>
            </div>
          </div>
                  
          {/* --- HASHTAGS --- */}
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "0.6rem", 
            marginTop: "3rem", 
            marginBottom: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid rgba(255,255,255,0.1)"
          }}>
            {[
              "#Indiana", "#VisitIndiana", "#ExploreIndiana", "#DiscoverIndiana", "#IndianaNature", 
              "#IndianaOutdoors", "#IndianaWildlife", "#IndianaForests", "#IndianaRivers", 
              "#IndianaLakes", "#IndianaWaterways", "#IndianaStateParks", "#IndianaTrails", 
              "#IndianaHiking", "#IndianaConservation", "#NaturalIndiana", "#SouthernIndiana", 
              "#IndianaAdventure", "#IndianaTravel", "#IndianaTourism", "#IndianaLife", 
              "#IndianaProud", "#HoosierState", "#HoosierPride", "#PureIndiana", 
              "#BeautifulIndiana", "#IndianaPhotography", "#IndianaScenery", "#IndianaWild", 
              "#IndianaStateApparel"
            ].map((tag) => (
              <a 
                key={tag} 
                href={`https://www.google.com/search?q=${encodeURIComponent(tag)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.85rem",
                  color: "rgba(255, 255, 255, 0.7)",
                  textDecoration: "none",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "6px 12px",
                  borderRadius: "100px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.2s ease",
                  cursor: "pointer" 
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "var(--accent)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)"; 
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
              >
                {tag}
              </a>
            ))}
          </div>
          
          <div className="about-foot" style={{ 
            textAlign: "center", 
            opacity: 0.6, 
            borderTop: "1px solid rgba(255,255,255,0.15)", 
            paddingTop: "0.5rem", 
            marginTop: "0.5rem",
            paddingBottom: "0.5rem",
            letterSpacing: "0.05em"
          }}>
            <p style={{ fontSize: "0.9rem", color: "#a0a0a0" }}>
              INDIANA STATE APPAREL · PREMIUM INDIANA WEAR
            </p>
          </div>
        </div>
      </div>
    </>
  );
}