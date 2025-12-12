import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { format, subDays, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

/**
 * Текстээс slug үүсгэх
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * Санамсаргүй тоо үүсгэх
 */
export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Санамсаргүй текст үүсгэх
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Нууц үг шалгах
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Нууц үг дор хаяж 8 тэмдэгт байх ёстой');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Нууц үг дор хаяж 1 том үсэг агуулах ёстой');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Нууц үг дор хаяж 1 жижиг үсэг агуулах ёстой');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Нууц үг дор хаяж 1 тоо агуулах ёстой');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Нууц үг дор хаяж 1 тусгай тэмдэгт агуулах ёстой');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * И-мэйл шалгах
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Утасны дугаар шалгах
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Файлын нэр аюулгүй болгох
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Мөнгөн дүнг форматлах
 */
export function formatCurrency(amount: number, currency: string = 'MNT'): string {
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Огноог форматлах
 */
export function formatDate(date: Date | string, formatString: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
}

/**
 * Текст таслах
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Массив санамсаргүйээр холих
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Объектоос null/undefined утгуудыг устгах
 */
export function removeNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] != null) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * URL үүсгэх
 */
export function buildUrl(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] != null) {
      url.searchParams.append(key, String(params[key]));
    }
  });
  return url.toString();
}

/**
 * Хэмжээг форматлах
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Хугацааны интервал үүсгэх
 */
export function getDateRange(range: 'today' | 'week' | 'month' | 'year' | 'custom', customStart?: Date, customEnd?: Date) {
  const now = new Date();

  switch (range) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: now,
      };
    case 'week':
      return {
        start: subDays(now, 7),
        end: now,
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case 'custom':
      return {
        start: customStart || subDays(now, 30),
        end: customEnd || now,
      };
    default:
      return {
        start: subDays(now, 30),
        end: now,
      };
  }
}

/**
 * Токен үүсгэх
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Хэш үүсгэх
 */
export async function generateHash(text: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(text, salt);
}

/**
 * Хэш шалгах
 */
export async function verifyHash(text: string, hash: string): Promise<boolean> {
  return bcrypt.compare(text, hash);
}

/**
 * UUID үүсгэх
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Хувь тооцох
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Дундаж утга тооцох
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

/**
 * Медиан утга тооцох
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

/**
 * Стандарт хазайлт тооцох
 */
export function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const avg = calculateAverage(numbers);
  const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  
  return Math.sqrt(avgSquareDiff);
}