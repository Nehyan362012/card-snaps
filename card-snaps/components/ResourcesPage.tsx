
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BookOpen, Beaker, Calculator, Search, ArrowRightLeft, Ruler, Scale, Thermometer, Zap, Clock, ChevronDown, Check, Atom, FlaskConical, Info, Flame, Droplets, Filter, Plus, Minus, RotateCcw } from 'lucide-react';
import { soundService } from '../services/soundService';

// --- COMPOUNDS DATABASE (Robust) ---
const COMPOUNDS: Record<string, { name: string; formula: string; desc: string; type: 'acid' | 'base' | 'salt' | 'covalent' | 'organic' }> = {
    // Acids
    'Cl1H1': { name: 'Hydrochloric Acid', formula: 'HCl', desc: 'Strong acid found in stomach gastric juice.', type: 'acid' },
    'H2O4S1': { name: 'Sulfuric Acid', formula: 'H₂SO₄', desc: 'Most widely used industrial chemical.', type: 'acid' },
    'H1N1O3': { name: 'Nitric Acid', formula: 'HNO₃', desc: 'Highly corrosive mineral acid.', type: 'acid' },
    'C2H4O2': { name: 'Acetic Acid', formula: 'CH₃COOH', desc: 'Main component of vinegar.', type: 'acid' }, // C2 H4 O2
    'H3O4P1': { name: 'Phosphoric Acid', formula: 'H₃PO₄', desc: 'Used in soft drinks and fertilizers.', type: 'acid' },
    'C1H2O3': { name: 'Carbonic Acid', formula: 'H₂CO₃', desc: 'Forms when CO₂ dissolves in water.', type: 'acid' },

    // Bases
    'H1Na1O1': { name: 'Sodium Hydroxide', formula: 'NaOH', desc: 'Caustic soda, strong base used in soaps.', type: 'base' },
    'H1K1O1': { name: 'Potassium Hydroxide', formula: 'KOH', desc: 'Strong base used in batteries.', type: 'base' },
    'Ca1H2O2': { name: 'Calcium Hydroxide', formula: 'Ca(OH)₂', desc: 'Limewater.', type: 'base' },
    'H3N1': { name: 'Ammonia', formula: 'NH₃', desc: 'Weak base, common in cleaners.', type: 'base' },

    // Salts
    'Cl1Na1': { name: 'Sodium Chloride', formula: 'NaCl', desc: 'Table salt.', type: 'salt' },
    'Cl1K1': { name: 'Potassium Chloride', formula: 'KCl', desc: 'Salt substitute.', type: 'salt' },
    'C1Ca1O3': { name: 'Calcium Carbonate', formula: 'CaCO₃', desc: 'Chalk, limestone.', type: 'salt' },
    'C1Na2O3': { name: 'Sodium Carbonate', formula: 'Na₂CO₃', desc: 'Soda ash.', type: 'salt' },
    'C1H1Na1O3': { name: 'Sodium Bicarbonate', formula: 'NaHCO₃', desc: 'Baking soda.', type: 'salt' },
    'K1Mn1O4': { name: 'Potassium Permanganate', formula: 'KMnO₄', desc: 'Disinfectant.', type: 'salt' },

    // Common Molecules
    'H2O1': { name: 'Water', formula: 'H₂O', desc: 'Essential for life.', type: 'covalent' },
    'C1O2': { name: 'Carbon Dioxide', formula: 'CO₂', desc: 'Greenhouse gas.', type: 'covalent' },
    'C1O1': { name: 'Carbon Monoxide', formula: 'CO', desc: 'Toxic gas.', type: 'covalent' },
    'O2S1': { name: 'Sulfur Dioxide', formula: 'SO₂', desc: 'Volcanic gas.', type: 'covalent' },
    'H2O2': { name: 'Hydrogen Peroxide', formula: 'H₂O₂', desc: 'Antiseptic.', type: 'covalent' },
    
    // Organics
    'C1H4': { name: 'Methane', formula: 'CH₄', desc: 'Natural gas.', type: 'organic' },
    'C6H12O6': { name: 'Glucose', formula: 'C₆H₁₂O₆', desc: 'Simple sugar, energy source.', type: 'organic' },
    'C2H6O1': { name: 'Ethanol', formula: 'C₂H₅OH', desc: 'Alcohol.', type: 'organic' },
    'C6H6': { name: 'Benzene', formula: 'C₆H₆', desc: 'Aromatic hydrocarbon.', type: 'organic' },
    'C3H8': { name: 'Propane', formula: 'C₃H₈', desc: 'Fuel gas.', type: 'organic' },
    'C4H10': { name: 'Butane', formula: 'C₄H₁₀', desc: 'Lighter fluid.', type: 'organic' }
};

// --- PERIODIC TABLE DATA ---
const BASE_ELEMENTS = [
  // P1
  { n: 1, s: 'H', name: 'Hydrogen', m: 1.008, g: 'Nonmetal', c: 1, r: 1 },
  { n: 2, s: 'He', name: 'Helium', m: 4.002, g: 'Noble Gas', c: 18, r: 1 },
  // P2
  { n: 3, s: 'Li', name: 'Lithium', m: 6.94, g: 'Alkali Metal', c: 1, r: 2 },
  { n: 4, s: 'Be', name: 'Beryllium', m: 9.012, g: 'Alkaline Earth', c: 2, r: 2 },
  { n: 5, s: 'B', name: 'Boron', m: 10.81, g: 'Metalloid', c: 13, r: 2 },
  { n: 6, s: 'C', name: 'Carbon', m: 12.011, g: 'Nonmetal', c: 14, r: 2 },
  { n: 7, s: 'N', name: 'Nitrogen', m: 14.007, g: 'Nonmetal', c: 15, r: 2 },
  { n: 8, s: 'O', name: 'Oxygen', m: 15.999, g: 'Nonmetal', c: 16, r: 2 },
  { n: 9, s: 'F', name: 'Fluorine', m: 18.998, g: 'Halogen', c: 17, r: 2 },
  { n: 10, s: 'Ne', name: 'Neon', m: 20.180, g: 'Noble Gas', c: 18, r: 2 },
  // P3
  { n: 11, s: 'Na', name: 'Sodium', m: 22.990, g: 'Alkali Metal', c: 1, r: 3 },
  { n: 12, s: 'Mg', name: 'Magnesium', m: 24.305, g: 'Alkaline Earth', c: 2, r: 3 },
  { n: 13, s: 'Al', name: 'Aluminium', m: 26.982, g: 'Metal', c: 13, r: 3 },
  { n: 14, s: 'Si', name: 'Silicon', m: 28.085, g: 'Metalloid', c: 14, r: 3 },
  { n: 15, s: 'P', name: 'Phosphorus', m: 30.974, g: 'Nonmetal', c: 15, r: 3 },
  { n: 16, s: 'S', name: 'Sulfur', m: 32.06, g: 'Nonmetal', c: 16, r: 3 },
  { n: 17, s: 'Cl', name: 'Chlorine', m: 35.45, g: 'Halogen', c: 17, r: 3 },
  { n: 18, s: 'Ar', name: 'Argon', m: 39.948, g: 'Noble Gas', c: 18, r: 3 },
  // P4
  { n: 19, s: 'K', name: 'Potassium', m: 39.098, g: 'Alkali Metal', c: 1, r: 4 },
  { n: 20, s: 'Ca', name: 'Calcium', m: 40.078, g: 'Alkaline Earth', c: 2, r: 4 },
  { n: 21, s: 'Sc', name: 'Scandium', m: 44.956, g: 'Transition Metal', c: 3, r: 4 },
  { n: 22, s: 'Ti', name: 'Titanium', m: 47.867, g: 'Transition Metal', c: 4, r: 4 },
  { n: 23, s: 'V', name: 'Vanadium', m: 50.942, g: 'Transition Metal', c: 5, r: 4 },
  { n: 24, s: 'Cr', name: 'Chromium', m: 51.996, g: 'Transition Metal', c: 6, r: 4 },
  { n: 25, s: 'Mn', name: 'Manganese', m: 54.938, g: 'Transition Metal', c: 7, r: 4 },
  { n: 26, s: 'Fe', name: 'Iron', m: 55.845, g: 'Transition Metal', c: 8, r: 4 },
  { n: 27, s: 'Co', name: 'Cobalt', m: 58.933, g: 'Transition Metal', c: 9, r: 4 },
  { n: 28, s: 'Ni', name: 'Nickel', m: 58.693, g: 'Transition Metal', c: 10, r: 4 },
  { n: 29, s: 'Cu', name: 'Copper', m: 63.546, g: 'Transition Metal', c: 11, r: 4 },
  { n: 30, s: 'Zn', name: 'Zinc', m: 65.38, g: 'Transition Metal', c: 12, r: 4 },
  { n: 31, s: 'Ga', name: 'Gallium', m: 69.723, g: 'Metal', c: 13, r: 4 },
  { n: 32, s: 'Ge', name: 'Germanium', m: 72.63, g: 'Metalloid', c: 14, r: 4 },
  { n: 33, s: 'As', name: 'Arsenic', m: 74.922, g: 'Metalloid', c: 15, r: 4 },
  { n: 34, s: 'Se', name: 'Selenium', m: 78.96, g: 'Nonmetal', c: 16, r: 4 },
  { n: 35, s: 'Br', name: 'Bromine', m: 79.904, g: 'Halogen', c: 17, r: 4 },
  { n: 36, s: 'Kr', name: 'Krypton', m: 83.798, g: 'Noble Gas', c: 18, r: 4 },
  // P5
  { n: 37, s: 'Rb', name: 'Rubidium', m: 85.468, g: 'Alkali Metal', c: 1, r: 5 },
  { n: 38, s: 'Sr', name: 'Strontium', m: 87.62, g: 'Alkaline Earth', c: 2, r: 5 },
  { n: 39, s: 'Y', name: 'Yttrium', m: 88.906, g: 'Transition Metal', c: 3, r: 5 },
  { n: 40, s: 'Zr', name: 'Zirconium', m: 91.224, g: 'Transition Metal', c: 4, r: 5 },
  { n: 41, s: 'Nb', name: 'Niobium', m: 92.906, g: 'Transition Metal', c: 5, r: 5 },
  { n: 42, s: 'Mo', name: 'Molybdenum', m: 95.95, g: 'Transition Metal', c: 6, r: 5 },
  { n: 43, s: 'Tc', name: 'Technetium', m: 98, g: 'Transition Metal', c: 7, r: 5 },
  { n: 44, s: 'Ru', name: 'Ruthenium', m: 101.07, g: 'Transition Metal', c: 8, r: 5 },
  { n: 45, s: 'Rh', name: 'Rhodium', m: 102.91, g: 'Transition Metal', c: 9, r: 5 },
  { n: 46, s: 'Pd', name: 'Palladium', m: 106.42, g: 'Transition Metal', c: 10, r: 5 },
  { n: 47, s: 'Ag', name: 'Silver', m: 107.87, g: 'Transition Metal', c: 11, r: 5 },
  { n: 48, s: 'Cd', name: 'Cadmium', m: 112.41, g: 'Transition Metal', c: 12, r: 5 },
  { n: 49, s: 'In', name: 'Indium', m: 114.82, g: 'Metal', c: 13, r: 5 },
  { n: 50, s: 'Sn', name: 'Tin', m: 118.71, g: 'Metal', c: 14, r: 5 },
  { n: 51, s: 'Sb', name: 'Antimony', m: 121.76, g: 'Metalloid', c: 15, r: 5 },
  { n: 52, s: 'Te', name: 'Tellurium', m: 127.60, g: 'Metalloid', c: 16, r: 5 },
  { n: 53, s: 'I', name: 'Iodine', m: 126.90, g: 'Halogen', c: 17, r: 5 },
  { n: 54, s: 'Xe', name: 'Xenon', m: 131.29, g: 'Noble Gas', c: 18, r: 5 },
  // P6
  { n: 55, s: 'Cs', name: 'Caesium', m: 132.91, g: 'Alkali Metal', c: 1, r: 6 },
  { n: 56, s: 'Ba', name: 'Barium', m: 137.33, g: 'Alkaline Earth', c: 2, r: 6 },
  { n: 57, s: 'La', name: 'Lanthanum', m: 138.91, g: 'Lanthanide', c: 4, r: 8 },
  { n: 72, s: 'Hf', name: 'Hafnium', m: 178.49, g: 'Transition Metal', c: 4, r: 6 },
  { n: 73, s: 'Ta', name: 'Tantalum', m: 180.95, g: 'Transition Metal', c: 5, r: 6 },
  { n: 74, s: 'W', name: 'Tungsten', m: 183.84, g: 'Transition Metal', c: 6, r: 6 },
  { n: 75, s: 'Re', name: 'Rhenium', m: 186.21, g: 'Transition Metal', c: 7, r: 6 },
  { n: 76, s: 'Os', name: 'Osmium', m: 190.23, g: 'Transition Metal', c: 8, r: 6 },
  { n: 77, s: 'Ir', name: 'Iridium', m: 192.22, g: 'Transition Metal', c: 9, r: 6 },
  { n: 78, s: 'Pt', name: 'Platinum', m: 195.08, g: 'Transition Metal', c: 10, r: 6 },
  { n: 79, s: 'Au', name: 'Gold', m: 196.97, g: 'Transition Metal', c: 11, r: 6 },
  { n: 80, s: 'Hg', name: 'Mercury', m: 200.59, g: 'Transition Metal', c: 12, r: 6 },
  { n: 81, s: 'Tl', name: 'Thallium', m: 204.38, g: 'Metal', c: 13, r: 6 },
  { n: 82, s: 'Pb', name: 'Lead', m: 207.2, g: 'Metal', c: 14, r: 6 },
  { n: 83, s: 'Bi', name: 'Bismuth', m: 208.98, g: 'Metal', c: 15, r: 6 },
  { n: 84, s: 'Po', name: 'Polonium', m: 209, g: 'Metalloid', c: 16, r: 6 },
  { n: 85, s: 'At', name: 'Astatine', m: 210, g: 'Halogen', c: 17, r: 6 },
  { n: 86, s: 'Rn', name: 'Radon', m: 222, g: 'Noble Gas', c: 18, r: 6 },
  // P7
  { n: 87, s: 'Fr', name: 'Francium', m: 223, g: 'Alkali Metal', c: 1, r: 7 },
  { n: 88, s: 'Ra', name: 'Radium', m: 226, g: 'Alkaline Earth', c: 2, r: 7 },
  { n: 89, s: 'Ac', name: 'Actinium', m: 227, g: 'Actinide', c: 4, r: 9 },
  { n: 104, s: 'Rf', name: 'Rutherfordium', m: 267, g: 'Transition Metal', c: 4, r: 7 },
  { n: 105, s: 'Db', name: 'Dubnium', m: 268, g: 'Transition Metal', c: 5, r: 7 },
  { n: 106, s: 'Sg', name: 'Seaborgium', m: 269, g: 'Transition Metal', c: 6, r: 7 },
  { n: 107, s: 'Bh', name: 'Bohrium', m: 270, g: 'Transition Metal', c: 7, r: 7 },
  { n: 108, s: 'Hs', name: 'Hassium', m: 277, g: 'Transition Metal', c: 8, r: 7 },
  { n: 109, s: 'Mt', name: 'Meitnerium', m: 278, g: 'Transition Metal', c: 9, r: 7 },
  { n: 110, s: 'Ds', name: 'Darmstadtium', m: 281, g: 'Transition Metal', c: 10, r: 7 },
  { n: 111, s: 'Rg', name: 'Roentgenium', m: 282, g: 'Transition Metal', c: 11, r: 7 },
  { n: 112, s: 'Cn', name: 'Copernicium', m: 285, g: 'Transition Metal', c: 12, r: 7 },
  { n: 113, s: 'Nh', name: 'Nihonium', m: 286, g: 'Metal', c: 13, r: 7 },
  { n: 114, s: 'Fl', name: 'Flerovium', m: 289, g: 'Metal', c: 14, r: 7 },
  { n: 115, s: 'Mc', name: 'Moscovium', m: 290, g: 'Metal', c: 15, r: 7 },
  { n: 116, s: 'Lv', name: 'Livermorium', m: 293, g: 'Metal', c: 16, r: 7 },
  { n: 117, s: 'Ts', name: 'Tennessine', m: 294, g: 'Halogen', c: 17, r: 7 },
  { n: 118, s: 'Og', name: 'Oganesson', m: 294, g: 'Noble Gas', c: 18, r: 7 },
];

const LANTHANIDES = [
  { n: 58, s: 'Ce', name: 'Cerium', m: 140.12, g: 'Lanthanide', c: 5, r: 8 },
  { n: 59, s: 'Pr', name: 'Praseodymium', m: 140.91, g: 'Lanthanide', c: 6, r: 8 },
  { n: 60, s: 'Nd', name: 'Neodymium', m: 144.24, g: 'Lanthanide', c: 7, r: 8 },
  { n: 61, s: 'Pm', name: 'Promethium', m: 145, g: 'Lanthanide', c: 8, r: 8 },
  { n: 62, s: 'Sm', name: 'Samarium', m: 150.36, g: 'Lanthanide', c: 9, r: 8 },
  { n: 63, s: 'Eu', name: 'Europium', m: 151.96, g: 'Lanthanide', c: 10, r: 8 },
  { n: 64, s: 'Gd', name: 'Gadolinium', m: 157.25, g: 'Lanthanide', c: 11, r: 8 },
  { n: 65, s: 'Tb', name: 'Terbium', m: 158.93, g: 'Lanthanide', c: 12, r: 8 },
  { n: 66, s: 'Dy', name: 'Dysprosium', m: 162.50, g: 'Lanthanide', c: 13, r: 8 },
  { n: 67, s: 'Ho', name: 'Holmium', m: 164.93, g: 'Lanthanide', c: 14, r: 8 },
  { n: 68, s: 'Er', name: 'Erbium', m: 167.26, g: 'Lanthanide', c: 15, r: 8 },
  { n: 69, s: 'Tm', name: 'Thulium', m: 168.93, g: 'Lanthanide', c: 16, r: 8 },
  { n: 70, s: 'Yb', name: 'Ytterbium', m: 173.05, g: 'Lanthanide', c: 17, r: 8 },
  { n: 71, s: 'Lu', name: 'Lutetium', m: 174.97, g: 'Lanthanide', c: 18, r: 8 },
];

const ACTINIDES = [
  { n: 90, s: 'Th', name: 'Thorium', m: 232.04, g: 'Actinide', c: 5, r: 9 },
  { n: 91, s: 'Pa', name: 'Protactinium', m: 231.04, g: 'Actinide', c: 6, r: 9 },
  { n: 92, s: 'U', name: 'Uranium', m: 238.03, g: 'Actinide', c: 7, r: 9 },
  { n: 93, s: 'Np', name: 'Neptunium', m: 237, g: 'Actinide', c: 8, r: 9 },
  { n: 94, s: 'Pu', name: 'Plutonium', m: 244, g: 'Actinide', c: 9, r: 9 },
  { n: 95, s: 'Am', name: 'Americium', m: 243, g: 'Actinide', c: 10, r: 9 },
  { n: 96, s: 'Cm', name: 'Curium', m: 247, g: 'Actinide', c: 11, r: 9 },
  { n: 97, s: 'Bk', name: 'Berkelium', m: 247, g: 'Actinide', c: 12, r: 9 },
  { n: 98, s: 'Cf', name: 'Californium', m: 251, g: 'Actinide', c: 13, r: 9 },
  { n: 99, s: 'Es', name: 'Einsteinium', m: 252, g: 'Actinide', c: 14, r: 9 },
  { n: 100, s: 'Fm', name: 'Fermium', m: 257, g: 'Actinide', c: 15, r: 9 },
  { n: 101, s: 'Md', name: 'Mendelevium', m: 258, g: 'Actinide', c: 16, r: 9 },
  { n: 102, s: 'No', name: 'Nobelium', m: 259, g: 'Actinide', c: 17, r: 9 },
  { n: 103, s: 'Lr', name: 'Lawrencium', m: 266, g: 'Actinide', c: 18, r: 9 },
];

const ELEMENTS = [...BASE_ELEMENTS, ...LANTHANIDES, ...ACTINIDES];

const GROUP_COLORS: Record<string, string> = {
    'Nonmetal': 'bg-blue-500',
    'Noble Gas': 'bg-purple-500',
    'Alkali Metal': 'bg-red-500',
    'Alkaline Earth': 'bg-orange-500',
    'Metalloid': 'bg-teal-500',
    'Halogen': 'bg-yellow-500',
    'Metal': 'bg-slate-500',
    'Transition Metal': 'bg-indigo-500',
    'Lanthanide': 'bg-pink-500',
    'Actinide': 'bg-rose-600',
};

// --- FORMULAS ---
const generateFormulas = () => {
    const bases = [
        { c: 'Geometry', items: [['Rectangle Area', 'A = lw'], ['Circle Area', 'A = πr²'], ['Triangle Area', 'A = ½bh']] },
        { c: 'Algebra', items: [['Quadratic', 'x = (-b ± √Δ) / 2a'], ['Slope', 'm = Δy/Δx']] },
        { c: 'Physics', items: [['Force', 'F = ma'], ['Kinetic E', '½mv²'], ['Ohm Law', 'V = IR']] },
    ];
    let formulas: {title: string, formula: string, category: string}[] = [];
    bases.forEach(cat => {
        cat.items.forEach(item => formulas.push({ title: item[0], formula: item[1], category: cat.c }));
        for(let i=0; i<15; i++) formulas.push({ title: `${cat.c} Extra ${i}`, formula: 'x=y', category: cat.c });
    });
    return formulas;
};
const FORMULAS = generateFormulas();

// --- COMPONENTS ---

const Dropdown = ({ value, onChange, options, icon }: { value: string, onChange: (v: string) => void, options: string[], icon: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const clickOut = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', clickOut);
        return () => document.removeEventListener('mousedown', clickOut);
    }, []);
    return (
        <div className="relative w-full" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl">
                <div className="flex items-center gap-3"><span className="text-indigo-500">{icon}</span><span className="font-bold text-[var(--text-primary)] truncate">{value}</span></div>
                <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-2 backdrop-blur-xl">
                {options.map(opt => <button key={opt} onClick={() => {onChange(opt); setIsOpen(false);}} className="w-full text-left px-4 py-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--card-hover)] font-medium text-sm mb-1">{opt}</button>)}
            </div>}
        </div>
    );
};

export const ResourcesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'periodic' | 'formula' | 'converter'>('periodic');
    const [formulaSearch, setFormulaSearch] = useState('');
    
    // Periodic Table
    const [selection, setSelection] = useState<Record<string, number>>({}); // { 'H': 2, 'O': 1 }
    const [activeReaction, setActiveReaction] = useState<{name: string, formula: string, desc: string, type: string} | null>(null);
    const [mobileCategoryFilter, setMobileCategoryFilter] = useState('All');
    
    // Converter
    const [convCategory, setConvCategory] = useState('Length');
    const [convValue, setConvValue] = useState<string>('1');
    const [convFrom, setConvFrom] = useState('m');
    const [convTo, setConvTo] = useState('ft');

    // --- LOGIC ---

    const toggleElement = (symbol: string) => {
        soundService.playClick();
        setSelection(prev => {
            const next = { ...prev };
            if (next[symbol]) {
                delete next[symbol];
            } else {
                next[symbol] = 1;
            }
            return next;
        });
    };

    const updateCount = (symbol: string, delta: number) => {
        setSelection(prev => {
            const next = { ...prev };
            if (!next[symbol]) return next;
            next[symbol] = Math.max(1, next[symbol] + delta);
            return next;
        });
    };

    useEffect(() => {
        // Reaction Check
        const symbols = Object.keys(selection).sort();
        if (symbols.length === 0) { setActiveReaction(null); return; }

        let keyParts: string[] = [];
        symbols.forEach(sym => {
            keyParts.push(sym + selection[sym]);
        });
        const key = keyParts.join(''); // e.g. C6H12O6
        
        if (COMPOUNDS[key]) {
            setActiveReaction(COMPOUNDS[key]);
            soundService.playSuccess();
        } else {
            setActiveReaction(null);
        }
    }, [selection]);

    const CONVERTERS: any = {
        Length: { units: { 'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001, 'mi': 1609.34, 'yd': 0.9144, 'ft': 0.3048, 'in': 0.0254 }, icon: Ruler },
        Mass: { units: { 'kg': 1, 'g': 0.001, 'mg': 0.000001, 'lb': 0.453592, 'oz': 0.0283495 }, icon: Scale },
        Temperature: { units: { 'C': 'C', 'F': 'F', 'K': 'K' }, icon: Thermometer },
        Energy: { units: { 'J': 1, 'kJ': 1000, 'cal': 4.184, 'kcal': 4184, 'eV': 1.602e-19 }, icon: Zap },
        Time: { units: { 's': 1, 'min': 60, 'h': 3600, 'd': 86400, 'yr': 31536000 }, icon: Clock }
    };

    const convert = () => {
        const val = parseFloat(convValue);
        if (isNaN(val)) return '---';
        if (convCategory === 'Temperature') {
            if (convFrom === convTo) return val.toFixed(2);
            let c = val;
            if (convFrom === 'F') c = (val - 32) * 5/9;
            if (convFrom === 'K') c = val - 273.15;
            if (convTo === 'C') return c.toFixed(2);
            if (convTo === 'F') return ((c * 9/5) + 32).toFixed(2);
            if (convTo === 'K') return (c + 273.15).toFixed(2);
        } else {
            const factors = CONVERTERS[convCategory].units;
            const base = val * factors[convFrom];
            return (base / factors[convTo]).toPrecision(6);
        }
    };

    const filteredFormulas = useMemo(() => 
        FORMULAS.filter(f => f.title.toLowerCase().includes(formulaSearch.toLowerCase()) || f.category.toLowerCase().includes(formulaSearch.toLowerCase())), 
    [formulaSearch]);

    const categories = ['All', ...Array.from(new Set(ELEMENTS.map(e => e.g)))];
    const mobileElements = mobileCategoryFilter === 'All' ? ELEMENTS : ELEMENTS.filter(e => e.g === mobileCategoryFilter);

    // Grouping for mobile list view
    const groupedElements = useMemo(() => {
        const groups: Record<string, typeof ELEMENTS> = {};
        mobileElements.forEach(e => {
            if(!groups[e.g]) groups[e.g] = [];
            groups[e.g].push(e);
        });
        return groups;
    }, [mobileElements]);

    return (
        <div className="p-4 md:p-12 pt-20 md:pt-12 animate-fade-in-up pb-32 max-w-7xl mx-auto w-full">
            <div className="text-center mb-8 md:mb-10">
                <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 flex items-center justify-center gap-3">
                    <BookOpen className="w-8 h-8 md:w-12 md:h-12 text-indigo-500" /> Reference Hub
                </h1>
                <p className="text-[var(--text-secondary)] text-sm md:text-lg">Tools for STEM mastery.</p>
            </div>

            <div className="flex justify-center gap-3 md:gap-4 mb-8 md:mb-10 overflow-x-auto pb-2 no-scrollbar">
                {[ { id: 'periodic', label: 'Periodic Table', icon: Beaker }, { id: 'formula', label: 'Formulas', icon: Calculator }, { id: 'converter', label: 'Converter', icon: ArrowRightLeft }].map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); soundService.playClick(); }} className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all text-sm md:text-base ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                        <tab.icon className="w-4 h-4 md:w-5 md:h-5" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="glass-panel p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-[var(--glass-border)] min-h-[600px] flex flex-col relative overflow-hidden">
                
                {/* 1. Periodic Table */}
                {activeTab === 'periodic' && (
                    <div className="flex flex-col h-full animate-pop-in">
                        {/* Reaction / Info Header */}
                        <div className="mb-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--glass-border)] p-5 relative overflow-hidden">
                            {Object.keys(selection).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-24 text-[var(--text-tertiary)] opacity-60">
                                    <Atom className="w-8 h-8 mb-2 animate-spin-slow" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Select elements to experiment</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {/* Selection Tray */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 items-center">
                                        {Object.keys(selection).map(sym => {
                                            const el = ELEMENTS.find(e => e.s === sym);
                                            return (
                                                <div key={sym} className="flex-shrink-0 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-2 flex flex-col items-center min-w-[70px]">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mb-1 ${GROUP_COLORS[el?.g || ''] || 'bg-gray-500'}`}>{sym}</div>
                                                    <div className="flex items-center gap-2 bg-[var(--input-bg)] rounded-lg px-1">
                                                        <button onClick={() => updateCount(sym, -1)} className="p-1 hover:text-red-400"><Minus className="w-3 h-3"/></button>
                                                        <span className="text-sm font-bold w-4 text-center">{selection[sym]}</span>
                                                        <button onClick={() => updateCount(sym, 1)} className="p-1 hover:text-emerald-400"><Plus className="w-3 h-3"/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button onClick={() => { setSelection({}); soundService.playPop(); }} className="ml-2 p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button>
                                    </div>

                                    {/* Reaction Result */}
                                    {activeReaction ? (
                                        <div className="animate-scale-in p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${activeReaction.type === 'acid' ? 'bg-red-500' : activeReaction.type === 'base' ? 'bg-blue-500' : 'bg-emerald-500'} text-white shadow-lg`}>
                                                {activeReaction.type === 'acid' ? <Flame className="w-6 h-6"/> : <FlaskConical className="w-6 h-6"/>}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-[var(--text-primary)]">{activeReaction.name}</h3>
                                                <p className="text-xs font-mono text-[var(--text-secondary)]">{activeReaction.formula} • {activeReaction.desc}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-xs text-[var(--text-tertiary)] italic py-2">No known reaction found for this combination.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Controls */}
                        <div className="lg:hidden mb-4">
                            <Dropdown value={mobileCategoryFilter} onChange={setMobileCategoryFilter} options={categories} icon={<Filter className="w-4 h-4"/>} />
                        </div>

                        {/* TABLE: Mobile/Tablet List View (Visible below LG) */}
                        <div className="lg:hidden space-y-6 pb-20">
                            {Object.keys(groupedElements).map(cat => (
                                <div key={cat}>
                                    <h3 className="text-xs font-bold uppercase text-[var(--text-tertiary)] mb-2 pl-2 sticky top-0 bg-[var(--glass-bg)] backdrop-blur-md py-2 z-10">{cat}</h3>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                        {groupedElements[cat].map(el => {
                                            const isSel = !!selection[el.s];
                                            return (
                                                <button 
                                                    key={el.n}
                                                    onClick={() => toggleElement(el.s)}
                                                    onContextMenu={(e) => { e.preventDefault(); updateCount(el.s, 1); soundService.playPop(); }}
                                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 relative border transition-all active:scale-95 ${isSel ? 'ring-2 ring-white border-transparent z-10' : 'border-white/5 opacity-90'} ${GROUP_COLORS[el.g]}`}
                                                >
                                                    <span className="text-[8px] absolute top-1 left-1 opacity-70">{el.n}</span>
                                                    <span className="text-sm font-black text-white">{el.s}</span>
                                                    {isSel && <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">{selection[el.s]}</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TABLE: Desktop Grid View (Visible ONLY above LG) */}
                        <div className="hidden lg:block flex-1 overflow-y-auto custom-scrollbar pb-10">
                            <div className="grid grid-cols-[repeat(18,minmax(42px,1fr))] gap-1.5 min-w-[800px] mx-auto auto-rows-min">
                                {ELEMENTS.map((el) => {
                                    const isSel = !!selection[el.s];
                                    return (
                                        <button 
                                            key={el.n}
                                            onClick={() => toggleElement(el.s)}
                                            onContextMenu={(e) => { e.preventDefault(); updateCount(el.s, 1); soundService.playPop(); }}
                                            className={`aspect-[4/5] rounded-lg flex flex-col items-center justify-between p-1 text-[10px] font-bold transition-all duration-200 border relative overflow-visible ${
                                                isSel 
                                                ? 'scale-110 z-20 shadow-xl ring-2 ring-white border-transparent' 
                                                : `border-white/5 opacity-80 hover:opacity-100 hover:scale-110 hover:z-10`
                                            } ${GROUP_COLORS[el.g] || 'bg-slate-600'} text-white shadow-sm`}
                                            style={{ gridColumn: el.c, gridRow: el.r }}
                                            title="Right click to add more"
                                        >
                                            <span className="self-start opacity-70 leading-none text-[9px]">{el.n}</span>
                                            <span className="text-sm font-black leading-none my-auto">{el.s}</span>
                                            <span className="text-[8px] opacity-60 truncate w-full text-center">{el.name}</span>
                                            {isSel && <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg transform scale-90">{selection[el.s]}</div>}
                                        </button>
                                    );
                                })}
                                <div style={{gridColumn: 3, gridRow: 6}} className="text-[9px] text-white/30 flex items-center justify-center font-bold border border-white/10 rounded border-dashed">57-71</div>
                                <div style={{gridColumn: 3, gridRow: 7}} className="text-[9px] text-white/30 flex items-center justify-center font-bold border border-white/10 rounded border-dashed">89-103</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Formula Bank */}
                {activeTab === 'formula' && (
                    <div className="animate-pop-in flex flex-col h-full">
                        <div className="relative mb-6">
                            <input type="text" value={formulaSearch} onChange={(e) => setFormulaSearch(e.target.value)} placeholder="Search formulas..." className="w-full bg-[var(--input-bg)] glass-input border border-[var(--glass-border)] rounded-2xl py-3 pl-12 pr-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors shadow-inner" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-y-auto max-h-[600px] custom-scrollbar pr-1 pb-4">
                            {filteredFormulas.map((f, i) => (
                                <div key={i} className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--glass-border)] hover:bg-[var(--card-hover)] transition-all group">
                                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-[var(--text-primary)] text-sm">{f.title}</h3><span className="text-[9px] uppercase font-bold bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-lg border border-indigo-500/20">{f.category}</span></div>
                                    <div className="bg-[var(--glass-bg)] p-2 rounded-xl text-center font-mono text-sm md:text-base font-bold text-[var(--text-primary)] border border-[var(--glass-border)] shadow-inner break-all">{f.formula}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Unit Converter */}
                {activeTab === 'converter' && (
                    <div className="animate-pop-in max-w-xl mx-auto w-full">
                        <div className="flex justify-center gap-2 mb-8 flex-wrap">
                            {Object.keys(CONVERTERS).map(cat => {
                                const Icon = CONVERTERS[cat].icon;
                                return (
                                    <button key={cat} onClick={() => { setConvCategory(cat); setConvFrom(Object.keys(CONVERTERS[cat].units)[0]); setConvTo(Object.keys(CONVERTERS[cat].units)[1]); soundService.playClick(); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs md:text-sm font-bold ${convCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-[var(--input-bg)] border-[var(--glass-border)] hover:bg-[var(--card-hover)]'}`}>
                                        <Icon className="w-4 h-4" /> {cat}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="bg-[var(--input-bg)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--glass-border)] shadow-xl relative overflow-hidden">
                            <div className="flex flex-col gap-6">
                                <div><label className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2 block pl-2">Input</label><div className="flex flex-col md:flex-row gap-3"><input type="number" value={convValue} onChange={e => setConvValue(e.target.value)} className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-4 py-3 text-[var(--text-primary)] font-bold text-lg outline-none focus:border-indigo-500 transition-colors" /><div className="w-full md:w-40"><Dropdown value={convFrom} onChange={setConvFrom} options={Object.keys(CONVERTERS[convCategory].units)} icon={<div className="w-2 h-2 rounded-full bg-indigo-500"/>} /></div></div></div>
                                <div className="flex justify-center -my-2"><div className="bg-[var(--glass-bg)] p-2 rounded-full border border-[var(--glass-border)]"><ArrowRightLeft className="w-5 h-5 text-[var(--text-tertiary)] rotate-90 md:rotate-0" /></div></div>
                                <div><label className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2 block pl-2">Output</label><div className="flex flex-col md:flex-row gap-3"><div className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-2xl px-4 py-3 text-indigo-500 font-black text-xl flex items-center overflow-x-auto">{convert()}</div><div className="w-full md:w-40"><Dropdown value={convTo} onChange={setConvTo} options={Object.keys(CONVERTERS[convCategory].units)} icon={<div className="w-2 h-2 rounded-full bg-emerald-500"/>} /></div></div></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
