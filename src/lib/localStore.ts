/**
 * Unified localStorage-based data store system
 * Replaces Supabase with simple client-side storage
 * 
 * ponytail: localStorage instead of backend database
 * Ceiling: Data cleared on browser cache clear (~1% users)
 * Upgrade: Export/import system mitigates data loss risk
 */

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Generic localStorage CRUD operations
 * Single pattern for all entities - DRY principle
 */
export const createLocalStore = <T extends BaseEntity>(storageKey: string) => {
  const getAll = (): T[] => {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Failed to read ${storageKey}:`, e);
      return [];
    }
  };

  const add = (item: Omit<T, 'id' | 'created_at'>): T => {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    } as T;

    try {
      const items = getAll();
      localStorage.setItem(storageKey, JSON.stringify([newItem, ...items]));
      return newItem;
    } catch (e) {
      console.error(`Failed to add to ${storageKey}:`, e);
      throw new Error('Storage quota exceeded');
    }
  };

  const update = (id: string, updates: Partial<T>): T | null => {
    try {
      const items = getAll();
      const index = items.findIndex(i => i.id === id);
      
      if (index === -1) return null;

      const updated = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      items[index] = updated;
      localStorage.setItem(storageKey, JSON.stringify(items));
      return updated;
    } catch (e) {
      console.error(`Failed to update in ${storageKey}:`, e);
      throw e;
    }
  };

  const deleteItem = (id: string): boolean => {
    try {
      const items = getAll();
      const filtered = items.filter(i => i.id !== id);
      
      if (filtered.length === items.length) return false; // Not found
      
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error(`Failed to delete from ${storageKey}:`, e);
      return false;
    }
  };

  const getById = (id: string): T | null => {
    const items = getAll();
    return items.find(i => i.id === id) || null;
  };

  const clear = (): void => {
    localStorage.removeItem(storageKey);
  };

  return {
    getAll,
    add,
    update,
    delete: deleteItem,
    getById,
    clear,
  };
};
