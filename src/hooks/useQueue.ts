// src/hooks/useQueue.ts
import { useState, useEffect, useCallback } from 'react';
import { get, set, keys as getAllKeys, createStore } from 'idb-keyval';

// Custom store for submissions
const submissionStore = createStore('bol-uploader-db', 'submissions');

// Type for the submission object stored in IndexedDB
export interface QueuedJob {
  id: number;
  data: any; // FormState data
  files: { name: string, blob: Blob, type: string, category: 'bol' | 'freight' }[];
  timestamp: number;
}

export const useQueue = () => {
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateQueueCount = useCallback(async () => {
    try {
      const keys = await getAllKeys(submissionStore);
      setQueueCount(keys.length);
    } catch (error) {
      console.error("Failed to read queue keys:", error);
    }
  }, []);

  useEffect(() => {
    updateQueueCount();
    // Re-check count frequently
    const intervalId = setInterval(updateQueueCount, 15000); 

    // Listen for custom event triggered after successful sync
    const handleSyncComplete = () => {
      updateQueueCount();
      setIsSyncing(false);
    };
    // Attach listener to the window object where the Service Worker posts a message
    window.addEventListener('syncComplete', handleSyncComplete);

    // Listen for direct messages from the service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SYNC_COMPLETE') {
                handleSyncComplete();
            }
        });
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('syncComplete', handleSyncComplete);
    };
  }, [updateQueueCount]);

  const saveJob = useCallback(async (job: QueuedJob) => {
    const key = job.timestamp;
    try {
      await set(key, job, submissionStore);
      updateQueueCount();
      
      // Register Background Sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('bol-sync');
      }

      setIsSyncing(true);
      return key;
    } catch (error) {
      console.error("Failed to save job to queue:", error);
      throw new Error("Local storage failed.");
    }
  }, [updateQueueCount]);

  return { queueCount, saveJob, isSyncing };
};