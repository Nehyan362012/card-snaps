
// This file is currently unused in the deployed version. 
// Functionality is handled by server.js and api.ts.
// Kept for reference but commented out to prevent build errors.

/*
import PocketBase from 'pocketbase';
import { Deck, Note, Test, UserStats, UserProfile } from '../types';

export const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);

export const pbService = {
    logout() { pb.authStore.clear(); },
    // ... rest of the service
};
*/

export const pbService = {};
