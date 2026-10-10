/**
 * Data Backup & Restore System
 * Export/import all localStorage data as JSON
 */

interface BackupData {
  version: string;
  exported_at: string;
  exported_by: string;
  data: {
    events: string | null;
    achievements: string | null;
    faqs: string | null;
    messages: string | null;
    social_posts: string | null;
    resources: string | null;
    projects: string | null;
    blog: string | null;
    gallery: string | null;
    publications: string | null;
    admin_credentials: string | null;
    activity_log: string | null;
  };
}

const STORAGE_KEYS = [
  'ts_events',
  'ts_achievements',
  'ts_faqs',
  'ts_messages',
  'ts_social_posts',
  'ts_resources',
  'techshastra_projects',
  'techshastra_blog_posts',
  'techshastra_gallery_images',
  'techshastra_publications',
  'ts_admin_credentials',
  'ts_activity_log',
];

/**
 * Export all localStorage data to JSON file
 */
export const exportAllData = (adminName: string = 'Admin'): void => {
  const backup: BackupData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    exported_by: adminName,
    data: {
      events: localStorage.getItem('ts_events'),
      achievements: localStorage.getItem('ts_achievements'),
      faqs: localStorage.getItem('ts_faqs'),
      messages: localStorage.getItem('ts_messages'),
      social_posts: localStorage.getItem('ts_social_posts'),
      resources: localStorage.getItem('ts_resources'),
      projects: localStorage.getItem('techshastra_projects'),
      blog: localStorage.getItem('techshastra_blog_posts'),
      gallery: localStorage.getItem('techshastra_gallery_images'),
      publications: localStorage.getItem('techshastra_publications'),
      admin_credentials: localStorage.getItem('ts_admin_credentials'),
      activity_log: localStorage.getItem('ts_activity_log'),
    },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `techshastra_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Import data from backup JSON file
 */
export const importAllData = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;

        // Validate backup structure
        if (!backup.version || !backup.data) {
          throw new Error('Invalid backup file format');
        }

        // Map backup keys to storage keys
        const keyMap: Record<string, string> = {
          events: 'ts_events',
          achievements: 'ts_achievements',
          faqs: 'ts_faqs',
          messages: 'ts_messages',
          social_posts: 'ts_social_posts',
          resources: 'ts_resources',
          projects: 'techshastra_projects',
          blog: 'techshastra_blog_posts',
          gallery: 'techshastra_gallery_images',
          publications: 'techshastra_publications',
          admin_credentials: 'ts_admin_credentials',
          activity_log: 'ts_activity_log',
        };

        // Restore data
        Object.entries(backup.data).forEach(([key, value]) => {
          const storageKey = keyMap[key];
          if (storageKey && value) {
            localStorage.setItem(storageKey, value);
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Clear all TECHSHASTRA data from localStorage
 */
export const clearAllData = (): void => {
  STORAGE_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Get total storage usage in KB
 */
export const getStorageSize = (): number => {
  let total = 0;
  STORAGE_KEYS.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      total += item.length;
    }
  });
  return Math.round(total / 1024); // Convert to KB
};

/**
 * Export individual store data
 */
export const exportStore = (storageKey: string, filename: string): void => {
  const data = localStorage.getItem(storageKey);
  if (!data) {
    throw new Error(`No data found for ${storageKey}`);
  }

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
