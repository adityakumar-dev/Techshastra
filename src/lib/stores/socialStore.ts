import { createLocalStore, BaseEntity } from '../localStore';

export type SocialPlatform = 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'other';

export interface SocialPost extends BaseEntity {
  platform: SocialPlatform;
  content: string;
  url: string;
  image_url?: string;
  posted_at: string;
  author?: string;
}

const store = createLocalStore<SocialPost>('ts_social_posts');

export const getSocialPosts = async (): Promise<SocialPost[]> => {
  return store.getAll();
};

export const addSocialPost = async (post: Omit<SocialPost, 'id' | 'created_at'>): Promise<SocialPost> => {
  return store.add(post);
};

export const updateSocialPost = async (id: string, updates: Partial<SocialPost>): Promise<void> => {
  const result = store.update(id, updates);
  if (!result) throw new Error('Social post not found');
};

export const deleteSocialPost = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('Social post not found');
};
