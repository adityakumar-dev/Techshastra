import { createLocalStore, BaseEntity } from '../localStore';

export interface FAQ extends BaseEntity {
  question: string;
  answer: string;
  category?: string;
  order_index: number;
}

const store = createLocalStore<FAQ>('ts_faqs');

export const getFAQs = async (): Promise<FAQ[]> => {
  const faqs = store.getAll();
  return faqs.sort((a, b) => a.order_index - b.order_index);
};

export const addFAQ = async (faq: Omit<FAQ, 'id' | 'created_at'>): Promise<FAQ> => {
  return store.add(faq);
};

export const updateFAQ = async (id: string, updates: Partial<FAQ>): Promise<void> => {
  const result = store.update(id, updates);
  if (!result) throw new Error('FAQ not found');
};

export const deleteFAQ = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('FAQ not found');
};

export const updateFAQOrder = async (id: string, newOrder: number): Promise<void> => {
  await updateFAQ(id, { order_index: newOrder });
};
