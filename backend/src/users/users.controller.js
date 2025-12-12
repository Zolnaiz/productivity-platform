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
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
var roles_guard_1 = require("../auth/guards/roles.guard");
var roles_decorator_1 = require("../shared/decorators/roles.decorator");
var constants_1 = require("../shared/constants");
var swagger_1 = require("@nestjs/swagger");
var UsersController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('users'), (0, common_1.Controller)('users'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _getProfile_decorators;
    var _update_decorators;
    var _updateProfile_decorators;
    var _remove_decorators;
    var _activate_decorators;
    var _deactivate_decorators;
    var _getPermissions_decorators;
    var _changeRole_decorators;
    var UsersController = _classThis = /** @class */ (function () {
        function UsersController_1(usersService) {
            this.usersService = (__runInitializers(this, _instanceExtraInitializers), usersService);
        }
        UsersController_1.prototype.create = function (createUserDto, req) {
            return this.usersService.create(createUserDto, req.user.organizationId);
        };
        UsersController_1.prototype.findAll = function (page, limit, search, role, req) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return this.usersService.findAll({
                page: page,
                limit: limit,
                search: search,
                role: role,
            }, req.user.organizationId, req.user.role);
        };
        UsersController_1.prototype.findOne = function (id, req) {
            return this.usersService.findOne(id, req.user);
        };
        UsersController_1.prototype.getProfile = function (req) {
            return this.usersService.getProfile(req.user.id);
        };
        UsersController_1.prototype.update = function (id, updateUserDto, req) {
            return this.usersService.update(id, updateUserDto, req.user);
        };
        UsersController_1.prototype.updateProfile = function (updateUserDto, req) {
            return this.usersService.updateProfile(req.user.id, updateUserDto);
        };
        UsersController_1.prototype.remove = function (id, req) {
            return this.usersService.remove(id, req.user);
        };
        UsersController_1.prototype.activate = function (id, req) {
            return this.usersService.activate(id, req.user);
        };
        UsersController_1.prototype.deactivate = function (id, req) {
            return this.usersService.deactivate(id, req.user);
        };
        UsersController_1.prototype.getPermissions = function (id, req) {
            return this.usersService.getPermissions(id, req.user);
        };
        UsersController_1.prototype.changeRole = function (id, role, req) {
            return this.usersService.changeRole(id, role, req.user);
        };
        return UsersController_1;
    }());
    __setFunctionName(_classThis, "UsersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' })];
        _findAll_decorators = [(0, common_1.Get)(), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Get all users' })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' })];
        _getProfile_decorators = [(0, common_1.Get)('profile/me'), (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' })];
        _update_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update user' })];
        _updateProfile_decorators = [(0, common_1.Patch)('profile/me'), (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Delete user' })];
        _activate_decorators = [(0, common_1.Post)(':id/activate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Activate user' })];
        _deactivate_decorators = [(0, common_1.Post)(':id/deactivate'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Deactivate user' })];
        _getPermissions_decorators = [(0, common_1.Get)(':id/permissions'), (0, swagger_1.ApiOperation)({ summary: 'Get user permissions' })];
        _changeRole_decorators = [(0, common_1.Post)(':id/change-role'), (0, roles_decorator_1.Roles)(constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.ORGANIZATION_ADMIN), (0, swagger_1.ApiOperation)({ summary: 'Change user role' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: function (obj) { return "getProfile" in obj; }, get: function (obj) { return obj.getProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateProfile_decorators, { kind: "method", name: "updateProfile", static: false, private: false, access: { has: function (obj) { return "updateProfile" in obj; }, get: function (obj) { return obj.updateProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _activate_decorators, { kind: "method", name: "activate", static: false, private: false, access: { has: function (obj) { return "activate" in obj; }, get: function (obj) { return obj.activate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deactivate_decorators, { kind: "method", name: "deactivate", static: false, private: false, access: { has: function (obj) { return "deactivate" in obj; }, get: function (obj) { return obj.deactivate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPermissions_decorators, { kind: "method", name: "getPermissions", static: false, private: false, access: { has: function (obj) { return "getPermissions" in obj; }, get: function (obj) { return obj.getPermissions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _changeRole_decorators, { kind: "method", name: "changeRole", static: false, private: false, access: { has: function (obj) { return "changeRole" in obj; }, get: function (obj) { return obj.changeRole; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersController = _classThis;
}();
exports.UsersController = UsersController;
