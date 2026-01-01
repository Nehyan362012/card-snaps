
import { GoogleGenAI, Type } from "@google/genai";
import { Card, Deck, ChatMessage, Exercise, DailyGoal, Test, UserStats } from "../types";

const getKey = () => {
    if (!process.env.API_KEY) {
        // Fallback for non-AI modes or graceful error handling
        return "dummy_key"; 
    }
    return process.env.API_KEY;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- RULE-BASED DECK GENERATOR (NO AI) ---
export const generateDeckFromContent = async (
    fileData: string | null, 
    mimeType: string | null, 
    textData: string | null, 
    instructions: string
): Promise<{title: string, description: string, cards: Omit<Card, 'id' | 'color'>[]}> => {
    
    // Simulate processing delay
    await delay(1500);

    const content = textData || "Generic Content";
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    const cards = sentences.slice(0, 10).map(s => {
        const words = s.trim().split(' ');
        const mid = Math.floor(words.length / 2);
        const front = words.slice(0, mid).join(' ') + "...";
        const back = "..." + words.slice(mid).join(' ');
        return { front, back };
    });

    if (cards.length === 0) {
        cards.push({ front: "Sample Question", back: "Sample Answer based on your input." });
    }

    return {
        title: "Generated Deck",
        description: "Created from your uploaded content using smart parsing.",
        cards: cards
    };
}

// --- LEARN MODE AI (KEPT AS REQUESTED) ---
export const generateGamifiedExercises = async (content: string, topic: string, count: number = 15, gradeLevel: string = "10th Grade"): Promise<Exercise[]> => {
    // Check if key is available, otherwise return fallback
    if (getKey() === "dummy_key") return [];

    const ai = new GoogleGenAI({ apiKey: getKey() });

    const getExerciseSchema = () => ({
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: [
                    'quiz', 'true_false', 'fill_blank', 'matching', 'unscramble', 
                    'timeline', 'flashcard_review', 'short_answer', 'ranking', 
                    'reaction', 'comparison', 'odd_one_out', 'analogy', 'classification',
                    'syntax_repair', 'connection', 'elimination', 'blind_spot', 'category_sort'
                ]},
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                pairs: { 
                    type: Type.ARRAY, 
                    items: {
                        type: Type.OBJECT,
                        properties: { left: { type: Type.STRING }, right: { type: Type.STRING } },
                        required: ["left", "right"]
                    }
                },
                events: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { 
                            id: { type: Type.STRING }, 
                            text: { type: Type.STRING },
                            order: { type: Type.INTEGER } 
                        },
                        required: ["id", "text", "order"]
                    }
                },
                categories: { type: Type.ARRAY, items: { type: Type.STRING } },
                dragItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                statements: { 
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { id: { type: Type.STRING }, text: { type: Type.STRING }, isCorrect: { type: Type.BOOLEAN } },
                        required: ["id", "text", "isCorrect"]
                    }
                },
                context: { type: Type.STRING }
            },
            required: ["type", "question", "correctAnswer"]
        }
    });

    const attemptGeneration = async (numQuestions: number): Promise<Exercise[]> => {
        const safeContext = content.length > 3000 ? content.substring(0, 3000) : content;
        
        const prompt = `
            Context: "${safeContext}"
            Topic: ${topic}
            Level: ${gradeLevel}
            
            Generate ${numQuestions} varied gamified exercises.
            Use a diverse mix of types.
        `;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: getExerciseSchema()
                }
            });

            if (!response.text) return [];
            return JSON.parse(response.text);
        } catch (e) {
            console.warn("Single batch generation failed", e);
            return [];
        }
    };

    try {
        const BATCH_SIZE = 8; 
        const totalBatches = Math.ceil(count / BATCH_SIZE);
        let allExercises: Exercise[] = [];

        for (let i = 0; i < totalBatches; i++) {
            const batchCount = (i === totalBatches - 1) ? count - (i * BATCH_SIZE) : BATCH_SIZE;
            if (batchCount > 0) {
                 if (i > 0) await delay(1500); 
                 const batchResults = await attemptGeneration(batchCount);
                 allExercises = [...allExercises, ...batchResults];
            }
        }
        
        return allExercises.map((ex: any) => ({
            ...ex,
            id: crypto.randomUUID() 
        }));

    } catch (e) {
        console.warn("Generation error:", e);
        return [];
    }
};

// --- LEARN MODE CHECK (KEPT AS REQUESTED) ---
export const checkAnswerWithAI = async (question: string, correctAnswer: string, userAnswer: string): Promise<{correct: boolean, feedback: string}> => {
    if (getKey() === "dummy_key") return { correct: true, feedback: "AI Offline: Answer accepted." };

    const ai = new GoogleGenAI({ apiKey: getKey() });
    const prompt = `
        Q: ${question}
        Correct Answer/Logic: ${correctAnswer}
        User Answer: ${userAnswer}
        Is the user correct? Return JSON {"correct": boolean, "feedback": string}. Be lenient with typos.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { 
                        correct: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ["correct", "feedback"]
                }
            }
        });
        return JSON.parse(response.text || '{"correct": false, "feedback": "AI Error"}');
    } catch(e) {
        return { correct: false, feedback: "Could not verify." };
    }
};

// --- RULE-BASED GOALS (NO AI) ---
export const generateDailyGoals = async (deckTitles: string[]): Promise<DailyGoal[]> => {
    await delay(500);
    const goals: DailyGoal[] = [
        { id: crypto.randomUUID(), description: 'Review 20 cards', type: 'review_cards', target: 20, current: 0, xpReward: 150, completed: false },
        { id: crypto.randomUUID(), description: 'Study for 15 minutes', type: 'study_time', target: 15, current: 0, xpReward: 300, completed: false },
        { id: crypto.randomUUID(), description: 'Complete 1 Perfect Session', type: 'perfect_score', target: 1, current: 0, xpReward: 500, completed: false }
    ];
    return goals;
}

// --- RULE-BASED CHAT (NO AI) ---
export const chatWithCardy = async (
    history: ChatMessage[], 
    newMessage: string, 
    newImage: string | null,
    userDecks: Deck[] = [],
    userTests: Test[] = [],
    userStats: UserStats | null = null
) => {
    await delay(800);
    const lowerMsg = newMessage.toLowerCase();

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) return "Hi there! Ready to study?";
    if (lowerMsg.includes('test') || lowerMsg.includes('exam')) {
        const nextTest = userTests.sort((a,b) => a.date - b.date)[0];
        if (nextTest) return `You have ${nextTest.title} coming up. Should we review topics for it?`;
        return "You don't have any upcoming tests marked. Want to add one in Preparation mode?";
    }
    if (lowerMsg.includes('stat') || lowerMsg.includes('xp') || lowerMsg.includes('level')) {
        return `You are Level ${userStats?.level || 1} with ${userStats?.xp || 0} XP. Keep it up!`;
    }
    if (lowerMsg.includes('deck') || lowerMsg.includes('card')) {
        return `You have ${userDecks.length} decks. I can help you review them in Learn Mode.`;
    }
    
    return "I'm your study companion. Ask me about your tests, decks, or stats! (AI Chat is currently offline for this mode)";
};
