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
exports.ExpensesService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../shared/constants");
var ExpensesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ExpensesService = _classThis = /** @class */ (function () {
        function ExpensesService_1(expensesRepository) {
            this.expensesRepository = expensesRepository;
        }
        ExpensesService_1.prototype.create = function (createExpenseDto, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    // Validate that user has access to the organization
                    if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                        createExpenseDto.organizationId !== user.organizationId) {
                        throw new common_1.ForbiddenException('You can only create expenses for your organization');
                    }
                    expense = this.expensesRepository.create(__assign(__assign({}, createExpenseDto), { userId: user.id, status: constants_1.ExpenseStatus.PENDING }));
                    return [2 /*return*/, this.expensesRepository.save(expense)];
                });
            });
        };
        ExpensesService_1.prototype.findAll = function (params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, search, category, status, startDate, endDate, minAmount, maxAmount, skip, query, total, expenses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit, search = params.search, category = params.category, status = params.status, startDate = params.startDate, endDate = params.endDate, minAmount = params.minAmount, maxAmount = params.maxAmount;
                            skip = (page - 1) * limit;
                            query = this.expensesRepository
                                .createQueryBuilder('expense')
                                .leftJoinAndSelect('expense.organization', 'organization')
                                .leftJoinAndSelect('expense.user', 'user')
                                .leftJoinAndSelect('expense.approvedByUser', 'approvedByUser')
                                .leftJoinAndSelect('expense.paidByUser', 'paidByUser');
                            // Apply filters based on user role
                            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                                // Super admin can see all expenses
                                // No additional filters needed
                            }
                            else if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN) {
                                // Organization admin can only see expenses from their organization
                                query.andWhere('expense.organizationId = :organizationId', {
                                    organizationId: user.organizationId,
                                });
                            }
                            else {
                                // Regular users can only see their own expenses
                                query.andWhere('expense.userId = :userId', { userId: user.id });
                            }
                            // Apply additional filters
                            if (category) {
                                query.andWhere('expense.category = :category', { category: category });
                            }
                            if (status) {
                                query.andWhere('expense.status = :status', { status: status });
                            }
                            if (search) {
                                query.andWhere('(expense.title LIKE :search OR expense.description LIKE :search)', { search: "%".concat(search, "%") });
                            }
                            if (startDate) {
                                query.andWhere('expense.date >= :startDate', { startDate: new Date(startDate) });
                            }
                            if (endDate) {
                                query.andWhere('expense.date <= :endDate', { endDate: new Date(endDate) });
                            }
                            if (minAmount !== undefined) {
                                query.andWhere('expense.amount >= :minAmount', { minAmount: minAmount });
                            }
                            if (maxAmount !== undefined) {
                                query.andWhere('expense.amount <= :maxAmount', { maxAmount: maxAmount });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('expense.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            expenses = _a.sent();
                            return [2 /*return*/, {
                                    data: expenses,
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
        ExpensesService_1.prototype.findOne = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.expensesRepository.findOne({
                                where: { id: id },
                                relations: [
                                    'organization',
                                    'user',
                                    'approvedByUser',
                                    'paidByUser',
                                ],
                            })];
                        case 1:
                            expense = _a.sent();
                            if (!expense) {
                                throw new common_1.NotFoundException("Expense with ID ".concat(id, " not found"));
                            }
                            // Check permissions
                            this.checkExpenseAccess(expense, user);
                            return [2 /*return*/, expense];
                    }
                });
            });
        };
        ExpensesService_1.prototype.findMyExpenses = function (params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, skip, query, total, expenses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit;
                            skip = (page - 1) * limit;
                            query = this.expensesRepository
                                .createQueryBuilder('expense')
                                .where('expense.userId = :userId', { userId: user.id });
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('expense.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            expenses = _a.sent();
                            return [2 /*return*/, {
                                    data: expenses,
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
        ExpensesService_1.prototype.findPending = function (params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, skip, query, total, expenses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit;
                            skip = (page - 1) * limit;
                            query = this.expensesRepository
                                .createQueryBuilder('expense')
                                .where('expense.status = :status', { status: constants_1.ExpenseStatus.PENDING });
                            // Apply organization filter for non-super admins
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN) {
                                query.andWhere('expense.organizationId = :organizationId', {
                                    organizationId: user.organizationId,
                                });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('expense.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            expenses = _a.sent();
                            return [2 /*return*/, {
                                    data: expenses,
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
        ExpensesService_1.prototype.update = function (id, updateExpenseDto, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense can be updated
                            if (expense.status !== constants_1.ExpenseStatus.PENDING) {
                                throw new common_1.BadRequestException('Only pending expenses can be updated');
                            }
                            // Check if user can update this expense
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN &&
                                expense.userId !== user.id) {
                                throw new common_1.ForbiddenException('You can only update your own pending expenses');
                            }
                            Object.assign(expense, updateExpenseDto);
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.remove = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense can be deleted
                            if (expense.status !== constants_1.ExpenseStatus.PENDING) {
                                throw new common_1.BadRequestException('Only pending expenses can be deleted');
                            }
                            // Check if user can delete this expense
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN &&
                                expense.userId !== user.id) {
                                throw new common_1.ForbiddenException('You can only delete your own pending expenses');
                            }
                            return [2 /*return*/, this.expensesRepository.remove(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.submit = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense can be submitted
                            if (expense.status !== constants_1.ExpenseStatus.PENDING) {
                                throw new common_1.BadRequestException('Expense is already submitted');
                            }
                            // Check if user can submit this expense
                            if (expense.userId !== user.id) {
                                throw new common_1.ForbiddenException('You can only submit your own expenses');
                            }
                            // Validate that expense has required fields
                            if (!expense.title || !expense.amount || !expense.category) {
                                throw new common_1.BadRequestException('Expense must have title, amount, and category');
                            }
                            // Update status
                            expense.status = constants_1.ExpenseStatus.PENDING; // Already pending, but this confirms submission
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.approve = function (id, user, comments) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense can be approved
                            if (expense.status !== constants_1.ExpenseStatus.PENDING) {
                                throw new common_1.BadRequestException('Only pending expenses can be approved');
                            }
                            // Check if user can approve expenses
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN) {
                                throw new common_1.ForbiddenException('You do not have permission to approve expenses');
                            }
                            // Check organization access for non-super admins
                            if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                                expense.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('You can only approve expenses from your organization');
                            }
                            // Update expense
                            expense.status = constants_1.ExpenseStatus.APPROVED;
                            expense.approvedBy = user.id;
                            expense.approvedAt = new Date();
                            expense.approvalComments = comments;
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.reject = function (id, user, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense can be rejected
                            if (expense.status !== constants_1.ExpenseStatus.PENDING) {
                                throw new common_1.BadRequestException('Only pending expenses can be rejected');
                            }
                            // Check if user can reject expenses
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN) {
                                throw new common_1.ForbiddenException('You do not have permission to reject expenses');
                            }
                            // Check organization access for non-super admins
                            if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                                expense.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('You can only reject expenses from your organization');
                            }
                            // Update expense
                            expense.status = constants_1.ExpenseStatus.REJECTED;
                            expense.rejectedReason = reason;
                            expense.rejectedAt = new Date();
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.pay = function (id, user, paymentMethod, paymentReference) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense can be paid
                            if (expense.status !== constants_1.ExpenseStatus.APPROVED) {
                                throw new common_1.BadRequestException('Only approved expenses can be marked as paid');
                            }
                            // Check if user can mark expenses as paid
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN) {
                                throw new common_1.ForbiddenException('You do not have permission to mark expenses as paid');
                            }
                            // Check organization access for non-super admins
                            if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                                expense.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('You can only mark expenses from your organization as paid');
                            }
                            // Update expense
                            expense.status = constants_1.ExpenseStatus.PAID;
                            expense.paidBy = user.id;
                            expense.paidAt = new Date();
                            expense.paymentMethod = paymentMethod;
                            expense.paymentReference = paymentReference;
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.getAttachments = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _b.sent();
                            return [2 /*return*/, {
                                    expenseId: id,
                                    attachments: expense.attachments || [],
                                    total: ((_a = expense.attachments) === null || _a === void 0 ? void 0 : _a.length) || 0,
                                }];
                    }
                });
            });
        };
        ExpensesService_1.prototype.addAttachment = function (id, url, name, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if user can add attachments
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN &&
                                expense.userId !== user.id) {
                                throw new common_1.ForbiddenException('You do not have permission to add attachments');
                            }
                            // Initialize attachments array if needed
                            if (!expense.attachments) {
                                expense.attachments = [];
                            }
                            // Add attachment
                            expense.attachments.push({
                                id: "att_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                                url: url,
                                name: name,
                                uploadedAt: new Date(),
                                uploadedBy: user.id,
                            });
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.removeAttachment = function (id, attachmentId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var expense, attachmentIndex, attachment;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            expense = _a.sent();
                            // Check if expense has attachments
                            if (!expense.attachments || expense.attachments.length === 0) {
                                throw new common_1.NotFoundException('No attachments found');
                            }
                            attachmentIndex = expense.attachments.findIndex(function (att) { return att.id === attachmentId; });
                            if (attachmentIndex === -1) {
                                throw new common_1.NotFoundException('Attachment not found');
                            }
                            attachment = expense.attachments[attachmentIndex];
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.role !== constants_1.UserRole.ORGANIZATION_ADMIN &&
                                attachment.uploadedBy !== user.id) {
                                throw new common_1.ForbiddenException('You do not have permission to remove this attachment');
                            }
                            // Remove attachment
                            expense.attachments.splice(attachmentIndex, 1);
                            return [2 /*return*/, this.expensesRepository.save(expense)];
                    }
                });
            });
        };
        ExpensesService_1.prototype.getOrganizationStats = function (organizationId, startDate, endDate, user) {
            return __awaiter(this, void 0, void 0, function () {
                var query, categoryStats, totalStats, statusStats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Check permissions
                            if (user &&
                                user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                user.organizationId !== organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            query = this.expensesRepository
                                .createQueryBuilder('expense')
                                .select('expense.category', 'category')
                                .addSelect('SUM(expense.amount)', 'totalAmount')
                                .addSelect('COUNT(expense.id)', 'count')
                                .where('expense.organizationId = :organizationId', { organizationId: organizationId })
                                .andWhere('expense.status = :status', { status: constants_1.ExpenseStatus.APPROVED })
                                .groupBy('expense.category');
                            if (startDate) {
                                query.andWhere('expense.date >= :startDate', { startDate: new Date(startDate) });
                            }
                            if (endDate) {
                                query.andWhere('expense.date <= :endDate', { endDate: new Date(endDate) });
                            }
                            return [4 /*yield*/, query.getRawMany()];
                        case 1:
                            categoryStats = _a.sent();
                            return [4 /*yield*/, this.expensesRepository
                                    .createQueryBuilder('expense')
                                    .select('SUM(expense.amount)', 'totalAmount')
                                    .addSelect('COUNT(expense.id)', 'totalCount')
                                    .addSelect('AVG(expense.amount)', 'averageAmount')
                                    .where('expense.organizationId = :organizationId', { organizationId: organizationId })
                                    .andWhere('expense.status = :status', { status: constants_1.ExpenseStatus.APPROVED })
                                    .getRawOne()];
                        case 2:
                            totalStats = _a.sent();
                            return [4 /*yield*/, this.expensesRepository
                                    .createQueryBuilder('expense')
                                    .select('expense.status', 'status')
                                    .addSelect('COUNT(expense.id)', 'count')
                                    .where('expense.organizationId = :organizationId', { organizationId: organizationId })
                                    .groupBy('expense.status')
                                    .getRawMany()];
                        case 3:
                            statusStats = _a.sent();
                            return [2 /*return*/, {
                                    organizationId: organizationId,
                                    period: {
                                        startDate: startDate || 'all',
                                        endDate: endDate || 'all',
                                    },
                                    categoryStats: categoryStats,
                                    totalStats: {
                                        totalAmount: parseFloat(totalStats.totalAmount) || 0,
                                        totalCount: parseInt(totalStats.totalCount) || 0,
                                        averageAmount: parseFloat(totalStats.averageAmount) || 0,
                                    },
                                    statusStats: statusStats,
                                    generatedAt: new Date(),
                                }];
                    }
                });
            });
        };
        ExpensesService_1.prototype.getCategoriesSummary = function (user, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var query, stats, totalAmount, categories;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            query = this.expensesRepository
                                .createQueryBuilder('expense')
                                .select('expense.category', 'category')
                                .addSelect('SUM(expense.amount)', 'totalAmount')
                                .addSelect('COUNT(expense.id)', 'count');
                            // Apply filters based on user role
                            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                                // Super admin can see all expenses
                            }
                            else if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN) {
                                query.where('expense.organizationId = :organizationId', {
                                    organizationId: user.organizationId,
                                });
                            }
                            else {
                                query.where('expense.userId = :userId', { userId: user.id });
                            }
                            if (startDate) {
                                query.andWhere('expense.date >= :startDate', { startDate: new Date(startDate) });
                            }
                            if (endDate) {
                                query.andWhere('expense.date <= :endDate', { endDate: new Date(endDate) });
                            }
                            query.groupBy('expense.category');
                            return [4 /*yield*/, query.getRawMany()];
                        case 1:
                            stats = _a.sent();
                            totalAmount = stats.reduce(function (sum, stat) { return sum + parseFloat(stat.totalAmount); }, 0);
                            categories = stats.map(function (stat) { return ({
                                category: stat.category,
                                totalAmount: parseFloat(stat.totalAmount),
                                count: parseInt(stat.count),
                                percentage: totalAmount > 0 ? (parseFloat(stat.totalAmount) / totalAmount) * 100 : 0,
                            }); });
                            // Sort by total amount (descending)
                            categories.sort(function (a, b) { return b.totalAmount - a.totalAmount; });
                            return [2 /*return*/, {
                                    categories: categories,
                                    totalAmount: totalAmount,
                                    totalCount: categories.reduce(function (sum, cat) { return sum + cat.count; }, 0),
                                    period: {
                                        startDate: startDate || 'all',
                                        endDate: endDate || 'all',
                                    },
                                    generatedAt: new Date(),
                                }];
                    }
                });
            });
        };
        ExpensesService_1.prototype.checkExpenseAccess = function (expense, user) {
            // Super admin can access all expenses
            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                return;
            }
            // Organization admin can access expenses from their organization
            if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                expense.organizationId === user.organizationId) {
                return;
            }
            // Regular users can only access their own expenses
            if (user.role === constants_1.UserRole.USER && expense.userId === user.id) {
                return;
            }
            throw new common_1.ForbiddenException('Access denied');
        };
        return ExpensesService_1;
    }());
    __setFunctionName(_classThis, "ExpensesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ExpensesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ExpensesService = _classThis;
}();
exports.ExpensesService = ExpensesService;
