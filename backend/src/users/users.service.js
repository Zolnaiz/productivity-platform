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
exports.UsersService = void 0;
var common_1 = require("@nestjs/common");
var bcrypt = require("bcrypt");
var constants_1 = require("../shared/constants");
var UsersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var UsersService = _classThis = /** @class */ (function () {
        function UsersService_1(usersRepository, organizationService) {
            this.usersRepository = usersRepository;
            this.organizationService = organizationService;
        }
        UsersService_1.prototype.create = function (createUserDto, organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var existingUser, hashedPassword, user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersRepository.findOne({
                                where: { email: createUserDto.email },
                            })];
                        case 1:
                            existingUser = _a.sent();
                            if (existingUser) {
                                throw new common_1.ConflictException('User with this email already exists');
                            }
                            return [4 /*yield*/, bcrypt.hash(createUserDto.password, 10)];
                        case 2:
                            hashedPassword = _a.sent();
                            user = this.usersRepository.create(__assign(__assign({}, createUserDto), { password: hashedPassword, organizationId: organizationId || createUserDto.organizationId }));
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.findAll = function (params, organizationId, userRole) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, search, role, skip, query, total, users;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit, search = params.search, role = params.role;
                            skip = (page - 1) * limit;
                            query = this.usersRepository
                                .createQueryBuilder('user')
                                .leftJoinAndSelect('user.organization', 'organization')
                                .where('user.isActive = :isActive', { isActive: true });
                            // Filter by organization if not super admin
                            if (userRole !== constants_1.UserRole.SUPER_ADMIN && organizationId) {
                                query.andWhere('user.organizationId = :organizationId', {
                                    organizationId: organizationId,
                                });
                            }
                            // Filter by role
                            if (role) {
                                query.andWhere('user.role = :role', { role: role });
                            }
                            // Search
                            if (search) {
                                query.andWhere('(user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)', { search: "%".concat(search, "%") });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('user.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            users = _a.sent();
                            return [2 /*return*/, {
                                    data: users,
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        UsersService_1.prototype.findOne = function (id, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersRepository.findOne({
                                where: { id: id },
                                relations: ['organization'],
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException("User with ID ".concat(id, " not found"));
                            }
                            // Check permissions
                            this.checkUserAccess(user, currentUser);
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.findByEmail = function (email) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.usersRepository.findOne({
                            where: { email: email },
                            relations: ['organization'],
                        })];
                });
            });
        };
        UsersService_1.prototype.findById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.usersRepository.findOne({
                            where: { id: id },
                            relations: ['organization'],
                        })];
                });
            });
        };
        UsersService_1.prototype.update = function (id, updateUserDto, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user, existingUser, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, currentUser)];
                        case 1:
                            user = _b.sent();
                            if (!(updateUserDto.email && updateUserDto.email !== user.email)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.findByEmail(updateUserDto.email)];
                        case 2:
                            existingUser = _b.sent();
                            if (existingUser && existingUser.id !== id) {
                                throw new common_1.ConflictException('Email already in use');
                            }
                            _b.label = 3;
                        case 3:
                            if (!updateUserDto.password) return [3 /*break*/, 5];
                            _a = updateUserDto;
                            return [4 /*yield*/, bcrypt.hash(updateUserDto.password, 10)];
                        case 4:
                            _a.password = _b.sent();
                            _b.label = 5;
                        case 5:
                            // Update user
                            Object.assign(user, updateUserDto);
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.updateProfile = function (userId, updateUserDto) {
            return __awaiter(this, void 0, void 0, function () {
                var user, allowedFields, filteredUpdate, _i, allowedFields_1, field, existingUser;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findById(userId)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            allowedFields = [
                                'firstName',
                                'lastName',
                                'phone',
                                'position',
                                'profileImageUrl',
                            ];
                            filteredUpdate = {};
                            for (_i = 0, allowedFields_1 = allowedFields; _i < allowedFields_1.length; _i++) {
                                field = allowedFields_1[_i];
                                if (updateUserDto[field] !== undefined) {
                                    filteredUpdate[field] = updateUserDto[field];
                                }
                            }
                            if (!(updateUserDto.email && updateUserDto.email !== user.email)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.findByEmail(updateUserDto.email)];
                        case 2:
                            existingUser = _a.sent();
                            if (existingUser && existingUser.id !== userId) {
                                throw new common_1.ConflictException('Email already in use');
                            }
                            filteredUpdate.email = updateUserDto.email;
                            _a.label = 3;
                        case 3:
                            Object.assign(user, filteredUpdate);
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.remove = function (id, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, currentUser)];
                        case 1:
                            user = _a.sent();
                            // Prevent self-deletion
                            if (user.id === currentUser.id) {
                                throw new common_1.BadRequestException('Cannot delete your own account');
                            }
                            // Soft delete
                            user.isActive = false;
                            user.deletedAt = new Date();
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.activate = function (id, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, currentUser)];
                        case 1:
                            user = _a.sent();
                            user.isActive = true;
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.deactivate = function (id, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, currentUser)];
                        case 1:
                            user = _a.sent();
                            // Prevent self-deactivation
                            if (user.id === currentUser.id) {
                                throw new common_1.BadRequestException('Cannot deactivate your own account');
                            }
                            user.isActive = false;
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.getProfile = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersRepository.findOne({
                                where: { id: userId },
                                relations: ['organization'],
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.getPermissions = function (id, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user, permissions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, currentUser)];
                        case 1:
                            user = _a.sent();
                            permissions = this.getRolePermissions(user.role);
                            return [2 /*return*/, {
                                    userId: user.id,
                                    role: user.role,
                                    permissions: permissions,
                                }];
                    }
                });
            });
        };
        UsersService_1.prototype.changeRole = function (id, role, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, currentUser)];
                        case 1:
                            user = _a.sent();
                            // Check if current user can assign this role
                            if (!this.canAssignRole(currentUser.role, role)) {
                                throw new common_1.ForbiddenException('You cannot assign this role');
                            }
                            user.role = role;
                            return [2 /*return*/, this.usersRepository.save(user)];
                    }
                });
            });
        };
        UsersService_1.prototype.validateUser = function (email, password) {
            return __awaiter(this, void 0, void 0, function () {
                var user, isPasswordValid;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findByEmail(email)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, bcrypt.compare(password, user.password)];
                        case 2:
                            isPasswordValid = _a.sent();
                            if (!isPasswordValid) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        UsersService_1.prototype.checkUserAccess = function (user, currentUser) {
            // Super admin can access all users
            if (currentUser.role === constants_1.UserRole.SUPER_ADMIN) {
                return;
            }
            // Organization admin can only access users in their organization
            if (currentUser.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                user.organizationId === currentUser.organizationId) {
                return;
            }
            // Regular users can only access themselves
            if (currentUser.role === constants_1.UserRole.USER && user.id === currentUser.id) {
                return;
            }
            throw new common_1.ForbiddenException('Access denied');
        };
        UsersService_1.prototype.getRolePermissions = function (role) {
            var _a;
            var permissions = (_a = {},
                _a[constants_1.UserRole.SUPER_ADMIN] = [
                    'users:read',
                    'users:create',
                    'users:update',
                    'users:delete',
                    'organizations:read',
                    'organizations:create',
                    'organizations:update',
                    'organizations:delete',
                    'questionnaires:read',
                    'questionnaires:create',
                    'questionnaires:update',
                    'questionnaires:delete',
                    'responses:read',
                    'responses:create',
                    'responses:update',
                    'responses:delete',
                    'expenses:read',
                    'expenses:create',
                    'expenses:update',
                    'expenses:delete',
                    'reports:read',
                    'reports:create',
                    'reports:update',
                    'reports:delete',
                ],
                _a[constants_1.UserRole.ORGANIZATION_ADMIN] = [
                    'users:read',
                    'users:create',
                    'users:update',
                    'users:delete',
                    'questionnaires:read',
                    'questionnaires:create',
                    'questionnaires:update',
                    'questionnaires:delete',
                    'responses:read',
                    'responses:create',
                    'responses:update',
                    'responses:delete',
                    'expenses:read',
                    'expenses:create',
                    'expenses:update',
                    'expenses:delete',
                    'reports:read',
                    'reports:create',
                    'reports:update',
                    'reports:delete',
                ],
                _a[constants_1.UserRole.USER] = [
                    'questionnaires:read',
                    'questionnaires:create',
                    'responses:read',
                    'responses:create',
                    'expenses:read',
                    'expenses:create',
                    'reports:read',
                    'reports:create',
                ],
                _a);
            return permissions[role] || [];
        };
        UsersService_1.prototype.canAssignRole = function (currentUserRole, targetRole) {
            var _a;
            var _b;
            var roleHierarchy = (_a = {},
                _a[constants_1.UserRole.SUPER_ADMIN] = [constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER],
                _a[constants_1.UserRole.ORGANIZATION_ADMIN] = [constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER],
                _a[constants_1.UserRole.USER] = [],
                _a);
            return ((_b = roleHierarchy[currentUserRole]) === null || _b === void 0 ? void 0 : _b.includes(targetRole)) || false;
        };
        return UsersService_1;
    }());
    __setFunctionName(_classThis, "UsersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersService = _classThis;
}();
exports.UsersService = UsersService;
