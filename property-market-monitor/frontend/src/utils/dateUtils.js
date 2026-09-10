import { formatDistanceToNow } from 'date-fns';

/**
 * Safely formats a date value to relative time ("3 days ago") without throwing.
 * Handles undefined, null, invalid dates, and date-fns parse errors.
 */
export const safeTimeAgo = (dateVal, fallback = 'Recently') => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (err) {
    return fallback;
  }
};

/**
 * Safely formats a date value to localized date string without throwing.
 */
export const safeFormatDate = (dateVal, fallback = 'N/A') => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString();
  } catch (err) {
    return fallback;
  }
};
