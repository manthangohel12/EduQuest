/**
 * User utility functions for consistent user data handling
 */

/**
 * Get the display name for a user
 * @param {Object} user - User object from backend
 * @returns {string} Display name
 */
export const getDisplayName = (user) => {
  if (!user) return 'User';
  
  // If user has first_name and last_name, combine them
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  // If only first_name exists
  if (user.first_name) {
    return user.first_name;
  }
  
  // If only last_name exists
  if (user.last_name) {
    return user.last_name;
  }
  
  // If user has firstName and lastName (Node.js API format)
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  // If only firstName exists
  if (user.firstName) {
    return user.firstName;
  }
  
  // If only lastName exists
  if (user.lastName) {
    return user.lastName;
  }
  
  // Fallback to username or email
  if (user.username) {
    return user.username;
  }
  
  if (user.email) {
    return user.email.split('@')[0]; // Use email prefix
  }
  
  return 'User';
};

/**
 * Get the first letter of the display name for avatar
 * @param {Object} user - User object from backend
 * @returns {string} First letter of display name
 */
export const getDisplayInitial = (user) => {
  const displayName = getDisplayName(user);
  return displayName.charAt(0).toUpperCase();
};

/**
 * Get user's full name for forms (combines first and last name)
 * @param {Object} user - User object from backend
 * @returns {string} Full name
 */
export const getFullName = (user) => {
  if (!user) return '';
  
  // Django API format
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  // Node.js API format
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  // If only one name exists
  if (user.first_name) return user.first_name;
  if (user.firstName) return user.firstName;
  if (user.last_name) return user.last_name;
  if (user.lastName) return user.lastName;
  
  return '';
};

/**
 * Split full name into first and last name
 * @param {string} fullName - Full name string
 * @returns {Object} Object with firstName and lastName
 */
export const splitFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(' ');
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  return { firstName, lastName };
}; 