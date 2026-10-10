import { createLocalStore, BaseEntity } from '../localStore';

export interface ContactMessage extends BaseEntity {
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
}

const store = createLocalStore<ContactMessage>('ts_messages');

export const getMessages = async (): Promise<ContactMessage[]> => {
  return store.getAll();
};

export const addMessage = async (message: Omit<ContactMessage, 'id' | 'created_at'>): Promise<ContactMessage> => {
  return store.add(message);
};

export const markMessageRead = async (id: string, read: boolean = true): Promise<void> => {
  const result = store.update(id, { read });
  if (!result) throw new Error('Message not found');
};

export const deleteMessage = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('Message not found');
};
