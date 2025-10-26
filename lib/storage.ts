/**
 * Local Storage Utilities
 * Simple client-side storage for demo/hackathon purposes
 * In production, this would be replaced with a real database
 */

export interface StoredProject {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  duration: number;
  notes: string;
  skills: string[];
  milestones: Array<{
    title: string;
    budget: string;
    description: string;
  }>;
  escrowId: string;
  transactionHash?: string;
  clientAddress: string;
  createdAt: number;
  status: 'active' | 'funded' | 'in-progress' | 'completed';
}

const PROJECTS_KEY = 'stellar_projects';
const BIDS_KEY = 'stellar_bids';

/**
 * Save a project to localStorage
 */
export const saveProject = (project: StoredProject): void => {
  try {
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    console.log('✅ Project saved to localStorage:', project.id);
  } catch (error) {
    console.error('Error saving project:', error);
  }
};

/**
 * Get all projects from localStorage
 */
export const getProjects = (): StoredProject[] => {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
};

/**
 * Get a single project by ID
 */
export const getProject = (id: string): StoredProject | null => {
  try {
    const projects = getProjects();
    return projects.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
};

/**
 * Update a project
 */
export const updateProject = (id: string, updates: Partial<StoredProject>): void => {
  try {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      console.log('✅ Project updated:', id);
    }
  } catch (error) {
    console.error('Error updating project:', error);
  }
};

/**
 * Delete a project
 */
export const deleteProject = (id: string): void => {
  try {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
    console.log('✅ Project deleted:', id);
  } catch (error) {
    console.error('Error deleting project:', error);
  }
};

/**
 * Save a bid to localStorage
 */
export const saveBid = (bid: any): void => {
  try {
    const bids = getBids();
    bids.push(bid);
    localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
    console.log('✅ Bid saved to localStorage:', bid.bidId);
  } catch (error) {
    console.error('Error saving bid:', error);
  }
};

/**
 * Get all bids
 */
export const getBids = (): any[] => {
  try {
    const data = localStorage.getItem(BIDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting bids:', error);
    return [];
  }
};

/**
 * Get bids for a specific project
 */
export const getProjectBids = (projectId: string): any[] => {
  try {
    const bids = getBids();
    return bids.filter(b => b.projectId === projectId);
  } catch (error) {
    console.error('Error getting project bids:', error);
    return [];
  }
};

/**
 * Clear all data (for testing)
 */
export const clearAllData = (): void => {
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(BIDS_KEY);
  console.log('✅ All data cleared');
};
