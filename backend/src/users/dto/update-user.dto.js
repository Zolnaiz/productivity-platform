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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var constants_1 = require("../../shared/constants");
var UpdateUserDto = function () {
    var _a;
    var _firstName_decorators;
    var _firstName_initializers = [];
    var _firstName_extraInitializers = [];
    var _lastName_decorators;
    var _lastName_initializers = [];
    var _lastName_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _password_decorators;
    var _password_initializers = [];
    var _password_extraInitializers = [];
    var _role_decorators;
    var _role_initializers = [];
    var _role_extraInitializers = [];
    var _position_decorators;
    var _position_initializers = [];
    var _position_extraInitializers = [];
    var _phone_decorators;
    var _phone_initializers = [];
    var _phone_extraInitializers = [];
    var _profileImageUrl_decorators;
    var _profileImageUrl_initializers = [];
    var _profileImageUrl_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateUserDto() {
                this.firstName = __runInitializers(this, _firstName_initializers, void 0);
                this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
                this.email = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
                this.role = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _role_initializers, void 0));
                this.position = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _position_initializers, void 0));
                this.phone = (__runInitializers(this, _position_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
                this.profileImageUrl = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _profileImageUrl_initializers, void 0));
                this.isActive = (__runInitializers(this, _profileImageUrl_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                this.organizationId = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                __runInitializers(this, _organizationId_extraInitializers);
            }
            return UpdateUserDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _firstName_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'John',
                    description: 'User first name',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(50)];
            _lastName_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Doe',
                    description: 'User last name',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(50)];
            _email_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'user@example.com',
                    description: 'User email address',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _password_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Password123!',
                    description: 'User password',
                    minLength: 6,
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(6), (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                })];
            _role_decorators = [(0, swagger_1.ApiProperty)({
                    enum: constants_1.UserRole,
                    example: constants_1.UserRole.USER,
                    description: 'User role',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(constants_1.UserRole)];
            _position_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Software Developer',
                    description: 'User position',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100)];
            _phone_decorators = [(0, swagger_1.ApiProperty)({
                    example: '+1234567890',
                    description: 'Phone number',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _profileImageUrl_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'https://example.com/profile.jpg',
                    description: 'Profile image URL',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _isActive_decorators = [(0, swagger_1.ApiProperty)({
                    example: true,
                    description: 'Whether user is active',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'org_123',
                    description: 'Organization ID',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: function (obj) { return "firstName" in obj; }, get: function (obj) { return obj.firstName; }, set: function (obj, value) { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: function (obj) { return "lastName" in obj; }, get: function (obj) { return obj.lastName; }, set: function (obj, value) { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: function (obj) { return "password" in obj; }, get: function (obj) { return obj.password; }, set: function (obj, value) { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: function (obj) { return "role" in obj; }, get: function (obj) { return obj.role; }, set: function (obj, value) { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: function (obj) { return "position" in obj; }, get: function (obj) { return obj.position; }, set: function (obj, value) { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: function (obj) { return "phone" in obj; }, get: function (obj) { return obj.phone; }, set: function (obj, value) { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            __esDecorate(null, null, _profileImageUrl_decorators, { kind: "field", name: "profileImageUrl", static: false, private: false, access: { has: function (obj) { return "profileImageUrl" in obj; }, get: function (obj) { return obj.profileImageUrl; }, set: function (obj, value) { obj.profileImageUrl = value; } }, metadata: _metadata }, _profileImageUrl_initializers, _profileImageUrl_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateUserDto = UpdateUserDto;
