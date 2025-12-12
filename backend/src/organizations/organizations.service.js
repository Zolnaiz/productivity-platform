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
exports.OrganizationsService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../shared/constants");
var OrganizationsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OrganizationsService = _classThis = /** @class */ (function () {
        function OrganizationsService_1(organizationsRepository, usersService) {
            this.organizationsRepository = organizationsRepository;
            this.usersService = usersService;
        }
        OrganizationsService_1.prototype.create = function (createOrganizationDto) {
            return __awaiter(this, void 0, void 0, function () {
                var existingOrg, organization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.organizationsRepository.findOne({
                                where: { name: createOrganizationDto.name },
                            })];
                        case 1:
                            existingOrg = _a.sent();
                            if (existingOrg) {
                                throw new common_1.ConflictException('Organization with this name already exists');
                            }
                            organization = this.organizationsRepository.create(createOrganizationDto);
                            return [2 /*return*/, this.organizationsRepository.save(organization)];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.findAll = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, search, isActive, skip, query, total, organizations;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit, search = params.search, isActive = params.isActive;
                            skip = (page - 1) * limit;
                            query = this.organizationsRepository
                                .createQueryBuilder('organization')
                                .leftJoinAndSelect('organization.users', 'users');
                            // Filter by active status
                            if (isActive !== undefined) {
                                query.andWhere('organization.isActive = :isActive', { isActive: isActive });
                            }
                            // Search
                            if (search) {
                                query.andWhere('(organization.name LIKE :search OR organization.description LIKE :search)', { search: "%".concat(search, "%") });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('organization.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            organizations = _a.sent();
                            return [2 /*return*/, {
                                    data: organizations,
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
        OrganizationsService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var organization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.organizationsRepository.findOne({
                                where: { id: id },
                                relations: ['users'],
                            })];
                        case 1:
                            organization = _a.sent();
                            if (!organization) {
                                throw new common_1.NotFoundException("Organization with ID ".concat(id, " not found"));
                            }
                            return [2 /*return*/, organization];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.getMyOrganization = function (organizationId) {
            return __awaiter(this, void 0, void 0, function () {
                var organization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!organizationId) {
                                throw new common_1.NotFoundException('User is not associated with any organization');
                            }
                            return [4 /*yield*/, this.organizationsRepository.findOne({
                                    where: { id: organizationId },
                                    relations: ['users'],
                                })];
                        case 1:
                            organization = _a.sent();
                            if (!organization) {
                                throw new common_1.NotFoundException('Organization not found');
                            }
                            return [2 /*return*/, organization];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.update = function (id, updateOrganizationDto) {
            return __awaiter(this, void 0, void 0, function () {
                var organization, existingOrg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            organization = _a.sent();
                            if (!(updateOrganizationDto.name &&
                                updateOrganizationDto.name !== organization.name)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.organizationsRepository.findOne({
                                    where: { name: updateOrganizationDto.name },
                                })];
                        case 2:
                            existingOrg = _a.sent();
                            if (existingOrg && existingOrg.id !== id) {
                                throw new common_1.ConflictException('Organization name already in use');
                            }
                            _a.label = 3;
                        case 3:
                            Object.assign(organization, updateOrganizationDto);
                            return [2 /*return*/, this.organizationsRepository.save(organization)];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.remove = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var organization, userCount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            organization = _a.sent();
                            return [4 /*yield*/, this.usersService['usersRepository'].count({
                                    where: { organizationId: id },
                                })];
                        case 2:
                            userCount = _a.sent();
                            if (userCount > 0) {
                                throw new common_1.BadRequestException('Cannot delete organization with active users');
                            }
                            // Soft delete
                            organization.isActive = false;
                            organization.deletedAt = new Date();
                            return [2 /*return*/, this.organizationsRepository.save(organization)];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.activate = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var organization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            organization = _a.sent();
                            organization.isActive = true;
                            return [2 /*return*/, this.organizationsRepository.save(organization)];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.deactivate = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var organization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            organization = _a.sent();
                            organization.isActive = false;
                            return [2 /*return*/, this.organizationsRepository.save(organization)];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.getUsers = function (organizationId, params, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var organization;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(organizationId)];
                        case 1:
                            organization = _a.sent();
                            // Check permissions
                            this.checkOrganizationAccess(organization, currentUser);
                            return [2 /*return*/, this.usersService.findAll(params, organizationId, currentUser.role)];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.getStats = function (organizationId, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var organization, userStats, questionnaireCount, responseCount, expenseStats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(organizationId)];
                        case 1:
                            organization = _a.sent();
                            // Check permissions
                            this.checkOrganizationAccess(organization, currentUser);
                            return [4 /*yield*/, this.usersService['usersRepository']
                                    .createQueryBuilder('user')
                                    .select('user.role', 'role')
                                    .addSelect('COUNT(user.id)', 'count')
                                    .where('user.organizationId = :organizationId', { organizationId: organizationId })
                                    .andWhere('user.isActive = :isActive', { isActive: true })
                                    .groupBy('user.role')
                                    .getRawMany()];
                        case 2:
                            userStats = _a.sent();
                            return [4 /*yield*/, this.organizationsRepository.manager
                                    .createQueryBuilder()
                                    .select('COUNT(*)', 'count')
                                    .from('questionnaires', 'q')
                                    .where('q.organization_id = :organizationId', { organizationId: organizationId })
                                    .andWhere('q.is_active = :isActive', { isActive: true })
                                    .getRawOne()];
                        case 3:
                            questionnaireCount = _a.sent();
                            return [4 /*yield*/, this.organizationsRepository.manager
                                    .createQueryBuilder()
                                    .select('COUNT(*)', 'count')
                                    .from('responses', 'r')
                                    .where('r.organization_id = :organizationId', { organizationId: organizationId })
                                    .getRawOne()];
                        case 4:
                            responseCount = _a.sent();
                            return [4 /*yield*/, this.organizationsRepository.manager
                                    .createQueryBuilder()
                                    .select('SUM(e.amount)', 'totalAmount')
                                    .addSelect('AVG(e.amount)', 'averageAmount')
                                    .addSelect('COUNT(*)', 'count')
                                    .from('expenses', 'e')
                                    .where('e.organization_id = :organizationId', { organizationId: organizationId })
                                    .andWhere('e.status = :status', { status: 'approved' })
                                    .getRawOne()];
                        case 5:
                            expenseStats = _a.sent();
                            return [2 /*return*/, {
                                    organizationId: organizationId,
                                    userStats: userStats,
                                    questionnaireCount: parseInt(questionnaireCount.count) || 0,
                                    responseCount: parseInt(responseCount.count) || 0,
                                    expenseStats: {
                                        totalAmount: parseFloat(expenseStats.totalAmount) || 0,
                                        averageAmount: parseFloat(expenseStats.averageAmount) || 0,
                                        count: parseInt(expenseStats.count) || 0,
                                    },
                                    updatedAt: new Date(),
                                }];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.inviteUser = function (organizationId, email, role, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var organization, existingUser, temporaryPassword, user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(organizationId)];
                        case 1:
                            organization = _a.sent();
                            // Check permissions
                            this.checkOrganizationAccess(organization, currentUser);
                            // Check if user can assign this role
                            if (!this.canAssignRole(currentUser.role, role)) {
                                throw new common_1.ForbiddenException('You cannot assign this role');
                            }
                            return [4 /*yield*/, this.usersService.findByEmail(email)];
                        case 2:
                            existingUser = _a.sent();
                            if (!existingUser) return [3 /*break*/, 4];
                            // Check if user is already in this organization
                            if (existingUser.organizationId === organizationId) {
                                throw new common_1.ConflictException('User is already in this organization');
                            }
                            // Update user's organization
                            existingUser.organizationId = organizationId;
                            existingUser.role = role;
                            return [4 /*yield*/, this.usersService['usersRepository'].save(existingUser)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    message: 'User added to organization successfully',
                                    user: existingUser,
                                }];
                        case 4:
                            temporaryPassword = this.generateTemporaryPassword();
                            return [4 /*yield*/, this.usersService.create({
                                    email: email,
                                    firstName: 'Invited',
                                    lastName: 'User',
                                    password: temporaryPassword,
                                    role: role,
                                    organizationId: organizationId,
                                    isActive: false, // User needs to activate account
                                }, organizationId)];
                        case 5:
                            user = _a.sent();
                            return [2 /*return*/, {
                                    message: 'Invitation sent successfully',
                                    user: user,
                                    // In production, don't return the temporary password
                                    temporaryPassword: temporaryPassword,
                                }];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.removeUser = function (organizationId, userId, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var organization, user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(organizationId)];
                        case 1:
                            organization = _a.sent();
                            // Check permissions
                            this.checkOrganizationAccess(organization, currentUser);
                            return [4 /*yield*/, this.usersService.findById(userId)];
                        case 2:
                            user = _a.sent();
                            if (!user) {
                                throw new common_1.NotFoundException('User not found');
                            }
                            // Check if user belongs to this organization
                            if (user.organizationId !== organizationId) {
                                throw new common_1.BadRequestException('User does not belong to this organization');
                            }
                            // Prevent removing yourself
                            if (user.id === currentUser.id) {
                                throw new common_1.BadRequestException('Cannot remove yourself from organization');
                            }
                            // Remove user from organization
                            user.organizationId = null;
                            user.role = constants_1.UserRole.USER;
                            return [4 /*yield*/, this.usersService['usersRepository'].save(user)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    message: 'User removed from organization successfully',
                                }];
                    }
                });
            });
        };
        OrganizationsService_1.prototype.checkOrganizationAccess = function (organization, currentUser) {
            // Super admin can access all organizations
            if (currentUser.role === constants_1.UserRole.SUPER_ADMIN) {
                return;
            }
            // Organization admin can only access their organization
            if (currentUser.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                organization.id === currentUser.organizationId) {
                return;
            }
            // Regular users cannot access organization details
            throw new common_1.ForbiddenException('Access denied');
        };
        OrganizationsService_1.prototype.canAssignRole = function (currentUserRole, targetRole) {
            var _a;
            var _b;
            var roleHierarchy = (_a = {},
                _a[constants_1.UserRole.SUPER_ADMIN] = [constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER],
                _a[constants_1.UserRole.ORGANIZATION_ADMIN] = [constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER],
                _a[constants_1.UserRole.USER] = [],
                _a);
            return ((_b = roleHierarchy[currentUserRole]) === null || _b === void 0 ? void 0 : _b.includes(targetRole)) || false;
        };
        OrganizationsService_1.prototype.generateTemporaryPassword = function () {
            var length = 12;
            var charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
            var password = '';
            for (var i = 0; i < length; i++) {
                var randomIndex = Math.floor(Math.random() * charset.length);
                password += charset[randomIndex];
            }
            return password;
        };
        return OrganizationsService_1;
    }());
    __setFunctionName(_classThis, "OrganizationsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrganizationsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrganizationsService = _classThis;
}();
exports.OrganizationsService = OrganizationsService;
