/**
 * Simple in-memory storage for pending practice plans.
 * In a production scenario, this might be replaced with Redis, a database table with TTL,
 * or another persistent, expiring storage mechanism.
 */

const pendingPlans = new Map();

// Store pending plan data
async function save(token, data, expiresAt) {
    console.log(`[PendingPlanService] Saving plan for token ${token}, expires at ${expiresAt.toISOString()}`);
    pendingPlans.set(token, {
        data,
        expiresAt: expiresAt.getTime(), // Store expiry time as timestamp
    });
    // Basic cleanup of expired entries (could be improved with a dedicated interval)
    cleanupExpired(); 
}

// Retrieve pending plan data
async function get(token) {
    cleanupExpired(); // Clean before getting
    const entry = pendingPlans.get(token);
    if (entry) {
        console.log(`[PendingPlanService] Found plan for token ${token}`);
        return entry.data; // Return only the data part
    }
    console.log(`[PendingPlanService] Plan not found for token ${token}`);
    return null;
}

// Delete pending plan data
async function deletePlan(token) {
    const deleted = pendingPlans.delete(token);
    if (deleted) {
        console.log(`[PendingPlanService] Deleted plan for token ${token}`);
    } else {
        console.log(`[PendingPlanService] Attempted to delete non-existent plan for token ${token}`);
    }
}

// Helper to remove expired entries
function cleanupExpired() {
    const now = Date.now();
    let removedCount = 0;
    for (const [token, entry] of pendingPlans.entries()) {
        if (entry.expiresAt <= now) {
            pendingPlans.delete(token);
            removedCount++;
        }
    }
    if (removedCount > 0) {
        console.log(`[PendingPlanService] Cleaned up ${removedCount} expired pending plans.`);
    }
}

export const pendingPracticePlanService = {
    save,
    get,
    delete: deletePlan, // Export delete as 'delete'
    _cleanupExpired: cleanupExpired // Expose for potential testing or manual trigger
}; 