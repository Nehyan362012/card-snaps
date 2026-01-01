
import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, RotateCcw, Percent, GraduationCap, CheckCircle2, Target, ArrowRight, ListTodo, Clock, Type, Shuffle, Calendar } from 'lucide-react';
import { soundService } from '../services/soundService';

interface Course { id: string; name: string; grade: string; credits: number; }
interface Todo { id: string; text: string; priority: 'high' | 'med' | 'low'; completed: boolean; }

const GRADE_POINTS: Record<string, number> = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 };

export const ToolsPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState(0);

    // 1. GPA Calculator
    const [courses, setCourses] = useState<Course[]>([{ id: '1', name: 'Math', grade: 'A', credits: 3 }]);
    const gpa = (() => {
        let pts = 0, creds = 0;
        courses.forEach(c => { pts += (GRADE_POINTS[c.grade] || 0) * c.credits; creds += c.credits; });
        return creds === 0 ? 0 : (pts / creds).toFixed(2);
    })();

    // 2. Final Grade
    const [currG, setCurrG] = useState('');
    const [wantG, setWantG] = useState('');
    const [weightG, setWeightG] = useState('');
    const [finalNeed, setFinalNeed] = useState<number | null>(null);

    // 3. Planner
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState('');

    // 4. Time Allocator
    const [hoursAvail, setHoursAvail] = useState('');
    const [subjects, setSubjects] = useState('');
    const [schedule, setSchedule] = useState<string[]>([]);

    // 5. Scrambler
    const [scrambleInput, setScrambleInput] = useState('');
    const [scrambleOutput, setScrambleOutput] = useState('');

    // --- Logic ---
    
    // GPA
    const addCourse = () => setCourses([...courses, { id: crypto.randomUUID(), name: '', grade: 'A', credits: 3 }]);
    const updateCourse = (id: string, k: keyof Course, v: any) => setCourses(courses.map(c => c.id === id ? { ...c, [k]: v } : c));

    // Final Grade
    const calcFinal = () => {
        const c = parseFloat(currG), w = parseFloat(wantG), f = parseFloat(weightG);
        if (isNaN(c) || isNaN(w) || isNaN(f)) return;
        setFinalNeed(parseFloat(((w - c * (1 - f / 100)) / (f / 100)).toFixed(1)));
        soundService.playSuccess();
    };

    // Planner
    const addTodo = () => {
        if (!newTodo.trim()) return;
        setTodos([...todos, { id: crypto.randomUUID(), text: newTodo, priority: 'med', completed: false }]);
        setNewTodo('');
        soundService.playClick();
    };
    const toggleTodo = (id: string) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        soundService.playPop();
    };

    // Allocator
    const generateSchedule = () => {
        const hrs = parseFloat(hoursAvail);
        const subs = subjects.split(',').filter(s => s.trim());
        if (isNaN(hrs) || subs.length === 0) return;
        
        const timePerSub = Math.floor((hrs * 60) / subs.length); // Minutes
        const sched = subs.map(s => `${s.trim()}: ${timePerSub} mins study + 5 min break`);
        setSchedule(sched);
        soundService.playSuccess();
    };

    // Scrambler
    const scramble = () => {
        const words = scrambleInput.split(' ');
        for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [words[i], words[j]] = [words[j], words[i]];
        }
        setScrambleOutput(words.join(' '));
        soundService.playPop();
    };

    const TOOLS = [
        { icon: GraduationCap, name: "GPA Calc" },
        { icon: Target, name: "Final Grade" },
        { icon: ListTodo, name: "Planner" },
        { icon: Clock, name: "Scheduler" },
        { icon: Shuffle, name: "Scrambler" }
    ];

    return (
        <div className="p-4 md:p-12 animate-fade-in-up pb-32">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-[var(--text-primary)]">Study Tools</h1>
            
            {/* Tool Nav */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
                {TOOLS.map((t, i) => (
                    <button 
                        key={i} 
                        onClick={() => { setActiveTool(i); soundService.playClick(); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTool === i ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <t.icon className="w-5 h-5" /> {t.name}
                    </button>
                ))}
            </div>

            <div className="max-w-4xl mx-auto glass-panel p-6 md:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-2xl min-h-[500px]">
                
                {/* 1. GPA Calculator */}
                {activeTool === 0 && (
                    <div className="animate-pop-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)]">GPA Calculator</h2>
                            <div className="text-3xl font-black text-indigo-500 bg-indigo-500/10 px-4 py-2 rounded-xl">{gpa}</div>
                        </div>
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {courses.map(c => (
                                <div key={c.id} className="flex gap-2 items-center bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--glass-border)]">
                                    <input className="flex-1 bg-transparent outline-none font-bold text-[var(--text-primary)]" value={c.name} onChange={e => updateCourse(c.id, 'name', e.target.value)} placeholder="Course" />
                                    <select className="bg-transparent font-mono font-bold text-[var(--text-secondary)] outline-none" value={c.grade} onChange={e => updateCourse(c.id, 'grade', e.target.value)}>
                                        {Object.keys(GRADE_POINTS).map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <input type="number" className="w-12 bg-transparent text-center font-bold text-[var(--text-secondary)] outline-none" value={c.credits} onChange={e => updateCourse(c.id, 'credits', Number(e.target.value))} />
                                    <button onClick={() => setCourses(courses.filter(x => x.id !== c.id))} className="text-red-400 hover:bg-red-500/10 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addCourse} className="w-full py-3 bg-[var(--input-bg)] border border-dashed border-[var(--text-tertiary)] text-[var(--text-tertiary)] font-bold rounded-xl hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all flex justify-center gap-2"><Plus className="w-5 h-5"/> Add Course</button>
                    </div>
                )}

                {/* 2. Final Grade */}
                {activeTool === 1 && (
                    <div className="animate-pop-in max-w-md mx-auto text-center">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Final Grade Estimator</h2>
                        <div className="space-y-4 mb-8">
                            <input type="number" placeholder="Current Grade (%)" value={currG} onChange={e => setCurrG(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-lg font-bold outline-none focus:border-indigo-500 text-center" />
                            <input type="number" placeholder="Desired Grade (%)" value={wantG} onChange={e => setWantG(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-lg font-bold outline-none focus:border-indigo-500 text-center" />
                            <input type="number" placeholder="Final Exam Weight (%)" value={weightG} onChange={e => setWeightG(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-lg font-bold outline-none focus:border-indigo-500 text-center" />
                        </div>
                        <button onClick={calcFinal} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all">Calculate</button>
                        {finalNeed !== null && (
                            <div className="mt-8 p-6 bg-[var(--input-bg)] rounded-3xl border border-[var(--glass-border)] animate-pop-in">
                                <div className="text-[var(--text-tertiary)] font-bold uppercase text-xs mb-2">You need to score</div>
                                <div className={`text-6xl font-black ${finalNeed > 100 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{finalNeed}%</div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Planner */}
                {activeTool === 2 && (
                    <div className="animate-pop-in flex flex-col h-[400px]">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Assignment Planner</h2>
                        <div className="flex gap-2 mb-6">
                            <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder="Add task..." className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] outline-none focus:border-indigo-500 font-medium" />
                            <button onClick={addTodo} className="p-3 bg-indigo-600 text-white rounded-xl"><Plus className="w-5 h-5"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {todos.map(t => (
                                <div key={t.id} onClick={() => toggleTodo(t.id)} className={`p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${t.completed ? 'bg-emerald-500/10 opacity-50 line-through' : 'bg-[var(--input-bg)] hover:bg-white/5'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--text-tertiary)]'}`}>{t.completed && <CheckCircle2 className="w-3 h-3 text-white"/>}</div>
                                    <span className="font-bold text-[var(--text-primary)]">{t.text}</span>
                                    <button onClick={(e) => {e.stopPropagation(); setTodos(todos.filter(x => x.id !== t.id))}} className="ml-auto text-[var(--text-tertiary)] hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {todos.length === 0 && <div className="text-center text-[var(--text-tertiary)] mt-10">No tasks yet.</div>}
                        </div>
                    </div>
                )}

                {/* 4. Scheduler */}
                {activeTool === 3 && (
                    <div className="animate-pop-in max-w-md mx-auto text-center">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Smart Scheduler</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-8">Divide your available time evenly.</p>
                        <div className="space-y-4 mb-8">
                            <input type="number" placeholder="Hours Available (e.g. 2.5)" value={hoursAvail} onChange={e => setHoursAvail(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] font-bold outline-none text-center" />
                            <input type="text" placeholder="Subjects (comma separated)" value={subjects} onChange={e => setSubjects(e.target.value)} className="w-full p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] font-bold outline-none text-center" />
                        </div>
                        <button onClick={generateSchedule} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all mb-8">Generate</button>
                        <div className="space-y-2 text-left">
                            {schedule.map((s, i) => (
                                <div key={i} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm flex items-center gap-2"><Clock className="w-4 h-4"/> {s}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Scrambler */}
                {activeTool === 4 && (
                    <div className="animate-pop-in text-center">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Text Scrambler</h2>
                        <textarea value={scrambleInput} onChange={e => setScrambleInput(e.target.value)} placeholder="Paste text to scramble for practice..." className="w-full h-32 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] outline-none resize-none mb-4 font-mono text-sm" />
                        <button onClick={scramble} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all mb-6 flex items-center gap-2 mx-auto"><Shuffle className="w-4 h-4"/> Scramble</button>
                        {scrambleOutput && (
                            <div className="p-6 bg-[var(--input-bg)] rounded-2xl border border-[var(--glass-border)] text-left font-mono text-sm text-[var(--text-primary)] break-words leading-relaxed">
                                {scrambleOutput}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};