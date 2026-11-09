import { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  History,
  Delete,
  RotateCcw,
  Calculator,
  FlaskConical,
  ArrowLeftRight,
  Percent,
  Clock3,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import "./App.css";

function App() {
  const soundRef = useRef(null);

  const playClickSound = () => {
    if (!soundRef.current) {
      soundRef.current = new Audio("/anime-ahh.mp3");
    }
    soundRef.current.currentTime = 0;
    soundRef.current.play().catch(() => {});
  };

  const [theme, setTheme] = useState(
    localStorage.getItem("calcora-theme") || "dark",
  );
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scientific, setScientific] = useState(false);
  const [activeTab, setActiveTab] = useState("Calculator");

  const [converterType, setConverterType] = useState("Length");
  const [convertFrom, setConvertFrom] = useState("Meter");
  const [convertTo, setConvertTo] = useState("Kilometer");
  const [convertValue, setConvertValue] = useState("1");

  const [percentageType, setPercentageType] = useState("of");
  const [percentageValue, setPercentageValue] = useState("20");
  const [percentageBase, setPercentageBase] = useState("100");

  const [angleMode, setAngleMode] = useState("DEG");
  const [error, setError] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("calcora-theme", theme);
  }, [theme]);

  const safeCalculate = (input) => {
    let exp = input
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**")
      .replace(/π/g, "Math.PI")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/%/g, "/100");

    if (!/^[0-9+\-*\/().,\sMathPIa-zA-Z]*$/.test(exp)) {
      throw new Error("Invalid expression");
    }

    if (/Math\.(?!PI|sqrt|sin|cos|tan|log10|log|abs)[a-zA-Z]+/.test(exp)) {
      throw new Error("Invalid function");
    }

    const result = Function('"use strict"; return (' + exp + ")")();

    if (!Number.isFinite(result)) {
      throw new Error("Math error");
    }

    return Number.parseFloat(result.toPrecision(12)).toString();
  };

  const calculate = () => {
    if (!expression.trim()) return;

    try {
      const result = safeCalculate(expression);

      setHistory((prev) =>
        [
          {
            expression,
            result,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 30),
      );

      setDisplay(result);
      setExpression("");
      setError(false);
    } catch {
      setDisplay("Error");
      setError(true);
    }
  };

  const handleInput = (value) => {
    playClickSound();
    setError(false);

    if (value === "AC") {
      setDisplay("0");
      setExpression("");
      return;
    }

    if (value === "DEL") {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }

    if (value === "=") {
      calculate();
      return;
    }

    if (value === "ANS") {
      setExpression((prev) => prev + display);
      return;
    }

    if (value === "±") {
      setExpression((prev) =>
        prev.startsWith("-") ? prev.slice(1) : "-" + (prev || display),
      );
      return;
    }

    if (["sin", "cos", "tan"].includes(value)) {
      const fn = angleMode === "DEG" ? `${value}((` : `${value}(`;
      setExpression((prev) => prev + fn);
      return;
    }

    if (["√", "log", "ln", "abs"].includes(value)) {
      setExpression((prev) => prev + `${value}(`);
      return;
    }

    if (value === "π") {
      setExpression((prev) => prev + "π");
      return;
    }

    if (value === "x²") {
      setExpression((prev) => prev + "^2");
      return;
    }

    if (value === "xʸ") {
      setExpression((prev) => prev + "^");
      return;
    }

    setExpression((prev) => prev + value);
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (/^[0-9.]$/.test(event.key)) handleInput(event.key);
      if (event.key === "+") handleInput("+");
      if (event.key === "-") handleInput("-");
      if (event.key === "*") handleInput("×");

      if (event.key === "/") {
        event.preventDefault();
        handleInput("÷");
      }

      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
      }

      if (event.key === "Backspace") handleInput("DEL");
      if (event.key === "Escape") handleInput("AC");
      if (event.key === "%") handleInput("%");
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const buttons = [
    ["AC", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "DEL", "="],
  ];

  const scientificButtons = [
    ["sin", "cos", "tan", "π"],
    ["√", "log", "ln", "abs"],
    ["x²", "xʸ", "(", ")"],
  ];

  const converterUnits = {
    Length: [
      "Meter",
      "Kilometer",
      "Centimeter",
      "Millimeter",
      "Mile",
      "Foot",
      "Inch",
    ],
    Weight: ["Kilogram", "Gram", "Milligram", "Pound", "Ounce"],
    Temperature: ["Celsius", "Fahrenheit", "Kelvin"],
    Speed: ["Meters/second", "Kilometers/hour", "Miles/hour"],
    Time: ["Second", "Minute", "Hour", "Day"],
    Volume: ["Liter", "Milliliter", "Gallon"],
    Data: ["Byte", "Kilobyte", "Megabyte", "Gigabyte", "Terabyte"],
  };

  const convertMeasurement = (value, from, to, type) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return "Invalid value";

    if (type === "Temperature") {
      let celsius;

      if (from === "Celsius") celsius = number;
      if (from === "Fahrenheit") celsius = ((number - 32) * 5) / 9;
      if (from === "Kelvin") celsius = number - 273.15;

      if (to === "Celsius") return celsius;
      if (to === "Fahrenheit") return (celsius * 9) / 5 + 32;
      if (to === "Kelvin") return celsius + 273.15;
    }

    const factors = {
      Length: {
        Meter: 1,
        Kilometer: 1000,
        Centimeter: 0.01,
        Millimeter: 0.001,
        Mile: 1609.344,
        Foot: 0.3048,
        Inch: 0.0254,
      },
      Weight: {
        Kilogram: 1,
        Gram: 0.001,
        Milligram: 0.000001,
        Pound: 0.45359237,
        Ounce: 0.0283495,
      },
      Speed: {
        "Meters/second": 1,
        "Kilometers/hour": 1 / 3.6,
        "Miles/hour": 0.44704,
      },
      Time: {
        Second: 1,
        Minute: 60,
        Hour: 3600,
        Day: 86400,
      },
      Volume: {
        Liter: 1,
        Milliliter: 0.001,
        Gallon: 3.78541,
      },
      Data: {
        Byte: 1,
        Kilobyte: 1000,
        Megabyte: 1000000,
        Gigabyte: 1000000000,
        Terabyte: 1000000000000,
      },
    };

    const units = factors[type];

    if (!units || units[from] == null || units[to] == null) {
      return "Invalid conversion";
    }

    return (number * units[from]) / units[to];
  };

  const conversionResult = convertMeasurement(
    convertValue,
    convertFrom,
    convertTo,
    converterType,
  );

  const percentageResult = (() => {
    const x = Number(percentageValue);
    const y = Number(percentageBase);

    if (percentageValue === "" || percentageBase === "") return "—";
    if (!Number.isFinite(x) || !Number.isFinite(y)) return "Invalid";

    let result;

    if (percentageType === "of") result = (x / 100) * y;
    if (percentageType === "is") {
      result = y === 0 ? null : (x / y) * 100;
    }
    if (percentageType === "increase") result = y + (y * x) / 100;
    if (percentageType === "decrease") result = y - (y * x) / 100;

    if (result === null) return "Cannot divide by zero";

    return (
      Number(result).toLocaleString("en-US", {
        maximumFractionDigits: 8,
      }) + (percentageType === "is" ? "%" : "")
    );
  })();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-symbol">O</div>
          <div>
            <h1>
              CALCORA<span>.</span>
            </h1>
            <small>AN ORA PRODUCT</small>
          </div>
        </div>

        <nav className="top-nav">
          {["Calculator", "Converter", "Percentage"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button
            className="icon-btn"
            title="History"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={19} />
          </button>

          <button
            className="icon-btn theme-btn"
            title="Switch theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> YOUR SMART CALCULATION SPACE
            </span>
            <h2>
              Calculate beyond <span>limits.</span>
            </h2>
            <p>
              Precision meets simplicity. Everything you need, in one place.
            </p>
          </div>

          <div className="date-label">
            <Clock3 size={15} />
            {new Date().toLocaleDateString()}
          </div>
        </section>

        {activeTab === "Calculator" ? (
          <section className="calculator-layout">
            <div className="calculator-card">
              <div className="calculator-header">
                <div>
                  <span className="card-label">CALCULATOR</span>
                  <h3>Standard & Scientific</h3>
                </div>

                <button
                  className="mode-btn"
                  onClick={() => setScientific(!scientific)}
                >
                  <FlaskConical size={15} />
                  {scientific ? "Scientific" : "Standard"}
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="display-area">
                <div className="expression">
                  {expression || "Ready to calculate"}
                </div>
                <div className={error ? "result error" : "result"}>
                  {expression || display}
                </div>
                <div className="display-footer">
                  <span>CALCORA ENGINE</span>
                  <button
                    className="angle-btn"
                    onClick={() =>
                      setAngleMode(angleMode === "DEG" ? "RAD" : "DEG")
                    }
                  >
                    {angleMode}
                  </button>
                </div>
              </div>

              {scientific && (
                <div className="scientific-grid">
                  {scientificButtons.flat().map((btn) => (
                    <button key={btn} onClick={() => handleInput(btn)}>
                      {btn}
                    </button>
                  ))}
                </div>
              )}

              <div className="keypad">
                {buttons.flat().map((btn) => (
                  <button
                    key={btn}
                    className={[
                      "key",
                      ["÷", "×", "-", "+"].includes(btn) ? "operator" : "",
                      btn === "=" ? "equals" : "",
                      ["AC", "±", "%", "DEL"].includes(btn) ? "utility" : "",
                      btn === "0" ? "zero" : "",
                    ].join(" ")}
                    onClick={() => handleInput(btn)}
                  >
                    {btn === "DEL" ? <Delete size={19} /> : btn}
                  </button>
                ))}
              </div>

              <div className="calculator-bottom">
                <button onClick={() => handleInput("AC")}>
                  <RotateCcw size={14} /> Clear all
                </button>
                <span>Keyboard supported</span>
              </div>
            </div>

            <aside className="side-panel">
              <div className="side-heading">
                <div>
                  <span className="card-label">ACTIVITY</span>
                  <h3>Recent calculations</h3>
                </div>
                <History size={20} />
              </div>

              {history.length === 0 ? (
                <div className="empty-history">
                  <div className="empty-icon">
                    <Calculator size={25} />
                  </div>
                  <h4>No calculations yet</h4>
                  <p>Your calculation history will appear here.</p>
                </div>
              ) : (
                <div className="history-list">
                  {history.slice(0, 8).map((item, index) => (
                    <button
                      className="history-item"
                      key={index}
                      onClick={() => {
                        setDisplay(item.result);
                        setExpression("");
                      }}
                    >
                      <span>{item.expression}</span>
                      <strong>= {item.result}</strong>
                    </button>
                  ))}
                </div>
              )}

              <button className="clear-history" onClick={() => setHistory([])}>
                <RotateCcw size={14} /> Clear history
              </button>
            </aside>
          </section>
        ) : activeTab === "Converter" ? (
          <section className="calculator-card tool-placeholder">
            <ArrowLeftRight size={30} />
            <h3>Unit Converter</h3>
            <p>Convert measurements instantly.</p>

            <select
              value={converterType}
              onChange={(e) => {
                const type = e.target.value;
                setConverterType(type);
                setConvertFrom(converterUnits[type][0]);
                setConvertTo(converterUnits[type][1]);
              }}
            >
              {Object.keys(converterUnits).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={convertValue}
              onChange={(e) => setConvertValue(e.target.value)}
              placeholder="Enter value"
            />

            <div className="converter-fields">
              <select
                value={convertFrom}
                onChange={(e) => setConvertFrom(e.target.value)}
              >
                {converterUnits[converterType].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <ArrowLeftRight size={20} />

              <select
                value={convertTo}
                onChange={(e) => setConvertTo(e.target.value)}
              >
                {converterUnits[converterType].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="conversion-result">
              <span>RESULT</span>
              <h2>
                {Number.isFinite(Number(conversionResult))
                  ? Number(conversionResult).toLocaleString("en-US", {
                      maximumFractionDigits: 8,
                    })
                  : conversionResult}
              </h2>
              <p>{convertTo}</p>
            </div>

            <button onClick={() => setActiveTab("Calculator")}>
              Back to calculator
            </button>
          </section>
        ) : (
          <section className="calculator-card tool-placeholder">
            <Percent size={30} />
            <h3>Percentage Calculator</h3>
            <p>Calculate percentages easily.</p>

            <select
              value={percentageType}
              onChange={(e) => setPercentageType(e.target.value)}
            >
              <option value="of">What is X% of Y?</option>
              <option value="is">X is what % of Y?</option>
              <option value="increase">Percentage Increase</option>
              <option value="decrease">Percentage Decrease</option>
            </select>

            <input
              type="number"
              value={percentageValue}
              onChange={(e) => setPercentageValue(e.target.value)}
              placeholder="Enter percentage or value"
            />

            <input
              type="number"
              value={percentageBase}
              onChange={(e) => setPercentageBase(e.target.value)}
              placeholder="Enter base value"
            />

            <div className="conversion-result">
              <span>RESULT</span>
              <h2>{percentageResult}</h2>
            </div>

            <button onClick={() => setActiveTab("Calculator")}>
              Back to calculator
            </button>
          </section>
        )}
      </main>

      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="side-heading">
              <h3>Calculation history</h3>
              <button
                className="icon-btn"
                onClick={() => setShowHistory(false)}
              >
                ×
              </button>
            </div>

            {history.length === 0 ? (
              <p>No history available yet.</p>
            ) : (
              history.map((item, index) => (
                <div className="history-item" key={index}>
                  <span>{item.expression}</span>
                  <strong>{item.result}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <footer className="footer">
        <span>
          Designed & Developed by <strong>Mohd Fawas</strong>
        </span>
        <span>CALCORA v1.0</span>
      </footer>
    </div>
  );
}

export default App;
