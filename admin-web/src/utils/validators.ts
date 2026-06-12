/**
 * Туслах функцүүд
 */
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

const isNumber = (value: any): boolean => {
  if (isEmpty(value)) return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const isInteger = (value: any): boolean => {
  if (!isNumber(value)) return false;
  return Number.isInteger(Number(value));
};

const isEmail = (value: string): boolean => {
  if (isEmpty(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const isPhone = (value: string): boolean => {
  if (isEmpty(value)) return false;
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(value.replace(/\s/g, ''));
};

const isUrl = (value: string): boolean => {
  if (isEmpty(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isDate = (value: any): boolean => {
  if (isEmpty(value)) return false;
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Валидатор функцүүд
 */
export const validators = {
  required: (message?: string) => (value: any) => {
    if (isEmpty(value)) {
      return message || 'Энэ талбар шаардлагатай';
    }
    return undefined;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!isEmpty(value) && value.length < min) {
      return message || `Доод тал нь ${min} тэмдэгт байх ёстой`;
    }
    return undefined;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!isEmpty(value) && value.length > max) {
      return message || `Хамгийн ихдээ ${max} тэмдэгт байх ёстой`;
    }
    return undefined;
  },

  exactLength: (length: number, message?: string) => (value: string) => {
    if (!isEmpty(value) && value.length !== length) {
      return message || `Яг ${length} тэмдэгт байх ёстой`;
    }
    return undefined;
  },

  min: (min: number, message?: string) => (value: number | string) => {
    const num = Number(value);
    if (!isEmpty(value) && (isNaN(num) || num < min)) {
      return message || `${min}-аас их эсвэл тэнцүү байх ёстой`;
    }
    return undefined;
  },

  max: (max: number, message?: string) => (value: number | string) => {
    const num = Number(value);
    if (!isEmpty(value) && (isNaN(num) || num > max)) {
      return message || `${max}-аас бага эсвэл тэнцүү байх ёстой`;
    }
    return undefined;
  },

  email: (message?: string) => (value: string) => {
    if (!isEmpty(value) && !isEmail(value)) {
      return message || 'Хүчинтэй имэйл хаяг оруулна уу';
    }
    return undefined;
  },

  phone: (message?: string) => (value: string) => {
    if (!isEmpty(value) && !isPhone(value)) {
      return message || 'Хүчинтэй утасны дугаар оруулна уу';
    }
    return undefined;
  },

  url: (message?: string) => (value: string) => {
    if (!isEmpty(value) && !isUrl(value)) {
      return message || 'Хүчинтэй URL оруулна уу';
    }
    return undefined;
  },

  date: (message?: string) => (value: any) => {
    if (!isEmpty(value) && !isDate(value)) {
      return message || 'Хүчинтэй огноо оруулна уу';
    }
    return undefined;
  },

  dateAfter: (minDate: Date | string, message?: string) => (value: any) => {
    if (!isEmpty(value) && isDate(value)) {
      const date = new Date(value);
      const min = new Date(minDate);
      if (date <= min) {
        return message || `${formatDate(min)}-аас хойшхи огноо байх ёстой`;
      }
    }
    return undefined;
  },

  dateBefore: (maxDate: Date | string, message?: string) => (value: any) => {
    if (!isEmpty(value) && isDate(value)) {
      const date = new Date(value);
      const max = new Date(maxDate);
      if (date >= max) {
        return message || `${formatDate(max)}-аас өмнөх огноо байх ёстой`;
      }
    }
    return undefined;
  },

  number: (message?: string) => (value: any) => {
    if (!isEmpty(value) && !isNumber(value)) {
      return message || 'Тоо оруулна уу';
    }
    return undefined;
  },

  integer: (message?: string) => (value: any) => {
    if (!isEmpty(value) && !isInteger(value)) {
      return message || 'Бүхэл тоо оруулна уу';
    }
    return undefined;
  },

  positive: (message?: string) => (value: any) => {
    const num = Number(value);
    if (!isEmpty(value) && (isNaN(num) || num <= 0)) {
      return message || 'Эерэг тоо байх ёстой';
    }
    return undefined;
  },

  negative: (message?: string) => (value: any) => {
    const num = Number(value);
    if (!isEmpty(value) && (isNaN(num) || num >= 0)) {
      return message || 'Сөрөг тоо байх ёстой';
    }
    return undefined;
  },

  regex: (pattern: RegExp, message?: string) => (value: string) => {
    if (!isEmpty(value) && !pattern.test(value)) {
      return message || 'Формат буруу байна';
    }
    return undefined;
  },

  match: (fieldName: string, message?: string) => (value: any, allValues: any) => {
    if (!isEmpty(value) && value !== allValues[fieldName]) {
      return message || 'Утга таарахгүй байна';
    }
    return undefined;
  },

  password: (message?: string) => (value: string) => {
    if (!isEmpty(value)) {
      if (value.length < 8) {
        return message || 'Нууц үг доод тал нь 8 тэмдэгт байх ёстой';
      }
      if (!/[A-Z]/.test(value)) {
        return message || 'Нэг том үсэг агуулах ёстой';
      }
      if (!/[a-z]/.test(value)) {
        return message || 'Нэг жижиг үсэг агуулах ёстой';
      }
      if (!/\d/.test(value)) {
        return message || 'Нэг тоо агуулах ёстой';
      }
    }
    return undefined;
  },

  fileSize: (maxSize: number, message?: string) => (file: File) => {
    if (file && file.size > maxSize) {
      return message || `Файлын хэмжээ ${formatFileSize(maxSize)}-аас хэтрэхгүй байх ёстой`;
    }
    return undefined;
  },

  fileType: (allowedTypes: string[], message?: string) => (file: File) => {
    if (file && !allowedTypes.includes(file.type)) {
      return message || 'Зөвшөөрөгдөөгүй файлын төрөл';
    }
    return undefined;
  },
};

/**
 * Валидатор комбинаторууд
 */
export const validate = (validators: Array<(value: any, allValues?: any) => string | undefined>) => {
  return (value: any, allValues?: any) => {
    for (const validator of validators) {
      const error = validator(value, allValues);
      if (error) return error;
    }
    return undefined;
  };
};

export const validateAll = (validations: Record<string, any>) => {
  return (values: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    for (const [field, validator] of Object.entries(validations)) {
      if (validator) {
        const error = validator(values[field], values);
        if (error) {
          errors[field] = error;
        }
      }
    }
    
    return errors;
  };
};

// formatDate импорт хэрэгтэй
import { formatDate } from './formatters';
