import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types/api.js';

export interface SessionState {
    id: string;
    model: string;
    temperature: number;
    messages: Message[];
    streamPosition: number;
    status: 'active' | 'paused' | 'completed' | 'error';
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

class SessionService {
    private static instance: SessionService;
    private sessions: Map<string, SessionState>;

    private constructor() {
        this.sessions = new Map();
    }

    public static getInstance(): SessionService {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }

    public createSession(model: string, temperature: number, messages: Message[]): SessionState {
        const session: SessionState = {
            id: uuidv4(),
            model,
            temperature,
            messages,
            streamPosition: 0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.sessions.set(session.id, session);
        return session;
    }

    public getSession(sessionId: string): SessionState | undefined {
        return this.sessions.get(sessionId);
    }

    public updateSession(sessionId: string, updates: Partial<SessionState>): SessionState | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        Object.assign(session, {
            ...updates,
            updatedAt: new Date()
        });

        this.sessions.set(sessionId, session);
        return session;
    }

    public updateStreamPosition(sessionId: string, position: number): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.streamPosition = position;
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
        }
    }

    public pauseSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'paused';
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
        }
    }

    public resumeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'active';
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
        }
    }

    public completeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'completed';
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
        }
    }

    public setError(sessionId: string, error: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.status = 'error';
            session.error = error;
            session.updatedAt = new Date();
            this.sessions.set(sessionId, session);
        }
    }

    public deleteSession(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    public cleanupOldSessions(maxAgeHours: number = 24): void {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            const age = (now.getTime() - session.updatedAt.getTime()) / (1000 * 60 * 60);
            if (age > maxAgeHours) {
                this.sessions.delete(sessionId);
            }
        }
    }

    // 获取会话统计信息
    public getStats(): {
        total: number;
        active: number;
        paused: number;
        completed: number;
        error: number;
    } {
        const stats = {
            total: this.sessions.size,
            active: 0,
            paused: 0,
            completed: 0,
            error: 0
        };

        for (const session of this.sessions.values()) {
            stats[session.status]++;
        }

        return stats;
    }
}

export default SessionService;
