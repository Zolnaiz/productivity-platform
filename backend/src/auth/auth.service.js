"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var bcrypt = require("bcrypt");
var uuid_1 = require("uuid");
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(userRepository, organizationRepository, jwtService) {
            this.userRepository = userRepository;
            this.organizationRepository = organizationRepository;
            this.jwtService = jwtService;
            this.logger = new common_1.Logger(AuthService.name);
        }
        AuthService_1.prototype.validateUser = function (email, password) {
            return __awaiter(this, void 0, void 0, function () {
                var user, isValidPassword;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.debug("Validating user: ".concat(email));
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { email: email },
                                    relations: ['organization'],
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                this.logger.warn("User not found: ".concat(email));
                                return [2 /*return*/, null];
                            }
                            if (!user.isActive) {
                                this.logger.warn("User account inactive: ".concat(email));
                                throw new common_1.ForbiddenException('Таны акаунт идэвхгүй байна');
                            }
                            if (user.status !== 'active') {
                                this.logger.warn("User account not active: ".concat(email));
                                throw new common_1.ForbiddenException('Таны акаунт идэвхтэй бус байна');
                            }
                            if (user.isLocked()) {
                                this.logger.warn("User account locked: ".concat(email));
                                throw new common_1.ForbiddenException('Таны акаунт түгжэгдсэн байна');
                            }
                            return [4 /*yield*/, bcrypt.compare(password, user.password)];
                        case 2:
                            isValidPassword = _a.sent();
                            if (!!isValidPassword) return [3 /*break*/, 4];
                            user.incrementLoginAttempts();
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 3:
                            _a.sent();
                            this.logger.warn("Invalid password for user: ".concat(email));
                            throw new common_1.UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
                        case 4:
                            // Reset login attempts on successful login
                            user.resetLoginAttempts();
                            user.updateLastLogin();
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 5:
                            _a.sent();
                            this.logger.log("User validated successfully: ".concat(email));
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        AuthService_1.prototype.login = function (loginDto) {
            return __awaiter(this, void 0, void 0, function () {
                var user, tokens;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Login attempt: ".concat(loginDto.email));
                            return [4 /*yield*/, this.validateUser(loginDto.email, loginDto.password)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
                            }
                            return [4 /*yield*/, this.generateTokens(user)];
                        case 2:
                            tokens = _a.sent();
                            this.logger.log("Login successful for user: ".concat(user.email));
                            return [2 /*return*/, __assign(__assign({}, tokens), { user: {
                                        id: user.id,
                                        email: user.email,
                                        username: user.username,
                                        fullName: user.fullName,
                                        role: user.role,
                                        organization: user.organization,
                                        avatarUrl: user.avatarUrl,
                                        preferences: user.preferences,
                                    } })];
                    }
                });
            });
        };
        AuthService_1.prototype.register = function (registerDto) {
            return __awaiter(this, void 0, void 0, function () {
                var existingUser, existingUsername, organization, userCount, user, savedUser, tokens;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Registration attempt: ".concat(registerDto.email));
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { email: registerDto.email },
                                })];
                        case 1:
                            existingUser = _a.sent();
                            if (existingUser) {
                                this.logger.warn("Email already exists: ".concat(registerDto.email));
                                throw new common_1.ConflictException('Энэ имэйл хаяг аль хэдийн бүртгэгдсэн байна');
                            }
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { username: registerDto.username },
                                })];
                        case 2:
                            existingUsername = _a.sent();
                            if (existingUsername) {
                                this.logger.warn("Username already exists: ".concat(registerDto.username));
                                throw new common_1.ConflictException('Энэ хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна');
                            }
                            return [4 /*yield*/, this.organizationRepository.findOne({
                                    where: { code: registerDto.organizationCode },
                                })];
                        case 3:
                            organization = _a.sent();
                            if (!!organization) return [3 /*break*/, 5];
                            this.logger.log("Creating new organization: ".concat(registerDto.organizationCode));
                            organization = this.organizationRepository.create({
                                name: registerDto.organizationName || 'Шинэ байгууллага',
                                code: registerDto.organizationCode,
                                email: registerDto.email,
                                settings: {
                                    language: 'mn',
                                    timezone: 'Asia/Ulaanbaatar',
                                    currency: 'MNT',
                                    theme: 'light',
                                },
                            });
                            return [4 /*yield*/, this.organizationRepository.save(organization)];
                        case 4:
                            organization = _a.sent();
                            this.logger.log("Organization created: ".concat(organization.id));
                            _a.label = 5;
                        case 5: return [4 /*yield*/, this.userRepository.count({
                                where: { organization: { id: organization.id } },
                            })];
                        case 6:
                            userCount = _a.sent();
                            if (userCount >= organization.maxUsers) {
                                this.logger.warn("Organization user limit reached: ".concat(organization.id));
                                throw new common_1.ConflictException('Байгууллагын хэрэглэгчийн хязгаар хэтэрсэн байна');
                            }
                            user = this.userRepository.create({
                                email: registerDto.email,
                                username: registerDto.username,
                                password: registerDto.password,
                                fullName: registerDto.fullName,
                                role: registerDto.role || 'user',
                                organization: organization,
                                preferences: {
                                    language: 'mn',
                                    theme: 'light',
                                    notifications: true,
                                },
                            });
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 7:
                            savedUser = _a.sent();
                            this.logger.log("User created: ".concat(savedUser.id));
                            return [4 /*yield*/, this.generateTokens(savedUser)];
                        case 8:
                            tokens = _a.sent();
                            return [2 /*return*/, __assign(__assign({}, tokens), { user: {
                                        id: savedUser.id,
                                        email: savedUser.email,
                                        username: savedUser.username,
                                        fullName: savedUser.fullName,
                                        role: savedUser.role,
                                        organization: savedUser.organization,
                                    } })];
                    }
                });
            });
        };
        AuthService_1.prototype.refreshToken = function (refreshTokenDto) {
            return __awaiter(this, void 0, void 0, function () {
                var payload, user, tokens, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Refresh token attempt');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            payload = this.jwtService.verify(refreshTokenDto.refresh_token, {
                                secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh',
                            });
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { id: payload.sub },
                                    relations: ['organization'],
                                })];
                        case 2:
                            user = _a.sent();
                            if (!user || !user.isActive) {
                                throw new common_1.UnauthorizedException('Хэрэглэгч олдсонгүй эсвэл идэвхгүй байна');
                            }
                            return [4 /*yield*/, this.generateTokens(user)];
                        case 3:
                            tokens = _a.sent();
                            this.logger.log("Token refreshed for user: ".concat(user.email));
                            return [2 /*return*/, tokens];
                        case 4:
                            error_1 = _a.sent();
                            this.logger.error("Token refresh failed: ".concat(error_1.message));
                            throw new common_1.UnauthorizedException('Refresh token хүчингүй байна');
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        AuthService_1.prototype.logout = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log("Logout for user: ".concat(userId));
                    // In a real application, you might want to:
                    // 1. Add token to blacklist
                    // 2. Clear refresh token from database
                    // 3. Log the logout event
                    return [2 /*return*/, { message: 'Амжилттай гарлаа' }];
                });
            });
        };
        AuthService_1.prototype.changePassword = function (userId, changePasswordDto) {
            return __awaiter(this, void 0, void 0, function () {
                var user, isValidPassword;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Change password for user: ".concat(userId));
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { id: userId },
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.UnauthorizedException('Хэрэглэгч олдсонгүй');
                            }
                            return [4 /*yield*/, bcrypt.compare(changePasswordDto.currentPassword, user.password)];
                        case 2:
                            isValidPassword = _a.sent();
                            if (!isValidPassword) {
                                throw new common_1.UnauthorizedException('Одоогийн нууц үг буруу байна');
                            }
                            user.password = changePasswordDto.newPassword;
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 3:
                            _a.sent();
                            this.logger.log("Password changed successfully for user: ".concat(userId));
                            return [2 /*return*/, { message: 'Нууц үг амжилттай солигдлоо' }];
                    }
                });
            });
        };
        AuthService_1.prototype.forgotPassword = function (forgotPasswordDto) {
            return __awaiter(this, void 0, void 0, function () {
                var user, resetToken, resetTokenExpires;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Forgot password for email: ".concat(forgotPasswordDto.email));
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { email: forgotPasswordDto.email },
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                // Don't reveal that the user doesn't exist
                                this.logger.warn("User not found for forgot password: ".concat(forgotPasswordDto.email));
                                return [2 /*return*/, { message: 'Хэрэв энэ имэйл бүртгэлтэй бол нууц үг шинэчлэх заавар имэйлээр илгээгдэх болно' }];
                            }
                            resetToken = (0, uuid_1.v4)();
                            resetTokenExpires = new Date(Date.now() + 3600000);
                            // In a real application, you would:
                            // 1. Save reset token to database
                            // 2. Send email with reset link
                            this.logger.log("Reset token generated for user: ".concat(user.email));
                            return [2 /*return*/, { message: 'Нууц үг шинэчлэх заавар имэйлээр илгээгдэх болно' }];
                    }
                });
            });
        };
        AuthService_1.prototype.resetPassword = function (resetPasswordDto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log('Reset password attempt');
                    // In a real application, you would:
                    // 1. Verify reset token from database
                    // 2. Check if token is expired
                    // 3. Update user's password
                    // For now, we'll just return a success message
                    this.logger.log('Password reset successful');
                    return [2 /*return*/, { message: 'Нууц үг амжилттай шинэчлэгдлээ' }];
                });
            });
        };
        AuthService_1.prototype.getProfile = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Get profile for user: ".concat(userId));
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { id: userId },
                                    relations: ['organization'],
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.UnauthorizedException('Хэрэглэгч олдсонгүй');
                            }
                            return [2 /*return*/, {
                                    id: user.id,
                                    email: user.email,
                                    username: user.username,
                                    fullName: user.fullName,
                                    role: user.role,
                                    organization: user.organization,
                                    avatarUrl: user.avatarUrl,
                                    phoneNumber: user.phoneNumber,
                                    preferences: user.preferences,
                                    createdAt: user.createdAt,
                                    updatedAt: user.updatedAt,
                                }];
                    }
                });
            });
        };
        AuthService_1.prototype.updateProfile = function (userId, updateData) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Update profile for user: ".concat(userId));
                            return [4 /*yield*/, this.userRepository.findOne({
                                    where: { id: userId },
                                })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.UnauthorizedException('Хэрэглэгч олдсонгүй');
                            }
                            // Update allowed fields
                            if (updateData.fullName)
                                user.fullName = updateData.fullName;
                            if (updateData.phoneNumber)
                                user.phoneNumber = updateData.phoneNumber;
                            if (updateData.avatarUrl)
                                user.avatarUrl = updateData.avatarUrl;
                            if (updateData.preferences) {
                                user.preferences = __assign(__assign({}, user.preferences), updateData.preferences);
                            }
                            return [4 /*yield*/, this.userRepository.save(user)];
                        case 2:
                            _a.sent();
                            this.logger.log("Profile updated for user: ".concat(userId));
                            return [2 /*return*/, this.getProfile(userId)];
                    }
                });
            });
        };
        AuthService_1.prototype.generateTokens = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var payload, accessToken, refreshToken;
                return __generator(this, function (_a) {
                    payload = {
                        sub: user.id,
                        email: user.email,
                        role: user.role,
                        organizationId: user.organization.id,
                    };
                    accessToken = this.jwtService.sign(payload, {
                        expiresIn: process.env.JWT_EXPIRATION || '7d',
                    });
                    refreshToken = this.jwtService.sign({ sub: user.id }, {
                        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh',
                        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
                    });
                    return [2 /*return*/, {
                            access_token: accessToken,
                            refresh_token: refreshToken,
                            token_type: 'Bearer',
                            expires_in: 604800, // 7 days in seconds
                        }];
                });
            });
        };
        AuthService_1.prototype.validateToken = function (token) {
            return __awaiter(this, void 0, void 0, function () {
                var payload;
                return __generator(this, function (_a) {
                    try {
                        payload = this.jwtService.verify(token);
                        return [2 /*return*/, payload];
                    }
                    catch (error) {
                        this.logger.error("Token validation failed: ".concat(error.message));
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
