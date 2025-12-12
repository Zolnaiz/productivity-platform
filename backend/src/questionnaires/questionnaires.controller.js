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
exports.QuestionnairesController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../shared/decorators/roles.decorator");
var constants_1 = require("../shared/constants");
var swagger_1 = require("@nestjs/swagger");
var QuestionnairesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('questionnaires'), (0, common_1.Controller)('questionnaires'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _findByOrganization_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _activate_decorators;
    var _deactivate_decorators;
    var _getResponses_decorators;
    var _getAnalytics_decorators;
    var _getShareLink_decorators;
    var _duplicate_decorators;
    var _getQuestions_decorators;
    var QuestionnairesController = _classThis = /** @class */ (function () {
        function QuestionnairesController_1(questionnairesService) {
            this.questionnairesService = (__runInitializers(this, _instanceExtraInitializers), questionnairesService);
        }
        QuestionnairesController_1.prototype.create = function (createQuestionnaireDto, req) {
            return this.questionnairesService.create(createQuestionnaireDto, req.user);
        };
        QuestionnairesController_1.prototype.findAll = function (page, limit, search, organizationId, isActive, expired, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.questionnairesService.findAll({
                page: page,
                limit: limit,
                search: search,
                organizationId: organizationId,
                isActive: isActive,
                expired: expired,
            }, req.user);
        };
        QuestionnairesController_1.prototype.findOne = function (id, req) {
            return this.questionnairesService.findOne(id, req.user);
        };
        QuestionnairesController_1.prototype.findByOrganization = function (organizationId, page, limit, isActive, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.questionnairesService.findByOrganization(organizationId, { page: page, limit: limit, isActive: isActive }, req.user);
        };
        QuestionnairesController_1.prototype.update = function (id, updateQuestionnaireDto, req) {
            return this.questionnairesService.update(id, updateQuestionnaireDto, req.user);
        };
        QuestionnairesController_1.prototype.remove = function (id, req) {
            return this.questionnairesService.remove(id, req.user);
        };
        QuestionnairesController_1.prototype.activate = function (id, req) {
            return this.questionnairesService.activate(id, req.user);
        };
        QuestionnairesController_1.prototype.deactivate = function (id, req) {
            return this.questionnairesService.deactivate(id, req.user);
        };
        QuestionnairesController_1.prototype.getResponses = function (id, page, limit, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.questionnairesService.getResponses(id, { page: page, limit: limit }, req.user);
        };
        QuestionnairesController_1.prototype.getAnalytics = function (id, req) {
            return this.questionnairesService.getAnalytics(id, req.user);
        };
        QuestionnairesController_1.prototype.getShareLink = function (id, req) {
            return this.questionnairesService.getShareLink(id, req.user);
        };
        QuestionnairesController_1.prototype.duplicate = function (id, req) {
            return this.questionnairesService.duplicate(id, req.user);
        };
        QuestionnairesController_1.prototype.getQuestions = function (id, req) {
            return this.questionnairesService.getQuestions(id, req.user);
        };
        return QuestionnairesController_1;
    }());
    __setFunctionName(_classThis, "QuestionnairesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Create a new questionnaire' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Questionnaire created successfully' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get all questionnaires' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaire by ID' })];
        _findByOrganization_decorators = [(0, common_1.Get)('organization/:organizationId'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaires by organization' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Update questionnaire' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Delete questionnaire' })];
        _activate_decorators = [(0, common_1.Post)(':id/activate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Activate questionnaire' })];
        _deactivate_decorators = [(0, common_1.Post)(':id/deactivate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Deactivate questionnaire' })];
        _getResponses_decorators = [(0, common_1.Get)(':id/responses'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaire responses' })];
        _getAnalytics_decorators = [(0, common_1.Get)(':id/analytics'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaire analytics' })];
        _getShareLink_decorators = [(0, common_1.Get)(':id/share-link'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaire share link' })];
        _duplicate_decorators = [(0, common_1.Post)(':id/duplicate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN, constants_1.UserRole.USER), (0, swagger_1.ApiOperation)({ summary: 'Duplicate questionnaire' })];
        _getQuestions_decorators = [(0, common_1.Get)(':id/questions'), (0, swagger_1.ApiOperation)({ summary: 'Get questionnaire questions' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findByOrganization_decorators, { kind: "method", name: "findByOrganization", static: false, private: false, access: { has: function (obj) { return "findByOrganization" in obj; }, get: function (obj) { return obj.findByOrganization; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _activate_decorators, { kind: "method", name: "activate", static: false, private: false, access: { has: function (obj) { return "activate" in obj; }, get: function (obj) { return obj.activate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deactivate_decorators, { kind: "method", name: "deactivate", static: false, private: false, access: { has: function (obj) { return "deactivate" in obj; }, get: function (obj) { return obj.deactivate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getResponses_decorators, { kind: "method", name: "getResponses", static: false, private: false, access: { has: function (obj) { return "getResponses" in obj; }, get: function (obj) { return obj.getResponses; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalytics_decorators, { kind: "method", name: "getAnalytics", static: false, private: false, access: { has: function (obj) { return "getAnalytics" in obj; }, get: function (obj) { return obj.getAnalytics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getShareLink_decorators, { kind: "method", name: "getShareLink", static: false, private: false, access: { has: function (obj) { return "getShareLink" in obj; }, get: function (obj) { return obj.getShareLink; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _duplicate_decorators, { kind: "method", name: "duplicate", static: false, private: false, access: { has: function (obj) { return "duplicate" in obj; }, get: function (obj) { return obj.duplicate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getQuestions_decorators, { kind: "method", name: "getQuestions", static: false, private: false, access: { has: function (obj) { return "getQuestions" in obj; }, get: function (obj) { return obj.getQuestions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuestionnairesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuestionnairesController = _classThis;
}();
exports.QuestionnairesController = QuestionnairesController;
