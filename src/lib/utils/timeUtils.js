/**
 * Formats a 24-hour time string (HH:MM) into a 12-hour format with AM/PM.
 * @param {string} timeStr - The time string in HH:MM format.
 * @returns {string} The formatted time string (e.g., "9:30 AM", "1:00 PM"). Returns empty string if input is invalid.
 */
export function formatTime(timeStr) {
  if (!timeStr || !/^[0-2][0-9]:[0-5][0-9]$/.test(timeStr)) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Adds a specified number of minutes to a 24-hour time string.
 * @param {string} timeStr - The starting time string in HH:MM format.
 * @param {number} minutes - The number of minutes to add.
 * @returns {string} The resulting time string in HH:MM format. Returns empty string if input is invalid.
 */
export function addMinutes(timeStr, minutes) {
  if (!timeStr || !/^[0-2][0-9]:[0-5][0-9]$/.test(timeStr) || typeof minutes !== 'number') return '';
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0); // Set seconds and milliseconds to 0
  return date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0');
} 