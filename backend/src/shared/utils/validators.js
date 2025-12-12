"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllValuesBooleanConstraint = exports.IsValidUrlConstraint = exports.IsValidFileNameConstraint = exports.IsValidJSONConstraint = exports.IsUniqueArrayConstraint = exports.ArrayNotEmptyConstraint = exports.IsValidAmountConstraint = exports.IsDateInRangeConstraint = exports.IsFutureDateConstraint = exports.IsPastDateConstraint = exports.SumIs1Constraint = exports.SumIs100Constraint = void 0;
exports.SumIs100 = SumIs100;
exports.SumIs1 = SumIs1;
exports.IsPastDate = IsPastDate;
exports.IsFutureDate = IsFutureDate;
exports.IsDateInRange = IsDateInRange;
exports.IsValidAmount = IsValidAmount;
exports.ArrayNotEmpty = ArrayNotEmpty;
exports.IsUniqueArray = IsUniqueArray;
exports.IsValidJSON = IsValidJSON;
exports.IsValidFileName = IsValidFileName;
exports.IsValidUrl = IsValidUrl;
exports.AllValuesBoolean = AllValuesBoolean;
var class_validator_1 = require("class-validator");
/**
 * Баталгаажуулах функцүүд
 */
// Нийлбэр нь 100 байх ёстой
var SumIs100Constraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'sumIs100', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SumIs100Constraint = _classThis = /** @class */ (function () {
        function SumIs100Constraint_1() {
        }
        SumIs100Constraint_1.prototype.validate = function (values, args) {
            if (!Array.isArray(values))
                return false;
            var sum = values.reduce(function (a, b) { return a + b; }, 0);
            return Math.abs(sum - 100) < 0.01; // Төгсгөлийн алдаа
        };
        SumIs100Constraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u043D\u0438\u0439\u043B\u0431\u044D\u0440 \u043D\u044C 100 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return SumIs100Constraint_1;
    }());
    __setFunctionName(_classThis, "SumIs100Constraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SumIs100Constraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SumIs100Constraint = _classThis;
}();
exports.SumIs100Constraint = SumIs100Constraint;
function SumIs100(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: SumIs100Constraint,
        });
    };
}
// Нийлбэр нь 1 байх ёстой (хувь хэмжээ)
var SumIs1Constraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'sumIs1', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SumIs1Constraint = _classThis = /** @class */ (function () {
        function SumIs1Constraint_1() {
        }
        SumIs1Constraint_1.prototype.validate = function (values, args) {
            if (!Array.isArray(values))
                return false;
            var sum = values.reduce(function (a, b) { return a + b; }, 0);
            return Math.abs(sum - 1) < 0.0001; // Төгсгөлийн алдаа
        };
        SumIs1Constraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u043D\u0438\u0439\u043B\u0431\u044D\u0440 \u043D\u044C 1 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return SumIs1Constraint_1;
    }());
    __setFunctionName(_classThis, "SumIs1Constraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SumIs1Constraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SumIs1Constraint = _classThis;
}();
exports.SumIs1Constraint = SumIs1Constraint;
function SumIs1(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: SumIs1Constraint,
        });
    };
}
// Өнөөдрөөс өмнөх огноо
var IsPastDateConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isPastDate', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsPastDateConstraint = _classThis = /** @class */ (function () {
        function IsPastDateConstraint_1() {
        }
        IsPastDateConstraint_1.prototype.validate = function (date, args) {
            var dateObj = typeof date === 'string' ? new Date(date) : date;
            return dateObj < new Date();
        };
        IsPastDateConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u04E9\u043D\u04E9\u04E9\u0434\u0440\u04E9\u04E9\u0441 \u04E9\u043C\u043D\u04E9\u0445 \u043E\u0433\u043D\u043E\u043E \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsPastDateConstraint_1;
    }());
    __setFunctionName(_classThis, "IsPastDateConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsPastDateConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsPastDateConstraint = _classThis;
}();
exports.IsPastDateConstraint = IsPastDateConstraint;
function IsPastDate(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPastDateConstraint,
        });
    };
}
// Өнөөдрөөс хойш огноо
var IsFutureDateConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isFutureDate', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsFutureDateConstraint = _classThis = /** @class */ (function () {
        function IsFutureDateConstraint_1() {
        }
        IsFutureDateConstraint_1.prototype.validate = function (date, args) {
            var dateObj = typeof date === 'string' ? new Date(date) : date;
            return dateObj > new Date();
        };
        IsFutureDateConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u04E9\u043D\u04E9\u04E9\u0434\u0440\u04E9\u04E9\u0441 \u0445\u043E\u0439\u0448 \u043E\u0433\u043D\u043E\u043E \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsFutureDateConstraint_1;
    }());
    __setFunctionName(_classThis, "IsFutureDateConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsFutureDateConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsFutureDateConstraint = _classThis;
}();
exports.IsFutureDateConstraint = IsFutureDateConstraint;
function IsFutureDate(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsFutureDateConstraint,
        });
    };
}
// Хязгаарт байх огноо
var IsDateInRangeConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isDateInRange', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsDateInRangeConstraint = _classThis = /** @class */ (function () {
        function IsDateInRangeConstraint_1() {
        }
        IsDateInRangeConstraint_1.prototype.validate = function (date, args) {
            var _a = args.constraints, minDate = _a[0], maxDate = _a[1];
            var dateObj = typeof date === 'string' ? new Date(date) : date;
            var min = minDate ? new Date(minDate) : new Date('1900-01-01');
            var max = maxDate ? new Date(maxDate) : new Date('2100-12-31');
            return dateObj >= min && dateObj <= max;
        };
        IsDateInRangeConstraint_1.prototype.defaultMessage = function (args) {
            var _a = args.constraints, minDate = _a[0], maxDate = _a[1];
            return "".concat(args.property, " ").concat(minDate, " - ").concat(maxDate, " \u0445\u043E\u043E\u0440\u043E\u043D\u0434 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsDateInRangeConstraint_1;
    }());
    __setFunctionName(_classThis, "IsDateInRangeConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsDateInRangeConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsDateInRangeConstraint = _classThis;
}();
exports.IsDateInRangeConstraint = IsDateInRangeConstraint;
function IsDateInRange(minDate, maxDate, validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [minDate, maxDate],
            validator: IsDateInRangeConstraint,
        });
    };
}
// Мөнгөн дүн шалгах
var IsValidAmountConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isValidAmount', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsValidAmountConstraint = _classThis = /** @class */ (function () {
        function IsValidAmountConstraint_1() {
        }
        IsValidAmountConstraint_1.prototype.validate = function (amount, args) {
            if (typeof amount !== 'number')
                return false;
            if (amount < 0)
                return false;
            if (amount > 1000000000000)
                return false; // 1 их наяд
            return true;
        };
        IsValidAmountConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " 0-\u044D\u044D\u0441 \u0438\u0445, 1 \u0438\u0445 \u043D\u0430\u044F\u0434-\u0430\u0430\u0441 \u0431\u0430\u0433\u0430 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsValidAmountConstraint_1;
    }());
    __setFunctionName(_classThis, "IsValidAmountConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsValidAmountConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsValidAmountConstraint = _classThis;
}();
exports.IsValidAmountConstraint = IsValidAmountConstraint;
function IsValidAmount(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidAmountConstraint,
        });
    };
}
// Массив нь хоосон биш байх
var ArrayNotEmptyConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'arrayNotEmpty', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ArrayNotEmptyConstraint = _classThis = /** @class */ (function () {
        function ArrayNotEmptyConstraint_1() {
        }
        ArrayNotEmptyConstraint_1.prototype.validate = function (array, args) {
            return Array.isArray(array) && array.length > 0;
        };
        ArrayNotEmptyConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u0445\u043E\u043E\u0441\u043E\u043D \u0431\u0430\u0439\u0436 \u0431\u043E\u043B\u043E\u0445\u0433\u04AF\u0439");
        };
        return ArrayNotEmptyConstraint_1;
    }());
    __setFunctionName(_classThis, "ArrayNotEmptyConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ArrayNotEmptyConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ArrayNotEmptyConstraint = _classThis;
}();
exports.ArrayNotEmptyConstraint = ArrayNotEmptyConstraint;
function ArrayNotEmpty(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: ArrayNotEmptyConstraint,
        });
    };
}
// Утгууд өөр өөр байх
var IsUniqueArrayConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isUniqueArray', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsUniqueArrayConstraint = _classThis = /** @class */ (function () {
        function IsUniqueArrayConstraint_1() {
        }
        IsUniqueArrayConstraint_1.prototype.validate = function (array, args) {
            if (!Array.isArray(array))
                return false;
            var unique = new Set(array);
            return unique.size === array.length;
        };
        IsUniqueArrayConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u0434\u0430\u0445\u044C \u0443\u0442\u0433\u0443\u0443\u0434 \u04E9\u04E9\u0440 \u04E9\u04E9\u0440 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsUniqueArrayConstraint_1;
    }());
    __setFunctionName(_classThis, "IsUniqueArrayConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsUniqueArrayConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsUniqueArrayConstraint = _classThis;
}();
exports.IsUniqueArrayConstraint = IsUniqueArrayConstraint;
function IsUniqueArray(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueArrayConstraint,
        });
    };
}
// JSON объект шалгах
var IsValidJSONConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isValidJSON', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsValidJSONConstraint = _classThis = /** @class */ (function () {
        function IsValidJSONConstraint_1() {
        }
        IsValidJSONConstraint_1.prototype.validate = function (value, args) {
            if (typeof value === 'object' && value !== null)
                return true;
            if (typeof value === 'string') {
                try {
                    JSON.parse(value);
                    return true;
                }
                catch (_a) {
                    return false;
                }
            }
            return false;
        };
        IsValidJSONConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u0445\u04AF\u0447\u0438\u043D\u0442\u044D\u0439 JSON \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsValidJSONConstraint_1;
    }());
    __setFunctionName(_classThis, "IsValidJSONConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsValidJSONConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsValidJSONConstraint = _classThis;
}();
exports.IsValidJSONConstraint = IsValidJSONConstraint;
function IsValidJSON(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidJSONConstraint,
        });
    };
}
// Файлын нэр шалгах
var IsValidFileNameConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isValidFileName', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsValidFileNameConstraint = _classThis = /** @class */ (function () {
        function IsValidFileNameConstraint_1() {
        }
        IsValidFileNameConstraint_1.prototype.validate = function (filename, args) {
            if (typeof filename !== 'string')
                return false;
            // Хориглосон тэмдэгтүүд
            var forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/;
            if (forbiddenChars.test(filename))
                return false;
            // Тухайн нэрс
            var reservedNames = [
                'CON', 'PRN', 'AUX', 'NUL',
                'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
                'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
            ];
            var nameWithoutExt = filename.split('.')[0].toUpperCase();
            if (reservedNames.includes(nameWithoutExt))
                return false;
            // Урт шалгах
            if (filename.length > 255)
                return false;
            return true;
        };
        IsValidFileNameConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u0445\u04AF\u0447\u0438\u043D\u0442\u044D\u0439 \u0444\u0430\u0439\u043B\u044B\u043D \u043D\u044D\u0440 \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return IsValidFileNameConstraint_1;
    }());
    __setFunctionName(_classThis, "IsValidFileNameConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsValidFileNameConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsValidFileNameConstraint = _classThis;
}();
exports.IsValidFileNameConstraint = IsValidFileNameConstraint;
function IsValidFileName(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidFileNameConstraint,
        });
    };
}
// URL шалгах
var IsValidUrlConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'isValidUrl', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IsValidUrlConstraint = _classThis = /** @class */ (function () {
        function IsValidUrlConstraint_1() {
        }
        IsValidUrlConstraint_1.prototype.validate = function (url, args) {
            if (typeof url !== 'string')
                return false;
            try {
                var urlObj = new URL(url);
                return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
            }
            catch (_a) {
                return false;
            }
        };
        IsValidUrlConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u0445\u04AF\u0447\u0438\u043D\u0442\u044D\u0439 URL \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439 (http \u044D\u0441\u0432\u044D\u043B https)");
        };
        return IsValidUrlConstraint_1;
    }());
    __setFunctionName(_classThis, "IsValidUrlConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IsValidUrlConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IsValidUrlConstraint = _classThis;
}();
exports.IsValidUrlConstraint = IsValidUrlConstraint;
function IsValidUrl(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidUrlConstraint,
        });
    };
}
// Бүх утгууд boolean байх
var AllValuesBooleanConstraint = function () {
    var _classDecorators = [(0, class_validator_1.ValidatorConstraint)({ name: 'allValuesBoolean', async: false })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AllValuesBooleanConstraint = _classThis = /** @class */ (function () {
        function AllValuesBooleanConstraint_1() {
        }
        AllValuesBooleanConstraint_1.prototype.validate = function (obj, args) {
            if (typeof obj !== 'object' || obj === null)
                return false;
            return Object.values(obj).every(function (value) { return typeof value === 'boolean'; });
        };
        AllValuesBooleanConstraint_1.prototype.defaultMessage = function (args) {
            return "".concat(args.property, " \u0434\u0430\u0445\u044C \u0431\u04AF\u0445 \u0443\u0442\u0433\u0443\u0443\u0434 boolean \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043E\u0439");
        };
        return AllValuesBooleanConstraint_1;
    }());
    __setFunctionName(_classThis, "AllValuesBooleanConstraint");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AllValuesBooleanConstraint = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AllValuesBooleanConstraint = _classThis;
}();
exports.AllValuesBooleanConstraint = AllValuesBooleanConstraint;
function AllValuesBoolean(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: AllValuesBooleanConstraint,
        });
    };
}
