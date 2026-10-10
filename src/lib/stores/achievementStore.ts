import { createLocalStore, BaseEntity } from '../localStore';

export interface Achievement extends BaseEntity {
  title: string;
  description: string;
  image_url?: string;
  date: string;
}

const store = createLocalStore<Achievement>('ts_achievements');

export const getAchievements = async (): Promise<Achievement[]> => {
  return store.getAll();
};

export const addAchievement = async (achievement: Omit<Achievement, 'id' | 'created_at'>): Promise<Achievement> => {
  return store.add(achievement);
};

export const updateAchievement = async (id: string, updates: Partial<Achievement>): Promise<void> => {
  const result = store.update(id, updates);
  if (!result) throw new Error('Achievement not found');
};

export const deleteAchievement = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('Achievement not found');
};
