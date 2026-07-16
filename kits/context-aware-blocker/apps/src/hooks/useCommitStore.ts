import { create } from 'zustand';
import { BlockCommit } from '../types/store';
import { storage } from '../lib/storage';

/**
 * Defines the contract for the global commit state store.
 */
interface CommitState {
  commits: BlockCommit[];
  isLoaded: boolean;
  
  /** 
   * Hydrates the store with data from local storage.
   * @returns {Promise<void>}
   */
  loadCommits: () => Promise<void>;
  
  /**
   * Updates an existing commit in the store and persists it.
   * @param {BlockCommit} updatedCommit - The full commit object containing the edits.
   * @returns {Promise<void>}
   */
  saveCommit: (updatedCommit: BlockCommit) => Promise<void>;
  
  /**
   * Appends a new commit to the store and persists it.
   * @param {BlockCommit} newCommit - The newly constructed commit object.
   * @returns {Promise<void>}
   */
  addCommit: (newCommit: BlockCommit) => Promise<void>;
  
  /**
   * Removes a commit from the store by ID and persists the deletion.
   * @param {string} id - The unique identifier of the commit to delete.
   * @returns {Promise<void>}
   */
  deleteCommit: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'cab_commits';

/**
 * Initial fallback state if the local database is entirely empty.
 * Provides a highly discoverable first-run experience for the user.
 */
const defaultCommits: BlockCommit[] = [
  {
    id: "commit-summer",
    title: "Summer",
    iconName: "local_fire_department",
    showRisk: true,
    activeDays: ["mon", "tue", "wed", "thu", "fri"],
    timeWindows: [
      { id: "1", start: "9:00 AM", end: "5:00 PM" }
    ],
    blockedWebsites: [
      { id: "yt", url: "youtube.com", selected: true },
      { id: "tw", url: "twitter.com", selected: false }
    ],
    aiRules: ["Block distracting social media", "Block gaming content"]
  },
  {
    id: "commit-deep",
    title: "Deep Work",
    iconName: "psychiatry",
    showRisk: false,
    activeDays: ["mon", "tue", "wed"],
    timeWindows: [
      { id: "1", start: "1:00 PM", end: "4:00 PM" }
    ],
    blockedWebsites: [
      { id: "rd", url: "reddit.com", selected: true }
    ],
    aiRules: ["Block all news websites"]
  }
];

/**
 * Global Zustand store managing the state of focus commits (blocking rules).
 * 
 * This store serves as the single source of truth for the Next.js frontend UI.
 * It automatically handles persisting state down into the browser's storage engine.
 * 
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<CommitState>>}
 */
export const useCommitStore = create<CommitState>((set, get) => ({
  commits: [],
  isLoaded: false,

  loadCommits: async () => {
    // NOTE: Attempt to load from storage. Fallback to default if null.
    const saved = await storage.get<BlockCommit[] | null>(STORAGE_KEY, null);
    set({ 
      commits: saved ?? defaultCommits,
      isLoaded: true 
    });
    
    // NOTE: If it was null, initialize the storage immediately so the extension sync bridge picks it up.
    if (!saved) {
      await storage.set(STORAGE_KEY, defaultCommits);
    }
  },

  saveCommit: async (updatedCommit: BlockCommit) => {
    const { commits } = get();
    const newCommits = commits.map(c => c.id === updatedCommit.id ? updatedCommit : c);
    
    // NOTE: Perform an optimistic UI update for instant feedback before waiting on the disk write.
    set({ commits: newCommits });
    
    // TODO: Add error boundary here. If storage.set fails, we should rollback the optimistic UI update.
    await storage.set(STORAGE_KEY, newCommits);
  },

  addCommit: async (newCommit: BlockCommit) => {
    const { commits } = get();
    const newCommits = [...commits, newCommit];
    set({ commits: newCommits });
    await storage.set(STORAGE_KEY, newCommits);
  },

  deleteCommit: async (id: string) => {
    const { commits } = get();
    const newCommits = commits.filter(c => c.id !== id);
    set({ commits: newCommits });
    await storage.set(STORAGE_KEY, newCommits);
  }
}));
