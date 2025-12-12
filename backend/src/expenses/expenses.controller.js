"use strict";
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../shared/decorators/roles.decorator");
var constants_1 = require("../shared/constants");
var swagger_1 = require("@nestjs/swagger");
var ExpensesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('expenses'), (0, common_1.Controller)('expenses'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findMyExpenses_decorators;
    var _findPending_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _submit_decorators;
    var _approve_decorators;
    var _reject_decorators;
    var _pay_decorators;
    var _getAttachments_decorators;
    var _addAttachment_decorators;
    var _removeAttachment_decorators;
    var _getOrganizationStats_decorators;
    var _getCategoriesSummary_decorators;
    var ExpensesController = _classThis = /** @class */ (function () {
        function ExpensesController_1(expensesService) {
            this.expensesService = (__runInitializers(this, _instanceExtraInitializers), expensesService);
        }
        ExpensesController_1.prototype.create = function (createExpenseDto, req) {
            return this.expensesService.create(createExpenseDto, req.user);
        };
        ExpensesController_1.prototype.findAll = function (page, limit, search, category, status, startDate, endDate, minAmount, maxAmount, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.expensesService.findAll({
                page: page,
                limit: limit,
                search: search,
                category: category,
                status: status,
                startDate: startDate,
                endDate: endDate,
                minAmount: minAmount,
                maxAmount: maxAmount,
            }, req.user);
        };
        ExpensesController_1.prototype.findMyExpenses = function (page, limit, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.expensesService.findMyExpenses({ page: page, limit: limit }, req.user);
        };
        ExpensesController_1.prototype.findPending = function (page, limit, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.expensesService.findPending({ page: page, limit: limit }, req.user);
        };
        ExpensesController_1.prototype.findOne = function (id, req) {
            return this.expensesService.findOne(id, req.user);
        };
        ExpensesController_1.prototype.update = function (id, updateExpenseDto, req) {
            return this.expensesService.update(id, updateExpenseDto, req.user);
        };
        ExpensesController_1.prototype.remove = function (id, req) {
            return this.expensesService.remove(id, req.user);
        };
        ExpensesController_1.prototype.submit = function (id, req) {
            return this.expensesService.submit(id, req.user);
        };
        ExpensesController_1.prototype.approve = function (id, comments, req) {
            return this.expensesService.approve(id, req.user, comments);
        };
        ExpensesController_1.prototype.reject = function (id, reason, req) {
            return this.expensesService.reject(id, req.user, reason);
        };
        ExpensesController_1.prototype.pay = function (id, paymentMethod, paymentReference, req) {
            return this.expensesService.pay(id, req.user, paymentMethod, paymentReference);
        };
        ExpensesController_1.prototype.getAttachments = function (id, req) {
            return this.expensesService.getAttachments(id, req.user);
        };
        ExpensesController_1.prototype.addAttachment = function (id, url, name, req) {
            return this.expensesService.addAttachment(id, url, name, req.user);
        };
        ExpensesController_1.prototype.removeAttachment = function (id, attachmentId, req) {
            return this.expensesService.removeAttachment(id, attachmentId, req.user);
        };
        ExpensesController_1.prototype.getOrganizationStats = function (organizationId, startDate, endDate, req) {
            return this.expensesService.getOrganizationStats(organizationId, startDate, endDate, req.user);
        };
        ExpensesController_1.prototype.getCategoriesSummary = function (startDate, endDate, req) {
            return this.expensesService.getCategoriesSummary(req.user, startDate, endDate);
        };
        return ExpensesController_1;
    }());
    __setFunctionName(_classThis, "ExpensesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Create a new expense' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Expense created successfully' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get all expenses' })];
        _findMyExpenses_decorators = [(0, common_1.Get)('my-expenses'), (0, swagger_1.ApiOperation)({ summary: 'Get current user expenses' })];
        _findPending_decorators = [(0, common_1.Get)('pending'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get pending expenses' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get expense by ID' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update expense' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Delete expense' })];
        _submit_decorators = [(0, common_1.Post)(':id/submit'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Submit expense for approval' })];
        _approve_decorators = [(0, common_1.Post)(':id/approve'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Approve expense' })];
        _reject_decorators = [(0, common_1.Post)(':id/reject'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Reject expense' })];
        _pay_decorators = [(0, common_1.Post)(':id/pay'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Mark expense as paid' })];
        _getAttachments_decorators = [(0, common_1.Get)(':id/attachments'), (0, swagger_1.ApiOperation)({ summary: 'Get expense attachments' })];
        _addAttachment_decorators = [(0, common_1.Post)(':id/attachments'), (0, swagger_1.ApiOperation)({ summary: 'Add attachment to expense' })];
        _removeAttachment_decorators = [(0, common_1.Delete)(':id/attachments/:attachmentId'), (0, swagger_1.ApiOperation)({ summary: 'Remove attachment from expense' })];
        _getOrganizationStats_decorators = [(0, common_1.Get)('organization/:organizationId/stats'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get organization expense statistics' })];
        _getCategoriesSummary_decorators = [(0, common_1.Get)('categories/summary'), (0, swagger_1.ApiOperation)({ summary: 'Get expense categories summary' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findMyExpenses_decorators, { kind: "method", name: "findMyExpenses", static: false, private: false, access: { has: function (obj) { return "findMyExpenses" in obj; }, get: function (obj) { return obj.findMyExpenses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findPending_decorators, { kind: "method", name: "findPending", static: false, private: false, access: { has: function (obj) { return "findPending" in obj; }, get: function (obj) { return obj.findPending; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submit_decorators, { kind: "method", name: "submit", static: false, private: false, access: { has: function (obj) { return "submit" in obj; }, get: function (obj) { return obj.submit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approve_decorators, { kind: "method", name: "approve", static: false, private: false, access: { has: function (obj) { return "approve" in obj; }, get: function (obj) { return obj.approve; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reject_decorators, { kind: "method", name: "reject", static: false, private: false, access: { has: function (obj) { return "reject" in obj; }, get: function (obj) { return obj.reject; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _pay_decorators, { kind: "method", name: "pay", static: false, private: false, access: { has: function (obj) { return "pay" in obj; }, get: function (obj) { return obj.pay; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAttachments_decorators, { kind: "method", name: "getAttachments", static: false, private: false, access: { has: function (obj) { return "getAttachments" in obj; }, get: function (obj) { return obj.getAttachments; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addAttachment_decorators, { kind: "method", name: "addAttachment", static: false, private: false, access: { has: function (obj) { return "addAttachment" in obj; }, get: function (obj) { return obj.addAttachment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeAttachment_decorators, { kind: "method", name: "removeAttachment", static: false, private: false, access: { has: function (obj) { return "removeAttachment" in obj; }, get: function (obj) { return obj.removeAttachment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOrganizationStats_decorators, { kind: "method", name: "getOrganizationStats", static: false, private: false, access: { has: function (obj) { return "getOrganizationStats" in obj; }, get: function (obj) { return obj.getOrganizationStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCategoriesSummary_decorators, { kind: "method", name: "getCategoriesSummary", static: false, private: false, access: { has: function (obj) { return "getCategoriesSummary" in obj; }, get: function (obj) { return obj.getCategoriesSummary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ExpensesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ExpensesController = _classThis;
}();
exports.ExpensesController = ExpensesController;
