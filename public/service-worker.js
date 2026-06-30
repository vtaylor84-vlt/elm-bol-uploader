// public/service-worker.js (FINAL CORRECTED SCRIPT)

// Ensure idb-keyval is accessible by importing it
importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js');

// Custom store configuration (must match useQueue.ts)
const submissionStore = idbKeyval.createStore('bol-uploader-db', 'submissions');

self.addEventListener('install', (event) => {
    // Activate service worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim control over un-controlled clients
    event.waitUntil(self.clients.claim());
});


self.addEventListener('sync', (event) => {
    if (event.tag === 'bol-sync') {
        event.waitUntil(syncQueue());
    }
});

async function syncQueue() {
    const keys = await idbKeyval.keys(submissionStore);
    
    if (keys.length === 0) {
        console.log('Sync complete: Queue is empty.');
        return;
    }
    
    console.log(`Starting sync for ${keys.length} job(s)...`);

    // Use a variable to track if any sync was successful
    let successfullySynced = false;

    for (const key of keys) {
        const job = await idbKeyval.get(key, submissionStore);
        
        // Create FormData payload
        const formData = new FormData();
        
        // Append form data
        for (const [field, value] of Object.entries(job.data)) {
            formData.append(field, String(value));
        }
        
        // Append files (Blobs) and parallel category metadata for server-side validation
        job.files.forEach(f => {
            formData.append('files', f.blob, f.name);
        });
        formData.append(
            'fileCategories',
            JSON.stringify(job.files.map(f => f.category || 'bol'))
        );

        try {
            // Use the Netlify function endpoint
            const res = await fetch('/.netlify/functions/upload', { 
                method: 'POST', 
                body: formData 
            });
            
            if (res.ok) {
                // SUCCESS: Delete from local IndexedDB
                await idbKeyval.del(key, submissionStore);
                console.log(`Successfully synced and deleted job: ${key}`);
                successfullySynced = true;
                
                // Notify the client to update the queue count and show toast
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => client.postMessage({ 
                        type: 'SYNC_COMPLETE', 
                        loadId: job.data.loadNumber || job.data.bolNumber 
                    }));
                });

            } else {
                console.error(`Sync failed for job ${key}: Server error ${res.status}`);
                // If server returns an error, we stop and retry next sync cycle
                return; 
            }
        } catch (e) {
            console.error('Sync failed for job (Network Error)', key, e);
            // Stop sync: Network failure will trigger a retry on next sync event
            return; 
        }
    }
    
    // Only if the loop completes (all jobs processed, or stopped by a server error)
    if (successfullySynced) {
        console.log("All successful jobs processed. Final notification sent.");
    }
}