export const getCaseInsensitiveRegex = (str) => new RegExp(`^${str.toLowerCase()}$`, 'i');
