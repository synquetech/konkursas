import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const ITEM_HEIGHT = 58; 
const VISIBLE_COUNT = 7; 
const CENTER_INDEX = Math.floor(VISIBLE_COUNT / 2);

export default function App() {
  const [dalyviai, setDalyviai] = useState([]);
  const [sukasi, setSukasi] = useState(false);
  const [laimetojas, setLaimetojas] = useState(null);
  const [statusas, setStatusas] = useState("Kraunami komentarai...");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [juosta, setJuosta] = useState([]);
  const [offsetY, setOffsetY] = useState(0);

  const requestRef = useRef(null);
  const appContainerRef = useRef(null);

  useEffect(() => {
    fetch("/komentarai.json")
      .then((res) => {
        if (!res.ok) throw new Error("Nerastas failas");
        return res.json();
      })
      .then((data) => {
        setDalyviai(data);
        setStatusas(`Iš viso komentarų: ${data.length}`);
        
        if (data.length > 0) {
          let pradinis = [];
          for (let i = 0; i < 20; i++) {
            pradinis.push(data[i % data.length]);
          }
          setJuosta(pradinis);
        }
      })
      .catch(() => {
        setStatusas("Klaida: patikrinkite, ar 'komentarai.json' yra public aplanke.");
      });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (appContainerRef.current?.requestFullscreen) {
        appContainerRef.current.requestFullscreen();
      } else if (appContainerRef.current?.webkitRequestFullscreen) {
        appContainerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const suktiLista = () => {
    if (sukasi || dalyviai.length === 0) return;

    setSukasi(true);
    setLaimetojas(null);

    // 1. Išrenkamas laimėtojas
    const tikrasLaimetojas = dalyviai[Math.floor(Math.random() * dalyviai.length)];

    // 2. Paruošiama ruletės juosta
    const zingsniuKiekis = 50; 
    let naujaJuosta = [];
    for (let i = 0; i < zingsniuKiekis; i++) {
      naujaJuosta.push(dalyviai[Math.floor(Math.random() * dalyviai.length)]);
    }
    naujaJuosta.push(tikrasLaimetojas);

    for (let i = 0; i < 15; i++) {
      naujaJuosta.push(dalyviai[Math.floor(Math.random() * dalyviai.length)]);
    }

    setJuosta(naujaJuosta);

    const targetOffset = zingsniuKiekis * ITEM_HEIGHT;
    setOffsetY(0);

    const animacijosTrukme = 4500;
    const pradinisLaikas = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const animuoti = (dabar) => {
      const praejo = dabar - pradinisLaikas;
      const progresas = Math.min(praejo / animacijosTrukme, 1);
      
      const apskaiciuotasOffset = targetOffset * easeOut(progresas);
      setOffsetY(apskaiciuotasOffset);

      if (progresas < 1) {
        requestRef.current = requestAnimationFrame(animuoti);
      } else {
        // Sustojimas tiksliai ties centru
        setOffsetY(targetOffset);
        setSukasi(false);
        setLaimetojas(tikrasLaimetojas);

        // Šventinis saliutas
        confetti({
          particleCount: 150,
          spread: 85,
          origin: { x: 0.72, y: 0.5 }
        });

        // Tik dabar, kai atsirado sveikinimas, atidarome nuorodą
        if (tikrasLaimetojas?.nuoroda) {
          setTimeout(() => {
            const naujasLangas = window.open(tikrasLaimetojas.nuoroda, "_blank");
            // Jei naršyklė blokuotų naują skirtuką be tiesioginio paspaudimo, nukreipiame esamame lange
            if (!naujasLangas || naujasLangas.closed || typeof naujasLangas.closed === "undefined") {
              window.location.href = tikrasLaimetojas.nuoroda;
            }
          }, 1200);
        }
      }
    };

    requestRef.current = requestAnimationFrame(animuoti);
  };

  return (
    <div ref={appContainerRef} style={styles.appWrapper}>
      {/* Fullscreen mygtukas */}
      <button onClick={toggleFullscreen} style={styles.fullscreenBtn} title="Visas ekranas">
        {isFullscreen ? "🗗 Grįžti" : "⛶ Visas ekranas"}
      </button>

      <header style={styles.header}>
        <h1 style={styles.title}>MONI MIX Sushi padėklo konkursas 🍣</h1>
        <p style={styles.subtitle}>{statusas}</p>
      </header>

      <main style={styles.mainContent}>
        {/* KAIRĖ: Sąrašo ruletė */}
        <section style={styles.leftColumn}>
          <div style={styles.wheelWrapper}>
            <div style={styles.centerMarkerLeft}>▶</div>
            <div style={styles.centerMarkerRight}>◀</div>

            <div style={styles.centerHighlightBox} />

            <div style={styles.slotViewport}>
              <div
                style={{
                  ...styles.slotTrack,
                  transform: `translateY(${-offsetY}px)`
                }}
              >
                {juosta.map((item, idx) => (
                  <div key={idx} style={styles.slotItem}>
                    <span style={styles.slotItemText}>
                      {item.autorius || `Dalyvis #${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            style={{
              ...styles.button,
              ...(sukasi || dalyviai.length === 0 ? styles.buttonDisabled : {})
            }}
            onClick={suktiLista}
            disabled={sukasi || dalyviai.length === 0}
          >
            {sukasi ? "Renkamas laimėtojas..." : "IŠRINKTI LAIMĖTOJĄ"}
          </button>
        </section>

        {/* DEŠINĖ: Laimėtojo kortelė */}
        <section style={styles.rightColumn}>
          {laimetojas ? (
            <div style={styles.winnerCard}>
              <div style={styles.badge}>Laimėtojas rastas!</div>
              <h2 style={styles.greeting}>
                Sveikiname, {laimetojas.autorius}!
              </h2>

              <div style={styles.commentBox}>
                <div style={styles.commentLabel}>Komentaras:</div>
                <p style={styles.commentText}>{laimetojas.tekstas}</p>
              </div>

              {laimetojas.medija && (
                <div style={styles.mediaContainer}>
                  <img
                    src={laimetojas.medija}
                    alt="Prisegtas GIF / foto"
                    style={styles.media}
                  />
                </div>
              )}

              {laimetojas.nuoroda && (
                <a
                  href={laimetojas.nuoroda}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.linkButton}
                >
                  👉 Atidaryti komentarą Facebooke
                </a>
              )}
            </div>
          ) : (
            <div style={styles.placeholderCard}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🍣</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#334155" }}>Laukiama starto...</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
                Paspauskite „IŠRINKTI LAIMĖTOJĄ“, kad paleistumėte atranką!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  appWrapper: {
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    padding: "16px 32px",
    position: "relative"
  },
  fullscreenBtn: {
    position: "absolute",
    top: "16px",
    right: "24px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    zIndex: 50
  },
  header: {
    textAlign: "center",
    marginBottom: "12px",
    flexShrink: 0
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 4px 0",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  mainContent: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    alignItems: "center",
    justifyContent: "center",
    gap: "30px",
    maxWidth: "1100px",
    margin: "0 auto",
    width: "100%",
    minHeight: 0
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px"
  },
  wheelWrapper: {
    position: "relative",
    width: "380px",
    height: `${ITEM_HEIGHT * VISIBLE_COUNT}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  centerHighlightBox: {
    position: "absolute",
    top: `${ITEM_HEIGHT * CENTER_INDEX}px`,
    left: "15px",
    right: "15px",
    height: `${ITEM_HEIGHT}px`,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    border: "2px solid #22c55e",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.2)",
    pointerEvents: "none",
    zIndex: 2
  },
  centerMarkerLeft: {
    position: "absolute",
    left: "-8px",
    top: `${ITEM_HEIGHT * CENTER_INDEX + 16}px`,
    color: "#e11d48",
    fontSize: "20px",
    zIndex: 10
  },
  centerMarkerRight: {
    position: "absolute",
    right: "-8px",
    top: `${ITEM_HEIGHT * CENTER_INDEX + 16}px`,
    color: "#e11d48",
    fontSize: "20px",
    zIndex: 10
  },
  slotViewport: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)",
    maskImage: "linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)"
  },
  slotTrack: {
    paddingTop: `${ITEM_HEIGHT * CENTER_INDEX}px`,
    willChange: "transform"
  },
  slotItem: {
    height: `${ITEM_HEIGHT}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box"
  },
  slotItemText: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "320px",
    textAlign: "center"
  },
  button: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "14px 34px",
    fontSize: "16px",
    fontWeight: "700",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.28)",
    transition: "background 0.2s ease"
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    boxShadow: "none",
    cursor: "not-allowed"
  },
  rightColumn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    maxHeight: "460px"
  },
  winnerCard: {
    backgroundColor: "#ffffff",
    border: "2px solid #22c55e",
    borderRadius: "14px",
    padding: "22px 24px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.07)",
    textAlign: "center",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  placeholderCard: {
    backgroundColor: "#ffffff",
    border: "2px dashed #cbd5e1",
    borderRadius: "14px",
    padding: "40px 24px",
    width: "100%",
    maxWidth: "460px",
    textAlign: "center",
    boxSizing: "border-box"
  },
  badge: {
    alignSelf: "center",
    padding: "4px 12px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontWeight: "700",
    fontSize: "11px",
    borderRadius: "16px",
    textTransform: "uppercase"
  },
  greeting: {
    fontSize: "20px",
    fontWeight: "800",
    margin: "0",
    color: "#0f172a",
    wordBreak: "break-word"
  },
  commentBox: {
    backgroundColor: "#f8fafc",
    padding: "10px 14px",
    borderRadius: "8px",
    borderLeft: "4px solid #22c55e",
    textAlign: "left"
  },
  commentLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "2px"
  },
  commentText: {
    margin: 0,
    fontSize: "14px",
    color: "#1e293b",
    lineHeight: "1.4",
    wordBreak: "break-word",
    maxHeight: "85px",
    overflowY: "auto"
  },
  mediaContainer: {
    display: "flex",
    justifyContent: "center"
  },
  media: {
    maxWidth: "100%",
    maxHeight: "130px",
    borderRadius: "8px",
    objectFit: "contain"
  },
  linkButton: {
    display: "inline-block",
    alignSelf: "center",
    marginTop: "4px",
    backgroundColor: "#1877f2",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "700",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(24, 119, 242, 0.25)"
  }
};
