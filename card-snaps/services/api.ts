
import { Deck, Note, Test, UserStats, UserProfile, ChatSession, ThemeMode, ColorScheme } from '../types';

// Storage Keys
const KEYS = {
    USER: 'cardsnaps_user',
    TOKEN: 'cardsnaps_token',
    DECKS: 'cardsnaps_decks',
    NOTES: 'cardsnaps_notes',
    TESTS: 'cardsnaps_tests',
    STATS: 'cardsnaps_stats',
    CHATS: 'cardsnaps_chats',
    COMMUNITY: 'cardsnaps_community_db' 
};

export interface CommunityItem {
    id: string;
    type: 'deck' | 'note';
    title: string;
    description: string;
    author: string;
    data: Deck | Note;
    downloads: number;
    timestamp: number;
}

// Dynamic API URL for Deployment vs Development
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// If local, assume server is on 3001. If deployed (same origin), use relative path.
// Note: If using Vite proxy in dev, /api is also fine, but explicit localhost:3001 ensures direct connection if proxy isn't set.
const API_URL = isLocal ? 'http://localhost:3001/api' : '/api';

class ApiService {
    private token: string | null = localStorage.getItem(KEYS.TOKEN);

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    private isOnline() {
        return typeof navigator !== 'undefined' && navigator.onLine;
    }

    // === LOCAL STORAGE HELPERS ===
    private getLocal<T>(key: string, defaultVal: T): T {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultVal;
        } catch (e) { return defaultVal; }
    }

    private setLocal(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // === AUTH ===
    isAuthenticated() {
        return !!this.token;
    }

    async login(email: string, password: string) {
        if (!this.isOnline()) throw new Error("Offline. Cannot login.");
        
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!res.ok) throw new Error("Login failed");
        const data = await res.json();
        this.token = data.token;
        localStorage.setItem(KEYS.TOKEN, data.token);
        localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
        return data.user;
    }

    async register(email: string, password: string, name: string) {
        if (!this.isOnline()) throw new Error("Offline. Cannot register.");

        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });

        if (!res.ok) throw new Error("Registration failed");
        const data = await res.json();
        this.token = data.token;
        localStorage.setItem(KEYS.TOKEN, data.token);
        localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
        return data.user;
    }

    async getMe() {
        if (this.token && this.isOnline()) {
            try {
                const res = await fetch(`${API_URL}/auth/me`, { headers: this.getHeaders() });
                if (res.ok) {
                    const user = await res.json();
                    this.setLocal(KEYS.USER, user);
                    return user;
                }
            } catch (e) { /* Fallback */ }
        }
        return this.getLocal(KEYS.USER, null);
    }

    async saveProfile(profile: UserProfile) {
        const current = this.getLocal(KEYS.USER, {});
        const updated = { ...current, ...profile };
        this.setLocal(KEYS.USER, updated);
        return updated;
    }

    async savePreferences(themeMode: string, colorScheme: string, enableSeasonal: boolean) {
        if (this.token && this.isOnline()) {
            fetch(`${API_URL}/user/preferences`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ themeMode, colorScheme, enableSeasonal })
            }).catch(e => console.warn(e));
        }
        const current = this.getLocal(KEYS.USER, {});
        const updated = { ...current, themeMode, colorScheme, enableSeasonal };
        this.setLocal(KEYS.USER, updated);
    }

    logout() {
        this.token = null;
        localStorage.removeItem(KEYS.TOKEN);
        localStorage.removeItem(KEYS.USER);
    }

    // === HYBRID DATA PATTERN: Try Server -> Fallback Local ===

    async getDecks(): Promise<Deck[]> {
        if (this.token && this.isOnline()) {
            try {
                const res = await fetch(`${API_URL}/decks`, { headers: this.getHeaders() });
                if (res.ok) {
                    const decks = await res.json();
                    this.setLocal(KEYS.DECKS, decks);
                    return decks;
                }
            } catch (e) { console.warn("Server offline, using cache"); }
        }
        return this.getLocal(KEYS.DECKS, []);
    }

    async createDeck(deck: Deck): Promise<Deck> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/decks`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(deck)
                });
            } catch (e) { console.warn("Save failed"); }
        }
        const decks = this.getLocal<Deck[]>(KEYS.DECKS, []);
        decks.unshift(deck);
        this.setLocal(KEYS.DECKS, decks);
        return deck;
    }

    async updateDeck(deck: Deck): Promise<void> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/decks/${deck.id}`, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify(deck)
                });
            } catch (e) { /* ignore */ }
        }
        const decks = this.getLocal<Deck[]>(KEYS.DECKS, []);
        const index = decks.findIndex(d => d.id === deck.id);
        if (index !== -1) {
            decks[index] = deck;
            this.setLocal(KEYS.DECKS, decks);
        }
    }

    async deleteDeck(id: string): Promise<void> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/decks/${id}`, { method: 'DELETE', headers: this.getHeaders() });
            } catch (e) { /* ignore */ }
        }
        let decks = this.getLocal<Deck[]>(KEYS.DECKS, []);
        decks = decks.filter(d => d.id !== id);
        this.setLocal(KEYS.DECKS, decks);
    }

    // === NOTES ===
    async getNotes(): Promise<Note[]> {
        if (this.token && this.isOnline()) {
            try {
                const res = await fetch(`${API_URL}/notes`, { headers: this.getHeaders() });
                if (res.ok) {
                    const notes = await res.json();
                    this.setLocal(KEYS.NOTES, notes);
                    return notes;
                }
            } catch(e) {}
        }
        return this.getLocal(KEYS.NOTES, []);
    }

    async saveNote(note: Note): Promise<Note> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/notes`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(note)
                });
            } catch(e) {}
        }
        const notes = this.getLocal<Note[]>(KEYS.NOTES, []);
        const index = notes.findIndex(n => n.id === note.id);
        if (index !== -1) notes[index] = note;
        else notes.unshift(note);
        this.setLocal(KEYS.NOTES, notes);
        return note;
    }

    async deleteNote(id: string): Promise<void> {
        if(this.token && this.isOnline()) {
            try { await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: this.getHeaders() }); } catch(e){}
        }
        let notes = this.getLocal<Note[]>(KEYS.NOTES, []);
        notes = notes.filter(n => n.id !== id);
        this.setLocal(KEYS.NOTES, notes);
    }

    // === TESTS ===
    async getTests(): Promise<Test[]> {
        if (this.token && this.isOnline()) {
            try {
                const res = await fetch(`${API_URL}/tests`, { headers: this.getHeaders() });
                if (res.ok) return await res.json();
            } catch(e){}
        }
        return this.getLocal(KEYS.TESTS, []);
    }

    async addTest(test: Test): Promise<Test> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/tests`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(test) });
            } catch(e){}
        }
        const tests = this.getLocal<Test[]>(KEYS.TESTS, []);
        tests.push(test);
        this.setLocal(KEYS.TESTS, tests);
        return test;
    }

    async deleteTest(id: string): Promise<void> {
        if (this.token && this.isOnline()) {
            try { await fetch(`${API_URL}/tests/${id}`, { method: 'DELETE', headers: this.getHeaders() }); } catch(e){}
        }
        let tests = this.getLocal<Test[]>(KEYS.TESTS, []);
        tests = tests.filter(t => t.id !== id);
        this.setLocal(KEYS.TESTS, tests);
    }

    // === STATS ===
    async getStats(): Promise<UserStats | null> {
        if (this.token && this.isOnline()) {
            try {
                const res = await fetch(`${API_URL}/stats`, { headers: this.getHeaders() });
                if (res.ok) {
                    const stats = await res.json();
                    if(stats) this.setLocal(KEYS.STATS, stats);
                    return stats;
                }
            } catch(e){}
        }
        return this.getLocal(KEYS.STATS, null);
    }

    async syncStats(stats: UserStats): Promise<void> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/stats`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(stats) });
            } catch(e){}
        }
        this.setLocal(KEYS.STATS, stats);
    }

    // === CHAT ===
    async getChatSessions(): Promise<ChatSession[]> {
        if (this.token && this.isOnline()) {
            try {
                const res = await fetch(`${API_URL}/chats`, { headers: this.getHeaders() });
                if (res.ok) return await res.json();
            } catch(e){}
        }
        return this.getLocal(KEYS.CHATS, []);
    }

    async saveChatSession(session: ChatSession): Promise<void> {
        if (this.token && this.isOnline()) {
            try {
                await fetch(`${API_URL}/chats`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(session) });
            } catch(e){}
        }
        const sessions = this.getLocal<ChatSession[]>(KEYS.CHATS, []);
        const index = sessions.findIndex(s => s.id === session.id);
        if (index !== -1) sessions[index] = session;
        else sessions.unshift(session);
        this.setLocal(KEYS.CHATS, sessions);
    }

    // === COMMUNITY ===
    async shareToCommunity(item: Deck | Note, type: 'deck' | 'note', authorName: string): Promise<void> {
        const sharedItem = {
            id: crypto.randomUUID(),
            type,
            title: item.title,
            description: (item as any).description || (item as any).subject || 'No description',
            author: authorName,
            data: item,
            downloads: 0,
            timestamp: Date.now()
        };

        // 1. Try server
        if (this.isOnline()) {
            try {
                await fetch(`${API_URL}/community`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sharedItem)
                });
            } catch (e) { console.warn("Community sync failed"); }
        }
        
        // 2. Local Simulation
        this._localShare(sharedItem);
    }

    async getCommunityItems(): Promise<CommunityItem[]> {
        if (this.isOnline()) {
            try {
                const response = await fetch(`${API_URL}/community`, { signal: AbortSignal.timeout(2500) });
                if (response.ok) {
                    const items = await response.json();
                    this.setLocal(KEYS.COMMUNITY, items);
                    return items;
                }
            } catch (e) { console.warn("Community fetch failed, using cache"); }
        }
        return this._localGetCommunity();
    }

    async incrementDownload(communityId: string): Promise<void> {
        this._localIncrement(communityId);
        if (this.isOnline()) {
            try {
                await fetch(`${API_URL}/community/${communityId}/download`, { method: 'POST' });
            } catch (e) { /* ignore */ }
        }
    }

    // --- Local Fallback Helpers ---
    private _localShare(item: any) {
        const community = this.getLocal<CommunityItem[]>(KEYS.COMMUNITY, []);
        if (!community.find(c => c.id === item.id)) {
            community.unshift(item);
            this.setLocal(KEYS.COMMUNITY, community);
        }
    }

    private _localGetCommunity(): CommunityItem[] {
        let community = this.getLocal<CommunityItem[]>(KEYS.COMMUNITY, []);
        if (community.length === 0) {
            // Seed if empty to ensure app doesn't look broken
            const seeds: CommunityItem[] = [
                {
                    id: 'seed-1', type: 'deck', title: 'Biology: Cell Structure', description: 'Deep dive into mitochondria and ribbons.', author: 'Dr. Science', downloads: 124, timestamp: Date.now(),
                    data: { id: 's1', title: 'Biology: Cell Structure', description: 'Deep dive into mitochondria.', cards: [{id:'c1', front:'Powerhouse?', back:'Mitochondria', color:'bg-green-100'}], createdAt: Date.now() } as Deck
                },
                {
                    id: 'seed-2', type: 'deck', title: 'Spanish Verbs 101', description: 'Essential conjugation for beginners.', author: 'Señorita A', downloads: 45, timestamp: Date.now() - 100000,
                    data: { id: 's2', title: 'Spanish Verbs 101', description: 'Conjugations.', cards: [{id:'c2', front:'Ser', back:'To be', color:'bg-orange-100'}], createdAt: Date.now() } as Deck
                },
                {
                    id: 'seed-3', type: 'note', title: 'Calculus Cheat Sheet', description: 'Derivatives and Integrals quick ref.', author: 'MathWhiz', downloads: 89, timestamp: Date.now() - 200000,
                    data: { id: 's3', title: 'Calculus Cheat Sheet', subject: 'Math', content: '<b>Power Rule:</b> nx^(n-1)', background: 'grid', createdAt: Date.now(), lastModified: Date.now() } as Note
                }
            ];
            community = seeds;
            this.setLocal(KEYS.COMMUNITY, seeds);
        }
        return community;
    }

    private _localIncrement(id: string) {
        const community = this.getLocal<CommunityItem[]>(KEYS.COMMUNITY, []);
        const index = community.findIndex(c => c.id === id);
        if (index !== -1) {
            community[index].downloads += 1;
            this.setLocal(KEYS.COMMUNITY, community);
        }
    }
}

export const api = new ApiService();
