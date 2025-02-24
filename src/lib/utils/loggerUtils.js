/**
 * Utility functions for consistent logging throughout the application
 */

/**
 * Simplifies objects for logging by removing circular references and large objects
 * @param {any} obj - The object to simplify
 * @returns {any} A simplified version of the object suitable for logging
 */
export function simplifyForLogging(obj) {
  if (Array.isArray(obj)) {
    return obj.map(simplifyForLogging);
  }
  if (obj && typeof obj === 'object') {
    // If this is a drill item, return only essential fields
    if (obj.type === 'drill') {
      return {
        id: obj.id || obj.drill?.id,
        type: obj.type,
        name: obj.name || obj.drill?.name,
        duration: obj.duration || obj.selected_duration
      };
    }
    // For section objects (and similar) that include drill items
    if (Array.isArray(obj.items)) {
      return {
        id: obj.id,
        name: obj.name,
        order: obj.order,
        goals: obj.goals,
        notes: obj.notes,
        items: simplifyForLogging(obj.items)
      };
    }
    // For any other object, only keep a few allowed keys
    const allowedKeys = ['id', 'name', 'order', 'goals', 'notes', 'type', 'duration', 'selected_duration'];
    const simplified = {};
    for (const key in obj) {
      if (allowedKeys.includes(key)) {
        simplified[key] = simplifyForLogging(obj[key]);
      }
    }
    return simplified;
  }
  return obj;
}

/**
 * Log state changes with proper formatting and sanitization
 * @param {string} message - Log message prefix
 * @param {any} data - The data to log
 */
export function logState(message, data) {
  try {
    let sanitizedData = data;
    if (typeof data === 'object' && data !== null) {
      sanitizedData = simplifyForLogging(data);
      // Convert to string for logging
      sanitizedData = JSON.parse(JSON.stringify(sanitizedData));
    }
    console.log(
      `[PracticePlanForm] ${message}:`,
      typeof sanitizedData === 'object'
        ? JSON.stringify(sanitizedData, null, 2)
        : sanitizedData
    );
  } catch (err) {
    console.log(
      `[PracticePlanForm] ${message}: [Unable to stringify data]`,
      typeof data === 'object' ? '[Complex object]' : data
    );
  }
}

/**
 * Log a debug message with a specific module context
 * @param {string} module - The module name
 * @param {string} message - The message to log
 * @param {any} data - Optional data to include
 */
export function logDebug(module, message, data = undefined) {
  if (data === undefined) {
    console.log(`[DEBUG][${module}] ${message}`);
  } else {
    try {
      console.log(`[DEBUG][${module}] ${message}:`, 
        typeof data === 'object' && data !== null
          ? JSON.stringify(simplifyForLogging(data), null, 2)
          : data
      );
    } catch (err) {
      console.log(`[DEBUG][${module}] ${message}: [Unable to stringify data]`);
    }
  }
}

/**
 * Log an error with a specific module context
 * @param {string} module - The module name
 * @param {string} message - The error message
 * @param {Error|any} error - The error object or data
 */
export function logError(module, message, error) {
  console.error(`[ERROR][${module}] ${message}:`, error);
  if (error instanceof Error && error.stack) {
    console.error(`[ERROR][${module}] Stack:`, error.stack);
  }
} 