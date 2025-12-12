"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.generateRandomNumber = generateRandomNumber;
exports.generateRandomString = generateRandomString;
exports.validatePassword = validatePassword;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.sanitizeFileName = sanitizeFileName;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.truncateText = truncateText;
exports.shuffleArray = shuffleArray;
exports.removeNullValues = removeNullValues;
exports.buildUrl = buildUrl;
exports.formatBytes = formatBytes;
exports.getDateRange = getDateRange;
exports.generateToken = generateToken;
exports.generateHash = generateHash;
exports.verifyHash = verifyHash;
exports.generateUUID = generateUUID;
exports.calculatePercentage = calculatePercentage;
exports.calculateAverage = calculateAverage;
exports.calculateMedian = calculateMedian;
exports.calculateStandardDeviation = calculateStandardDeviation;
var bcrypt = require("bcrypt");
var uuid_1 = require("uuid");
var crypto = require("crypto");
var date_fns_1 = require("date-fns");
/**
 * Текстээс slug үүсгэх
 */
function generateSlug(text) {
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
function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Санамсаргүй текст үүсгэх
 */
function generateRandomString(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Нууц үг шалгах
 */
function validatePassword(password) {
    var errors = [];
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
        errors: errors,
    };
}
/**
 * И-мэйл шалгах
 */
function validateEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Утасны дугаар шалгах
 */
function validatePhone(phone) {
    var phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(phone);
}
/**
 * Файлын нэр аюулгүй болгох
 */
function sanitizeFileName(filename) {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 255);
}
/**
 * Мөнгөн дүнг форматлах
 */
function formatCurrency(amount, currency) {
    if (currency === void 0) { currency = 'MNT'; }
    return new Intl.NumberFormat('mn-MN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
/**
 * Огноог форматлах
 */
function formatDate(date, formatString) {
    if (formatString === void 0) { formatString = 'yyyy-MM-dd'; }
    var dateObj = typeof date === 'string' ? new Date(date) : date;
    return (0, date_fns_1.format)(dateObj, formatString);
}
/**
 * Текст таслах
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
}
/**
 * Массив санамсаргүйээр холих
 */
function shuffleArray(array) {
    var _a;
    var shuffled = __spreadArray([], array, true);
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [shuffled[j], shuffled[i]], shuffled[i] = _a[0], shuffled[j] = _a[1];
    }
    return shuffled;
}
/**
 * Объектоос null/undefined утгуудыг устгах
 */
function removeNullValues(obj) {
    var result = {};
    for (var key in obj) {
        if (obj[key] != null) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * URL үүсгэх
 */
function buildUrl(baseUrl, params) {
    var url = new URL(baseUrl);
    Object.keys(params).forEach(function (key) {
        if (params[key] != null) {
            url.searchParams.append(key, String(params[key]));
        }
    });
    return url.toString();
}
/**
 * Хэмжээг форматлах
 */
function formatBytes(bytes, decimals) {
    if (decimals === void 0) { decimals = 2; }
    if (bytes === 0)
        return '0 Bytes';
    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * Хугацааны интервал үүсгэх
 */
function getDateRange(range, customStart, customEnd) {
    var now = new Date();
    switch (range) {
        case 'today':
            return {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: now,
            };
        case 'week':
            return {
                start: (0, date_fns_1.subDays)(now, 7),
                end: now,
            };
        case 'month':
            return {
                start: (0, date_fns_1.startOfMonth)(now),
                end: (0, date_fns_1.endOfMonth)(now),
            };
        case 'year':
            return {
                start: (0, date_fns_1.startOfYear)(now),
                end: (0, date_fns_1.endOfYear)(now),
            };
        case 'custom':
            return {
                start: customStart || (0, date_fns_1.subDays)(now, 30),
                end: customEnd || now,
            };
        default:
            return {
                start: (0, date_fns_1.subDays)(now, 30),
                end: now,
            };
    }
}
/**
 * Токен үүсгэх
 */
function generateToken(length) {
    if (length === void 0) { length = 32; }
    return crypto.randomBytes(length).toString('hex');
}
/**
 * Хэш үүсгэх
 */
function generateHash(text) {
    return __awaiter(this, void 0, void 0, function () {
        var salt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bcrypt.genSalt(10)];
                case 1:
                    salt = _a.sent();
                    return [2 /*return*/, bcrypt.hash(text, salt)];
            }
        });
    });
}
/**
 * Хэш шалгах
 */
function verifyHash(text, hash) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, bcrypt.compare(text, hash)];
        });
    });
}
/**
 * UUID үүсгэх
 */
function generateUUID() {
    return (0, uuid_1.v4)();
}
/**
 * Хувь тооцох
 */
function calculatePercentage(part, total) {
    if (total === 0)
        return 0;
    return (part / total) * 100;
}
/**
 * Дундаж утга тооцох
 */
function calculateAverage(numbers) {
    if (numbers.length === 0)
        return 0;
    var sum = numbers.reduce(function (a, b) { return a + b; }, 0);
    return sum / numbers.length;
}
/**
 * Медиан утга тооцох
 */
function calculateMedian(numbers) {
    if (numbers.length === 0)
        return 0;
    var sorted = __spreadArray([], numbers, true).sort(function (a, b) { return a - b; });
    var middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
}
/**
 * Стандарт хазайлт тооцох
 */
function calculateStandardDeviation(numbers) {
    if (numbers.length === 0)
        return 0;
    var avg = calculateAverage(numbers);
    var squareDiffs = numbers.map(function (value) { return Math.pow(value - avg, 2); });
    var avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}
