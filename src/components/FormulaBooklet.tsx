import { useState } from "react";
import { BookOpen, Search, X, ShieldAlert, Zap, Globe, Sparkles } from "lucide-react";

interface Formula {
  topic: string;
  name: string;
  equation: string;
  description: string;
  shortcut?: string;
}

interface SubjectFormulas {
  subject: string;
  categories: {
    categoryName: string;
    formulas: Formula[];
  }[];
}

const JEE_FORMULAS: SubjectFormulas[] = [
  {
    subject: "Physics",
    categories: [
      {
        categoryName: "Mechanics",
        formulas: [
          {
            topic: "Kinematics",
            name: "Equations of Motion (Constant Acceleration)",
            equation: "v = u + at \n S = ut + ½at² \n v² = u² + 2aS \n Sn = u + a/2(2n - 1)",
            description: "Used only when acceleration (a) is constant along a straight-line.",
            shortcut: "Average velocity V_avg = (u + v)/2"
          },
          {
            topic: "Work & Energy",
            name: "Work-Energy Theorem",
            equation: "W_total = ΔK = K_final - K_initial",
            description: "Work done by all forces (conservative, non-conservative, internal, external) equals change in kinetic energy."
          },
          {
            topic: "Rotational Dynamics",
            name: "Moment of Inertia of Standard Bodies",
            equation: "Ring: I = MR² \n Disc: I = ½MR² \n Solid Sphere: I = 2/5 MR² \n Hollow Sphere: I = 2/3 MR²",
            description: "Calculated about the central axis passing through the center of mass.",
            shortcut: "Parallel Axis Theorem: I = I_cm + Md²"
          },
          {
            topic: "Gravitation",
            name: "Escape Velocity",
            equation: "v_e = √(2GM / R)",
            description: "Minimum speed required for a body to escape from the gravitational influence of a planet."
          }
        ]
      },
      {
        categoryName: "Electrodynamics",
        formulas: [
          {
            topic: "Electrostatics",
            name: "Coulomb's Law & Electric Field",
            equation: "F = (1 / 4πε₀) * (q₁q₂ / r²) \n E = (1 / 4πε₀) * (q / r²)",
            description: "Force is directly proportional to product of charges and inversely to square of separation.",
            shortcut: "ε₀ = 8.854 × 10⁻¹² F/m"
          },
          {
            topic: "Gauss's Law",
            name: "Total Flux through Closed Surface",
            equation: "∮ E · dA = Q_enclosed / ε₀",
            description: "The net electric flux through any closed Gaussian surface is equal to 1/ε₀ times the net enclosed charge."
          },
          {
            topic: "Capacitance",
            name: "Parallel Plate Capacitor",
            equation: "C = K * ε₀ * A / d \n Energy stored: U = ½CV² = Q² / 2C",
            description: "Capacitance (C) increases by dielectric constant K when dielectric fills space.",
            shortcut: "Force between plates: F = Q² / (2 * ε₀ * A)"
          }
        ]
      }
    ]
  },
  {
    subject: "Chemistry",
    categories: [
      {
        categoryName: "Physical Chemistry",
        formulas: [
          {
            topic: "Gaseous State",
            name: "Ideal Gas Equation & Dalton's Law",
            equation: "P * V = n * R * T \n P_total = P_A + P_B + ...",
            description: "Relates pressure, volume, moles, temperature. R = 0.0821 L·atm/mol·K = 8.314 J/mol·K.",
            shortcut: "Molar volume at STP = 22.7 LITERS (or approx 22.4L)"
          },
          {
            topic: "Chemical Kinetics",
            name: "First Order Reaction Integrated Rate",
            equation: "k = (2.303 / t) * log( [A]₀ / [A]_t ) \n Half-life: t_½ = 0.693 / k",
            description: "Rate depends on concentration raised to first power. Acceleration rate factor decays exponentially."
          },
          {
            topic: "Thermodynamics",
            name: "Gibbs Free Energy & Spontaneity",
            equation: "ΔG = ΔH - T·ΔS \n ΔG° = -R·T·ln(K_eq)",
            description: "For spontaneity at constant T and P, ΔG < 0.",
            shortcut: "If ΔH < 0 and ΔS > 0, reaction is always spontaneous at all T."
          }
        ]
      },
      {
        categoryName: "Inorganic & Organic",
        formulas: [
          {
            topic: "Atomic Structure",
            name: "Bohr's Orbit Radius & Velocity",
            equation: "r_n = 0.529 * (n² / Z) Å \n v_n = 2.18 × 10⁶ * (Z / n) m/s",
            description: "Applicable only for single electron, hydrogen-like species (H, He⁺, Li²⁺)."
          },
          {
            topic: "Coordination Compounds",
            name: "Effective Atomic Number (EAN) Rule",
            equation: "EAN = Z - (Oxidation State) + 2 * (Coordination Number)",
            description: "If EAN equals the atomic number of the next noble gas, the complex is generally exceptionally stable."
          }
        ]
      }
    ]
  },
  {
    subject: "Mathematics",
    categories: [
      {
        categoryName: "Algebra & Coordinate Geometry",
        formulas: [
          {
            topic: "Quadratic Equations",
            name: "Roots, Discriminant & Symmetric Formulas",
            equation: "Roots: x = (-b ± √D) / 2a, where D = b² - 4ac \n α + β = -b/a \n α·β = c/a",
            description: "If D > 0 distinct real roots, D = 0 equal real roots, D < 0 complex conjugate roots."
          },
          {
            topic: "Circle",
            name: "Standard Equations & Tangents",
            equation: "Equation: x² + y² + 2gx + 2fy + c = 0 \n Center: (-g, -f) \n Radius: √(g² + f² - c)",
            description: "Tangents equation at (x₁, y₁): x*x₁ + y*y₁ + g(x + x₁) + f(y + y₁) + c = 0.",
            shortcut: "Tangent in slope form: y = m*x ± a√(1 + m²)"
          },
          {
            topic: "Parabola",
            name: "Standard Parabola y² = 4ax Properties",
            equation: "Focus: (a, 0) \n Directrix: x = -a \n Length of Latus Rectum: 4a",
            description: "Equation of tangent in slope form: y = m*x + a/m (m ≠ 0)."
          }
        ]
      },
      {
        categoryName: "Calculus",
        formulas: [
          {
            topic: "Limits & Derivatives",
            name: "Standard Limits (L'Hospital Rule)",
            equation: "lim_{x→0} (sin x / x) = 1 \n lim_{x→0} (e^x - 1)/x = 1 \n lim_{x→0} ln(1+x)/x = 1",
            description: "L'Hospital Rule is applicable only when limit is in 0/0 or ∞/∞ indeterminate form."
          },
          {
            topic: "Indefinite Integration",
            name: "Integration by Parts (LIATE)",
            equation: "∫ u · v dx = u ∫ v dx - ∫ [ u' · ∫ v dx ] dx",
            description: "Order of selecting first function (u): Logarithmic, Inverse trigonometric, Algebraic, Trigonometric, Exponential."
          }
        ]
      }
    ]
  }
];

interface FormulaBookletProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FormulaBooklet({ isOpen, onClose }: FormulaBookletProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("Physics");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const currentSubjectObj = JEE_FORMULAS.find((s) => s.subject === selectedSubject);

  // Filter formulas based on search query
  const filteredCategories = currentSubjectObj
    ? currentSubjectObj.categories
        .map((cat) => {
          const formulas = cat.formulas.filter(
            (f) =>
              f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.equation.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return { ...cat, formulas };
        })
        .filter((cat) => cat.formulas.length > 0)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/45 backdrop-blur-xs animate-fadeIn">
      <div className="h-full w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slideLeft">
        
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 leading-tight">JEE Formula Compendium</h3>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Physics • Chemistry • Mathematics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            id="close-formula-sheet"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input search bar & Subject selection tabs */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search equations, topics or formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue font-medium"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {["Physics", "Chemistry", "Mathematics"].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                  selectedSubject === sub
                    ? "bg-white text-brand-blue shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Categories / Equations scroll section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {filteredCategories.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <ShieldAlert className="h-8 w-8 text-slate-300 animate-pulse" />
              <h5 className="mt-2 text-xs font-bold text-slate-500">No formulas match query</h5>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">Try expanding your search parameters or check spelling.</p>
            </div>
          ) : (
            filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-2.5">
                <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-1">
                  {cat.categoryName}
                </h4>

                <div className="space-y-3">
                  {cat.formulas.map((val, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-1.5">
                        <span className="text-[11px] font-bold text-slate-800 leading-tight">{val.name}</span>
                        <span className="text-[9px] font-semibold text-brand-blue bg-blue-50/50 rounded-md px-1.5 py-0.5 font-mono capitalize">
                          {val.topic}
                        </span>
                      </div>

                      {/* Mathematical formula container */}
                      <pre className="bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg p-3 whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800">
                        <code>{val.equation}</code>
                      </pre>

                      <p className="text-[10px] text-slate-400 leading-normal font-sans font-medium">
                        {val.description}
                      </p>

                      {val.shortcut && (
                        <div className="mt-1 flex items-center gap-1.5 text-[9px] text-amber-700 bg-amber-50/30 border border-amber-100/55 rounded-md px-2 py-1 leading-normal font-sans">
                          <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-extrabold">Shortcut Tip:</span> {val.shortcut}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick diagnostic footer */}
        <div className="p-3.5 bg-slate-100/50 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-slate-400" />
            <span>NTA-READY RESOURCES</span>
          </span>
          <span className="flex items-center gap-0.5 text-brand-blue">
            <Sparkles className="h-3 w-3" />
            <span>AI REVISION TOOL</span>
          </span>
        </div>

      </div>
    </div>
  );
}
