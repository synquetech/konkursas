import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const ITEM_HEIGHT = 52; 
const VISIBLE_COUNT = 5; 
const CENTER_INDEX = Math.floor(VISIBLE_COUNT / 2);

export default function App() {
  const [dalyviai, setDalyviai] = useState([]);
  const [sukasi, setSukasi] = useState(false);
  const [laimetojas, setLaimetojas] = useState(null);
  const [statusas, setStatusas] = useState("Kraunami komentarai...");
  
  const [juosta, setJuosta] = useState([]);
  const [offsetY, setOffsetY] = useState(0);
  const [nukopijuota, setNukopijuota] = useState(false);

  const requestRef = useRef(null);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "komentarai.json")
      .then((res) => {
        if (!res.ok) throw new Error("Nerastas failas");
        return res.json();
      })
      .then((data) => {
        setDalyviai(data);
        setStatusas(`Dalyvauja komentarų: ${data.length}`);
        
        if (data.length > 0) {
          let pradinis = [];
          for (let i = 0; i < 20; i++) {
            pradinis.push(data[i % data.length]);
          }
          setJuosta(pradinis);
        }
      })
      .catch(() => {
        setStatusas("Klaida kraunant komentarai.json");
      });
  }, []);

  // Suformuoja tiesioginę mobiliesiems pritaikytą komentaro nuorodą
  const suformuotiMobiliaNuoroda = (item) => {
    if (!item) return "";
    let rawLink = item.nuoroda || "";
    
    // Ištraukiame komentaro ID iš autoriaus arba nuorodos
    let cid = "";
    if (item.autorius && item.autorius.includes("#")) {
      cid = item.autorius.split("#")[1].trim();
    } else {
      const match = rawLink.match(/(\d+_\d+|\d+)$/);
      if (match) cid = match[0].split("_").pop();
    }

    const postId = "122138258163163355";
    if (cid) {
      // Šis formatas mobiliajame tiesiogiai paryškina ir iškelia komentarą
      return `https://m.facebook.com/story.php?story_fbid=${postId}&id=931951470000304&comment_id=${cid}`;
    }
    return rawLink;
  };

  const suktiLista = () => {
    if (sukasi || dalyviai.length === 0) return;

    setSukasi(true);
    setLaimetojas(null);
    setNukopijuota(false);

    const tikrasLaimetojas = dalyviai[Math.floor(Math.random() * dalyviai.length)];
    const zingsniuKiekis = 45; 
    let naujaJuosta = [];
    for (let i = 0; i < zingsniuKiekis; i++) {
      naujaJuosta.push(dalyviai[Math.floor(Math.random() * dalyviai.length)]);
    }
    naujaJuosta.push(tikrasLaimetojas);

    for (let i = 0; i < 10; i++) {
      naujaJuosta.push(dalyviai[Math.floor(Math.random() * dalyviai.length)]);
    }

    setJuosta(naujaJuosta);

    const targetOffset = zingsniuKiekis * ITEM_HEIGHT;
    setOffsetY(0);

    const animacijosTrukme = 4200;
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
        setOffsetY(targetOffset);
        setSukasi(false);
        setLaimetojas(tikrasLaimetojas);

        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 }
        });

        const tikslusLinkas = suformuotiMobiliaNuoroda(tikrasLaimetojas);
        if (tikslusLinkas) {
          setTimeout(() => {
            window.location.href = tikslusLinkas;
          }, 1500);
        }
      }
    };

    requestRef.current = requestAnimationFrame(animuoti);
  };

  const kopijuotiTeksta = () => {
    if (!laimetojas) return;
    navigator.clipboard.writeText(laimetojas.autorius + " " + laimetojas.tekstas);
    setNukopijuota(true);
    setTimeout(() => setNukopijuota(false), 2000);
  };

  const mobilusLink = suformuotiMobiliaNuoroda(laimetojas);

  return (
    <div style={styles.appWrapper}>
      <header style={styles.header}>
        <h1 style={styles.title}>MONI MIX Sushi padėklo konkursas 🍣</h1>
        <p style={styles.subtitle}>{statusas}</p>
      </header>

      <main style={styles.mainContent}>
        <section style={styles.wheelSection}>
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

        <section style={styles.resultSection}>
          {laimetojas ? (
            <div style={styles.winnerCard}>
              <div style={styles.badge}>Laimėtojas!</div>
              <h2 style={styles.greeting}>Sveikiname, {laimetojas.autorius}!</h2>

              <div style={styles.commentBox}>
                <div style={styles.commentLabel}>Komentaras:</div>
                <p style={styles.commentText}>{laimetojas.tekstas}</p>
              </div>

              {laimetojas.medija && (
                <div style={styles.mediaContainer}>
                  <img src={laimetojas.medija} alt="GIF" style={styles.media} />
                </div>
              )}

              <div style={styles.actionRow}>
                {mobilusLink && (
                  <a
                    href={mobilusLink}
                    style={styles.linkButton}
                  >
                    👉 Atidaryti komentarą
                  </a>
                )}
                <button onClick={kopijuotiTeksta} style={styles.copyBtn}>
                  {nukopijuota ? "✓ Nukopijuota!" : "📋 Kopijuoti info"}
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.placeholderCard}>
              <div style={{ fontSize: "36px", marginBottom: "6px" }}>🍣</div>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Spauskite mygtuką ir išrinkite laimėtoją!
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
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    padding: "16px 12px 24px 12px"
  },
  header: {
    textAlign: "center",
    marginBottom: "12px",
    flexShrink: 0
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    margin: "0 0 4px 0",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    width: "100%",
    maxWidth: "460px",
    margin: "0 auto"
  },
  wheelSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: "14px"
  },
  wheelWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "340px",
    height: `${ITEM_HEIGHT * VISIBLE_COUNT}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  centerHighlightBox: {
    position: "absolute",
    top: `${ITEM_HEIGHT * CENTER_INDEX}px`,
    left: "8px",
    right: "8px",
    height: `${ITEM_HEIGHT}px`,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    border: "2px solid #22c55e",
    borderRadius: "8px",
    boxShadow: "0 3px 10px rgba(34, 197, 94, 0.2)",
    pointerEvents: "none",
    zIndex: 2
  },
  centerMarkerLeft: {
    position: "absolute",
    left: "-6px",
    top: `${ITEM_HEIGHT * CENTER_INDEX + 14}px`,
    color: "#e11d48",
    fontSize: "18px",
    zIndex: 10
  },
  centerMarkerRight: {
    position: "absolute",
    right: "-6px",
    top: `${ITEM_HEIGHT * CENTER_INDEX + 14}px`,
    color: "#e11d48",
    fontSize: "18px",
    zIndex: 10
  },
  slotViewport: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
    maskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)"
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
    boxSizing: "border-box",
    padding: "0 10px"
  },
  slotItemText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "280px",
    textAlign: "center"
  },
  button: {
    width: "100%",
    maxWidth: "340px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "14px 20px",
    fontSize: "16px",
    fontWeight: "700",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    boxShadow: "none",
    cursor: "not-allowed"
  },
  resultSection: {
    width: "100%",
    display: "flex",
    justifyContent: "center"
  },
  winnerCard: {
    backgroundColor: "#ffffff",
    border: "2px solid #22c55e",
    borderRadius: "12px",
    padding: "16px",
    width: "100%",
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    textAlign: "center",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  placeholderCard: {
    backgroundColor: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "18px 12px",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box"
  },
  badge: {
    alignSelf: "center",
    padding: "3px 10px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontWeight: "700",
    fontSize: "11px",
    borderRadius: "14px",
    textTransform: "uppercase"
  },
  greeting: {
    fontSize: "17px",
    fontWeight: "800",
    margin: "0",
    color: "#0f172a",
    wordBreak: "break-word"
  },
  commentBox: {
    backgroundColor: "#f8fafc",
    padding: "10px 12px",
    borderRadius: "8px",
    borderLeft: "3px solid #22c55e",
    textAlign: "left"
  },
  commentLabel: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "2px"
  },
  commentText: {
    margin: 0,
    fontSize: "13px",
    color: "#1e293b",
    lineHeight: "1.4",
    wordBreak: "break-word"
  },
  mediaContainer: {
    display: "flex",
    justifyContent: "center"
  },
  media: {
    maxWidth: "100%",
    maxHeight: "120px",
    borderRadius: "6px",
    objectFit: "contain"
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    marginTop: "6px"
  },
  linkButton: {
    backgroundColor: "#1877f2",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "700",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px"
  },
  copyBtn: {
    backgroundColor: "#e2e8f0",
    color: "#334155",
    border: "none",
    fontWeight: "600",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer"
  }
};
