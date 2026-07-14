import { create } from 'zustand';
import { BlockCommit } from '../types/store';
import { storage } from '../lib/storage';

interface CommitState {
  commits: BlockCommit[];
  isLoaded: boolean;
  
  // Actions
  loadCommits: () => Promise<void>;
  saveCommit: (updatedCommit: BlockCommit) => Promise<void>;
  addCommit: (newCommit: BlockCommit) => Promise<void>;
  deleteCommit: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'cab_commits';

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

// ** PRODUCTION LEVEL STATE: Global Store Initialization ** //
export const useCommitStore = create<CommitState>((set, get) => ({
  commits: [],
  isLoaded: false,

  loadCommits: async () => {
    // ** PRODUCTION LEVEL LOGIC: Attempt to load from storage. Fallback to default. ** //
    const saved = await storage.get<BlockCommit[] | null>(STORAGE_KEY, null);
    set({ 
      commits: saved ?? defaultCommits,
      isLoaded: true 
    });
    
    // If it was null, initialize the storage with the defaults
    if (!saved) {
      await storage.set(STORAGE_KEY, defaultCommits);
    }
  },

  saveCommit: async (updatedCommit: BlockCommit) => {
    const { commits } = get();
    const newCommits = commits.map(c => c.id === updatedCommit.id ? updatedCommit : c);
    
    // ** PRODUCTION LEVEL LOGIC: Optimistic UI update ** //
    set({ commits: newCommits });
    
    // ** PRODUCTION LEVEL LOGIC: Persist to Tiny DB ** //
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
