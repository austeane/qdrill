export function formatInTz(dateLike, timeZone = 'UTC', options = {}) {
  try {
    let d;
    if (typeof dateLike === 'string') {
      const s = dateLike.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        // date-only: pick a safe midday UTC to avoid previous/next-day rollovers
        const [y, m, dd] = s.split('-').map(Number);
        d = new Date(Date.UTC(y, m - 1, dd, 12, 0, 0));
      } else {
        d = new Date(s);
      }
    } else if (dateLike instanceof Date) {
      d = new Date(dateLike.getTime());
    } else {
      d = new Date(dateLike);
    }

    if (isNaN(d.getTime())) return 'Invalid Date';

    try {
      return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(d);
    } catch (tzErr) {
      // Fallback if the runtime lacks the timezone data
      if (tzErr instanceof RangeError) {
        return new Intl.DateTimeFormat('en-US', { ...options }).format(d);
      }
      throw tzErr;
    }
  } catch (error) {
    console.error('Error formatting date:', error, { dateLike, timeZone });
    return 'Invalid Date';
  }
}

