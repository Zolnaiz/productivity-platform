"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
var typeorm_1 = require("typeorm");
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var bcrypt = require("bcrypt");
var base_entity_1 = require("./base.entity");
var organization_entity_1 = require("./organization.entity");
var response_entity_1 = require("./response.entity");
var expense_entity_1 = require("./expense.entity");
var report_entity_1 = require("./report.entity");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ORGANIZATION_ADMIN"] = "organization_admin";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING_VERIFICATION"] = "pending_verification";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var User = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('users'), (0, typeorm_1.Index)(['email'], { unique: true }), (0, typeorm_1.Index)(['username'], { unique: true })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
    var _instanceExtraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _username_decorators;
    var _username_initializers = [];
    var _username_extraInitializers = [];
    var _fullName_decorators;
    var _fullName_initializers = [];
    var _fullName_extraInitializers = [];
    var _password_decorators;
    var _password_initializers = [];
    var _password_extraInitializers = [];
    var _role_decorators;
    var _role_initializers = [];
    var _role_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _lastLoginAt_decorators;
    var _lastLoginAt_initializers = [];
    var _lastLoginAt_extraInitializers = [];
    var _phoneNumber_decorators;
    var _phoneNumber_initializers = [];
    var _phoneNumber_extraInitializers = [];
    var _avatarUrl_decorators;
    var _avatarUrl_initializers = [];
    var _avatarUrl_extraInitializers = [];
    var _emailVerified_decorators;
    var _emailVerified_initializers = [];
    var _emailVerified_extraInitializers = [];
    var _twoFactorEnabled_decorators;
    var _twoFactorEnabled_initializers = [];
    var _twoFactorEnabled_extraInitializers = [];
    var _loginAttempts_decorators;
    var _loginAttempts_initializers = [];
    var _loginAttempts_extraInitializers = [];
    var _lockedUntil_decorators;
    var _lockedUntil_initializers = [];
    var _lockedUntil_extraInitializers = [];
    var _preferences_decorators;
    var _preferences_initializers = [];
    var _preferences_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _responses_decorators;
    var _responses_initializers = [];
    var _responses_extraInitializers = [];
    var _expenses_decorators;
    var _expenses_initializers = [];
    var _expenses_extraInitializers = [];
    var _createdReports_decorators;
    var _createdReports_initializers = [];
    var _createdReports_extraInitializers = [];
    var _hashPassword_decorators;
    var User = _classThis = /** @class */ (function (_super) {
        __extends(User_1, _super);
        function User_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.email = (__runInitializers(_this, _instanceExtraInitializers), __runInitializers(_this, _email_initializers, void 0));
            _this.username = (__runInitializers(_this, _email_extraInitializers), __runInitializers(_this, _username_initializers, void 0));
            _this.fullName = (__runInitializers(_this, _username_extraInitializers), __runInitializers(_this, _fullName_initializers, void 0));
            _this.password = (__runInitializers(_this, _fullName_extraInitializers), __runInitializers(_this, _password_initializers, void 0));
            _this.role = (__runInitializers(_this, _password_extraInitializers), __runInitializers(_this, _role_initializers, void 0));
            _this.status = (__runInitializers(_this, _role_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.lastLoginAt = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _lastLoginAt_initializers, void 0));
            _this.phoneNumber = (__runInitializers(_this, _lastLoginAt_extraInitializers), __runInitializers(_this, _phoneNumber_initializers, void 0));
            _this.avatarUrl = (__runInitializers(_this, _phoneNumber_extraInitializers), __runInitializers(_this, _avatarUrl_initializers, void 0));
            _this.emailVerified = (__runInitializers(_this, _avatarUrl_extraInitializers), __runInitializers(_this, _emailVerified_initializers, void 0));
            _this.twoFactorEnabled = (__runInitializers(_this, _emailVerified_extraInitializers), __runInitializers(_this, _twoFactorEnabled_initializers, void 0));
            _this.loginAttempts = (__runInitializers(_this, _twoFactorEnabled_extraInitializers), __runInitializers(_this, _loginAttempts_initializers, void 0));
            _this.lockedUntil = (__runInitializers(_this, _loginAttempts_extraInitializers), __runInitializers(_this, _lockedUntil_initializers, void 0));
            _this.preferences = (__runInitializers(_this, _lockedUntil_extraInitializers), __runInitializers(_this, _preferences_initializers, void 0));
            // Relations
            _this.organization = (__runInitializers(_this, _preferences_extraInitializers), __runInitializers(_this, _organization_initializers, void 0));
            _this.responses = (__runInitializers(_this, _organization_extraInitializers), __runInitializers(_this, _responses_initializers, void 0));
            _this.expenses = (__runInitializers(_this, _responses_extraInitializers), __runInitializers(_this, _expenses_initializers, void 0));
            _this.createdReports = (__runInitializers(_this, _expenses_extraInitializers), __runInitializers(_this, _createdReports_initializers, void 0));
            __runInitializers(_this, _createdReports_extraInitializers);
            return _this;
        }
        // Methods
        User_1.prototype.hashPassword = function () {
            return __awaiter(this, void 0, void 0, function () {
                var salt, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!this.password) return [3 /*break*/, 3];
                            return [4 /*yield*/, bcrypt.genSalt(10)];
                        case 1:
                            salt = _b.sent();
                            _a = this;
                            return [4 /*yield*/, bcrypt.hash(this.password, salt)];
                        case 2:
                            _a.password = _b.sent();
                            _b.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        User_1.prototype.validatePassword = function (password) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, bcrypt.compare(password, this.password)];
                });
            });
        };
        User_1.prototype.incrementLoginAttempts = function () {
            this.loginAttempts += 1;
            if (this.loginAttempts >= 5) {
                this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
            }
        };
        User_1.prototype.resetLoginAttempts = function () {
            this.loginAttempts = 0;
            this.lockedUntil = null;
        };
        User_1.prototype.isLocked = function () {
            return this.lockedUntil && this.lockedUntil > new Date();
        };
        User_1.prototype.verifyEmail = function () {
            this.emailVerified = true;
            this.status = UserStatus.ACTIVE;
        };
        User_1.prototype.suspend = function () {
            this.status = UserStatus.SUSPENDED;
        };
        User_1.prototype.activate = function () {
            this.status = UserStatus.ACTIVE;
        };
        User_1.prototype.updateLastLogin = function () {
            this.lastLoginAt = new Date();
            this.resetLoginAttempts();
        };
        User_1.prototype.toJSON = function () {
            var _a = this, password = _a.password, rest = __rest(_a, ["password"]);
            return rest;
        };
        Object.defineProperty(User_1.prototype, "isSuperAdmin", {
            // Utility methods
            get: function () {
                return this.role === UserRole.SUPER_ADMIN;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(User_1.prototype, "isOrganizationAdmin", {
            get: function () {
                return this.role === UserRole.ORGANIZATION_ADMIN;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(User_1.prototype, "isRegularUser", {
            get: function () {
                return this.role === UserRole.USER;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(User_1.prototype, "isActiveUser", {
            get: function () {
                return this.status === UserStatus.ACTIVE && this.isActive;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(User_1.prototype, "displayName", {
            get: function () {
                return this.fullName || this.username;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(User_1.prototype, "initials", {
            get: function () {
                var _a, _b;
                var parts = this.fullName.split(' ');
                if (parts.length > 1) {
                    return "".concat(parts[0][0]).concat(parts[1][0]).toUpperCase();
                }
                return ((_a = this.fullName[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || ((_b = this.username[0]) === null || _b === void 0 ? void 0 : _b.toUpperCase()) || 'U';
            },
            enumerable: false,
            configurable: true
        });
        return User_1;
    }(_classSuper));
    __setFunctionName(_classThis, "User");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _email_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Имэйл хаяг',
                example: 'user@example.com',
            }), (0, typeorm_1.Column)({ unique: true })];
        _username_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Хэрэглэгчийн нэр',
                example: 'johndoe',
            }), (0, typeorm_1.Column)({ unique: true })];
        _fullName_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Бүтэн нэр',
                example: 'John Doe',
            }), (0, typeorm_1.Column)()];
        _password_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Нууц үг (hash хийгдсэн)',
                writeOnly: true,
            }), (0, class_transformer_1.Exclude)(), (0, typeorm_1.Column)()];
        _role_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Хэрэглэгчийн үүрэг',
                enum: UserRole,
                example: UserRole.USER,
            }), (0, typeorm_1.Column)({
                type: 'enum',
                enum: UserRole,
                default: UserRole.USER,
            })];
        _status_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Хэрэглэгчийн статус',
                enum: UserStatus,
                example: UserStatus.ACTIVE,
            }), (0, typeorm_1.Column)({
                type: 'enum',
                enum: UserStatus,
                default: UserStatus.ACTIVE,
            })];
        _lastLoginAt_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Сүүлийн нэвтрэлтийн огноо',
                example: '2024-12-14T10:30:00.000Z',
                required: false,
            }), (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _phoneNumber_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Утасны дугаар',
                example: '+976 9911 2233',
                required: false,
            }), (0, typeorm_1.Column)({ nullable: true })];
        _avatarUrl_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Профайл зурагны URL',
                example: 'https://example.com/avatar.jpg',
                required: false,
            }), (0, typeorm_1.Column)({ nullable: true })];
        _emailVerified_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Имэйл баталгаажсан эсэх',
                example: true,
                default: false,
            }), (0, typeorm_1.Column)({ default: false })];
        _twoFactorEnabled_decorators = [(0, swagger_1.ApiProperty)({
                description: '2FA идэвхтэй эсэх',
                example: false,
                default: false,
            }), (0, typeorm_1.Column)({ default: false })];
        _loginAttempts_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Нэвтрэх оролдлогуудын тоо',
                example: 0,
                default: 0,
            }), (0, typeorm_1.Column)({ default: 0 })];
        _lockedUntil_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Түгжээтэй дуусах огноо',
                example: '2024-12-14T11:30:00.000Z',
                required: false,
            }), (0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _preferences_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Тохиргоонууд',
                example: { language: 'mn', theme: 'light' },
                required: false,
            }), (0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _organization_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Байгууллага',
                type: function () { return organization_entity_1.Organization; },
            }), (0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.users; }, {
                nullable: false,
                onDelete: 'CASCADE',
            })];
        _responses_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Хариултууд',
                type: function () { return [response_entity_1.Response]; },
            }), (0, typeorm_1.OneToMany)(function () { return response_entity_1.Response; }, function (response) { return response.user; })];
        _expenses_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Зардал',
                type: function () { return [expense_entity_1.Expense]; },
            }), (0, typeorm_1.OneToMany)(function () { return expense_entity_1.Expense; }, function (expense) { return expense.user; })];
        _createdReports_decorators = [(0, swagger_1.ApiProperty)({
                description: 'Үүсгэсэн асуулгууд',
                type: function () { return [report_entity_1.Report]; },
            }), (0, typeorm_1.OneToMany)(function () { return report_entity_1.Report; }, function (report) { return report.createdBy; })];
        _hashPassword_decorators = [(0, typeorm_1.BeforeInsert)(), (0, typeorm_1.BeforeUpdate)()];
        __esDecorate(_classThis, null, _hashPassword_decorators, { kind: "method", name: "hashPassword", static: false, private: false, access: { has: function (obj) { return "hashPassword" in obj; }, get: function (obj) { return obj.hashPassword; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _username_decorators, { kind: "field", name: "username", static: false, private: false, access: { has: function (obj) { return "username" in obj; }, get: function (obj) { return obj.username; }, set: function (obj, value) { obj.username = value; } }, metadata: _metadata }, _username_initializers, _username_extraInitializers);
        __esDecorate(null, null, _fullName_decorators, { kind: "field", name: "fullName", static: false, private: false, access: { has: function (obj) { return "fullName" in obj; }, get: function (obj) { return obj.fullName; }, set: function (obj, value) { obj.fullName = value; } }, metadata: _metadata }, _fullName_initializers, _fullName_extraInitializers);
        __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: function (obj) { return "password" in obj; }, get: function (obj) { return obj.password; }, set: function (obj, value) { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: function (obj) { return "role" in obj; }, get: function (obj) { return obj.role; }, set: function (obj, value) { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _lastLoginAt_decorators, { kind: "field", name: "lastLoginAt", static: false, private: false, access: { has: function (obj) { return "lastLoginAt" in obj; }, get: function (obj) { return obj.lastLoginAt; }, set: function (obj, value) { obj.lastLoginAt = value; } }, metadata: _metadata }, _lastLoginAt_initializers, _lastLoginAt_extraInitializers);
        __esDecorate(null, null, _phoneNumber_decorators, { kind: "field", name: "phoneNumber", static: false, private: false, access: { has: function (obj) { return "phoneNumber" in obj; }, get: function (obj) { return obj.phoneNumber; }, set: function (obj, value) { obj.phoneNumber = value; } }, metadata: _metadata }, _phoneNumber_initializers, _phoneNumber_extraInitializers);
        __esDecorate(null, null, _avatarUrl_decorators, { kind: "field", name: "avatarUrl", static: false, private: false, access: { has: function (obj) { return "avatarUrl" in obj; }, get: function (obj) { return obj.avatarUrl; }, set: function (obj, value) { obj.avatarUrl = value; } }, metadata: _metadata }, _avatarUrl_initializers, _avatarUrl_extraInitializers);
        __esDecorate(null, null, _emailVerified_decorators, { kind: "field", name: "emailVerified", static: false, private: false, access: { has: function (obj) { return "emailVerified" in obj; }, get: function (obj) { return obj.emailVerified; }, set: function (obj, value) { obj.emailVerified = value; } }, metadata: _metadata }, _emailVerified_initializers, _emailVerified_extraInitializers);
        __esDecorate(null, null, _twoFactorEnabled_decorators, { kind: "field", name: "twoFactorEnabled", static: false, private: false, access: { has: function (obj) { return "twoFactorEnabled" in obj; }, get: function (obj) { return obj.twoFactorEnabled; }, set: function (obj, value) { obj.twoFactorEnabled = value; } }, metadata: _metadata }, _twoFactorEnabled_initializers, _twoFactorEnabled_extraInitializers);
        __esDecorate(null, null, _loginAttempts_decorators, { kind: "field", name: "loginAttempts", static: false, private: false, access: { has: function (obj) { return "loginAttempts" in obj; }, get: function (obj) { return obj.loginAttempts; }, set: function (obj, value) { obj.loginAttempts = value; } }, metadata: _metadata }, _loginAttempts_initializers, _loginAttempts_extraInitializers);
        __esDecorate(null, null, _lockedUntil_decorators, { kind: "field", name: "lockedUntil", static: false, private: false, access: { has: function (obj) { return "lockedUntil" in obj; }, get: function (obj) { return obj.lockedUntil; }, set: function (obj, value) { obj.lockedUntil = value; } }, metadata: _metadata }, _lockedUntil_initializers, _lockedUntil_extraInitializers);
        __esDecorate(null, null, _preferences_decorators, { kind: "field", name: "preferences", static: false, private: false, access: { has: function (obj) { return "preferences" in obj; }, get: function (obj) { return obj.preferences; }, set: function (obj, value) { obj.preferences = value; } }, metadata: _metadata }, _preferences_initializers, _preferences_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _responses_decorators, { kind: "field", name: "responses", static: false, private: false, access: { has: function (obj) { return "responses" in obj; }, get: function (obj) { return obj.responses; }, set: function (obj, value) { obj.responses = value; } }, metadata: _metadata }, _responses_initializers, _responses_extraInitializers);
        __esDecorate(null, null, _expenses_decorators, { kind: "field", name: "expenses", static: false, private: false, access: { has: function (obj) { return "expenses" in obj; }, get: function (obj) { return obj.expenses; }, set: function (obj, value) { obj.expenses = value; } }, metadata: _metadata }, _expenses_initializers, _expenses_extraInitializers);
        __esDecorate(null, null, _createdReports_decorators, { kind: "field", name: "createdReports", static: false, private: false, access: { has: function (obj) { return "createdReports" in obj; }, get: function (obj) { return obj.createdReports; }, set: function (obj, value) { obj.createdReports = value; } }, metadata: _metadata }, _createdReports_initializers, _createdReports_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
}();
exports.User = User;
