/*
Purpose: User utility functions for PaySkill app. Provides helper functions for managing
user authentication state, retrieving user data from localStorage, and handling user
session management across the application.
*/

export interface UserData {
  id: string;
  phone: string;
  loginCount: number;
  lastLogin: string;
  createdAt: string;
}

export const getUserFromStorage = (): UserData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('PaySkill-user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

export const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const authFlag = localStorage.getItem('PaySkill-auth');
  const userData = getUserFromStorage();
  
  return authFlag === 'true' && userData !== null;
};

export const getUserPhone = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('PaySkill-phone');
};

export const clearUserSession = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('PaySkill-auth');
  localStorage.removeItem('PaySkill-phone');
  localStorage.removeItem('PaySkill-user');
};

export const formatLoginTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
