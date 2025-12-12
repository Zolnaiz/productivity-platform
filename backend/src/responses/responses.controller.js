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
exports.ResponsesController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../shared/decorators/roles.decorator");
var constants_1 = require("../shared/constants");
var swagger_1 = require("@nestjs/swagger");
var ResponsesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('responses'), (0, common_1.Controller)('responses'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _findByQuestionnaire_decorators;
    var _findByUser_decorators;
    var _findMyResponses_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _getAnalysis_decorators;
    var _exportResponses_decorators;
    var _getQuestionnaireSummary_decorators;
    var _bulkDelete_decorators;
    var ResponsesController = _classThis = /** @class */ (function () {
        function ResponsesController_1(responsesService) {
            this.responsesService = (__runInitializers(this, _instanceExtraInitializers), responsesService);
        }
        ResponsesController_1.prototype.create = function (createResponseDto, req) {
            return this.responsesService.create(createResponseDto, req.user);
        };
        ResponsesController_1.prototype.findAll = function (page, limit, questionnaireId, organizationId, userId, startDate, endDate, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.responsesService.findAll({
                page: page,
                limit: limit,
                questionnaireId: questionnaireId,
                organizationId: organizationId,
                userId: userId,
                startDate: startDate,
                endDate: endDate,
            }, req.user);
        };
        ResponsesController_1.prototype.findOne = function (id, req) {
            return this.responsesService.findOne(id, req.user);
        };
        ResponsesController_1.prototype.findByQuestionnaire = function (questionnaireId, page, limit, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.responsesService.findByQuestionnaire(questionnaireId, { page: page, limit: limit }, req.user);
        };
        ResponsesController_1.prototype.findByUser = function (userId, page, limit, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.responsesService.findByUser(userId, { page: page, limit: limit }, req.user);
        };
        ResponsesController_1.prototype.findMyResponses = function (page, limit, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.responsesService.findMyResponses({ page: page, limit: limit }, req.user);
        };
        ResponsesController_1.prototype.update = function (id, updateResponseDto, req) {
            return this.responsesService.update(id, updateResponseDto, req.user);
        };
        ResponsesController_1.prototype.remove = function (id, req) {
            return this.responsesService.remove(id, req.user);
        };
        ResponsesController_1.prototype.getAnalysis = function (id, req) {
            return this.responsesService.getAnalysis(id, req.user);
        };
        ResponsesController_1.prototype.exportResponses = function (questionnaireId, format, req) {
            if (format === void 0) { format = 'json'; }
            return this.responsesService.exportResponses(questionnaireId, format, req.user);
        };
        ResponsesController_1.prototype.getQuestionnaireSummary = function (questionnaireId, req) {
            return this.responsesService.getQuestionnaireSummary(questionnaireId, req.user);
        };
        ResponsesController_1.prototype.bulkDelete = function (questionnaireId, responseIds, req) {
            return this.responsesService.bulkDelete(questionnaireId, responseIds, req.user);
        };
        return ResponsesController_1;
    }());
    __setFunctionName(_classThis, "ResponsesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Submit a response' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Response submitted successfully' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get all responses' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get response by ID' })];
        _findByQuestionnaire_decorators = [(0, common_1.Get)('questionnaire/:questionnaireId'), (0, swagger_1.ApiOperation)({ summary: 'Get responses by questionnaire' })];
        _findByUser_decorators = [(0, common_1.Get)('user/:userId'), (0, swagger_1.ApiOperation)({ summary: 'Get responses by user' })];
        _findMyResponses_decorators = [(0, common_1.Get)('my-responses'), (0, swagger_1.ApiOperation)({ summary: 'Get current user responses' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Update response' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete response' })];
        _getAnalysis_decorators = [(0, common_1.Get)(':id/analysis'), (0, swagger_1.ApiOperation)({ summary: 'Get response analysis' })];
        _exportResponses_decorators = [(0, common_1.Get)('questionnaire/:questionnaireId/export'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Export questionnaire responses' })];
        _getQuestionnaireSummary_decorators = [(0, common_1.Get)('questionnaire/:questionnaireId/summary'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaire response summary' })];
        _bulkDelete_decorators = [(0, common_1.Post)('questionnaire/:questionnaireId/bulk-delete'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Bulk delete responses' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findByQuestionnaire_decorators, { kind: "method", name: "findByQuestionnaire", static: false, private: false, access: { has: function (obj) { return "findByQuestionnaire" in obj; }, get: function (obj) { return obj.findByQuestionnaire; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findByUser_decorators, { kind: "method", name: "findByUser", static: false, private: false, access: { has: function (obj) { return "findByUser" in obj; }, get: function (obj) { return obj.findByUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findMyResponses_decorators, { kind: "method", name: "findMyResponses", static: false, private: false, access: { has: function (obj) { return "findMyResponses" in obj; }, get: function (obj) { return obj.findMyResponses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalysis_decorators, { kind: "method", name: "getAnalysis", static: false, private: false, access: { has: function (obj) { return "getAnalysis" in obj; }, get: function (obj) { return obj.getAnalysis; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportResponses_decorators, { kind: "method", name: "exportResponses", static: false, private: false, access: { has: function (obj) { return "exportResponses" in obj; }, get: function (obj) { return obj.exportResponses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getQuestionnaireSummary_decorators, { kind: "method", name: "getQuestionnaireSummary", static: false, private: false, access: { has: function (obj) { return "getQuestionnaireSummary" in obj; }, get: function (obj) { return obj.getQuestionnaireSummary; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _bulkDelete_decorators, { kind: "method", name: "bulkDelete", static: false, private: false, access: { has: function (obj) { return "bulkDelete" in obj; }, get: function (obj) { return obj.bulkDelete; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ResponsesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ResponsesController = _classThis;
}();
exports.ResponsesController = ResponsesController;
