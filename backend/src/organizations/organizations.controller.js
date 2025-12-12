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
exports.OrganizationsController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../shared/decorators/roles.decorator");
var constants_1 = require("../shared/constants");
var swagger_1 = require("@nestjs/swagger");
var OrganizationsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('organizations'), (0, common_1.Controller)('organizations'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _getMyOrganization_decorators;
    var _findOne_decorators;
    var _update_decorators;
    var _remove_decorators;
    var _activate_decorators;
    var _deactivate_decorators;
    var _getUsers_decorators;
    var _getStats_decorators;
    var _inviteUser_decorators;
    var _removeUser_decorators;
    var OrganizationsController = _classThis = /** @class */ (function () {
        function OrganizationsController_1(organizationsService) {
            this.organizationsService = (__runInitializers(this, _instanceExtraInitializers), organizationsService);
        }
        OrganizationsController_1.prototype.create = function (createOrganizationDto) {
            return this.organizationsService.create(createOrganizationDto);
        };
        OrganizationsController_1.prototype.findAll = function (page, limit, search, isActive) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.organizationsService.findAll({
                page: page,
                limit: limit,
                search: search,
                isActive: isActive,
            });
        };
        OrganizationsController_1.prototype.getMyOrganization = function (req) {
            return this.organizationsService.getMyOrganization(req.user.organizationId);
        };
        OrganizationsController_1.prototype.findOne = function (id) {
            return this.organizationsService.findOne(id);
        };
        OrganizationsController_1.prototype.update = function (id, updateOrganizationDto) {
            return this.organizationsService.update(id, updateOrganizationDto);
        };
        OrganizationsController_1.prototype.remove = function (id) {
            return this.organizationsService.remove(id);
        };
        OrganizationsController_1.prototype.activate = function (id) {
            return this.organizationsService.activate(id);
        };
        OrganizationsController_1.prototype.deactivate = function (id) {
            return this.organizationsService.deactivate(id);
        };
        OrganizationsController_1.prototype.getUsers = function (id, page, limit, search, role, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.organizationsService.getUsers(id, { page: page, limit: limit, search: search, role: role }, req.user);
        };
        OrganizationsController_1.prototype.getStats = function (id, req) {
            return this.organizationsService.getStats(id, req.user);
        };
        OrganizationsController_1.prototype.inviteUser = function (id, email, role, req) {
            return this.organizationsService.inviteUser(id, email, role, req.user);
        };
        OrganizationsController_1.prototype.removeUser = function (id, userId, req) {
            return this.organizationsService.removeUser(id, userId, req.user);
        };
        return OrganizationsController_1;
    }());
    __setFunctionName(_classThis, "OrganizationsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Create a new organization' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Organization created successfully' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get all organizations' })];
        _getMyOrganization_decorators = [(0, common_1.Get)('my-organization'), (0, swagger_1.ApiOperation)({ summary: 'Get current user organization' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get organization by ID' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Update organization' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete organization' })];
        _activate_decorators = [(0, common_1.Post)(':id/activate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Activate organization' })];
        _deactivate_decorators = [(0, common_1.Post)(':id/deactivate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Deactivate organization' })];
        _getUsers_decorators = [(0, common_1.Get)(':id/users'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get organization users' })];
        _getStats_decorators = [(0, common_1.Get)(':id/stats'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get organization statistics' })];
        _inviteUser_decorators = [(0, common_1.Post)(':id/invite-user'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Invite user to organization' })];
        _removeUser_decorators = [(0, common_1.Post)(':id/remove-user/:userId'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Remove user from organization' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyOrganization_decorators, { kind: "method", name: "getMyOrganization", static: false, private: false, access: { has: function (obj) { return "getMyOrganization" in obj; }, get: function (obj) { return obj.getMyOrganization; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _activate_decorators, { kind: "method", name: "activate", static: false, private: false, access: { has: function (obj) { return "activate" in obj; }, get: function (obj) { return obj.activate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deactivate_decorators, { kind: "method", name: "deactivate", static: false, private: false, access: { has: function (obj) { return "deactivate" in obj; }, get: function (obj) { return obj.deactivate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsers_decorators, { kind: "method", name: "getUsers", static: false, private: false, access: { has: function (obj) { return "getUsers" in obj; }, get: function (obj) { return obj.getUsers; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: function (obj) { return "getStats" in obj; }, get: function (obj) { return obj.getStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _inviteUser_decorators, { kind: "method", name: "inviteUser", static: false, private: false, access: { has: function (obj) { return "inviteUser" in obj; }, get: function (obj) { return obj.inviteUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeUser_decorators, { kind: "method", name: "removeUser", static: false, private: false, access: { has: function (obj) { return "removeUser" in obj; }, get: function (obj) { return obj.removeUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrganizationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrganizationsController = _classThis;
}();
exports.OrganizationsController = OrganizationsController;
