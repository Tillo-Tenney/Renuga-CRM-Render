// Helper to convert snake_case to camelCase
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

// Helper to convert camelCase to snake_case
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      // Properly handle conversion to avoid leading underscores
      const snakeKey = key.replace(/([A-Z])/g, (match, letter, index) => 
        index > 0 ? '_' + letter.toLowerCase() : letter.toLowerCase()
      );
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

// Convert date strings to Date objects
export function parseDates(obj: any, dateFields: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map(item => parseDates(item, dateFields));
  } else if (obj !== null && typeof obj === 'object') {
    const result = { ...obj };
    dateFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field]);
      }
    });
    return result;
  }
  return obj;
}
