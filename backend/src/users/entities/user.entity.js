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
exports.User = void 0;
var typeorm_1 = require("typeorm");
var class_transformer_1 = require("class-transformer");
var organization_entity_1 = require("../../organizations/entities/organization.entity");
var constants_1 = require("../../shared/constants");
var User = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('users'), (0, typeorm_1.Index)(['email'], { unique: true }), (0, typeorm_1.Index)(['organizationId']), (0, typeorm_1.Index)(['role'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
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
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _lastLogin_decorators;
    var _lastLogin_initializers = [];
    var _lastLogin_extraInitializers = [];
    var _emailVerified_decorators;
    var _emailVerified_initializers = [];
    var _emailVerified_extraInitializers = [];
    var _verificationToken_decorators;
    var _verificationToken_initializers = [];
    var _verificationToken_extraInitializers = [];
    var _resetPasswordToken_decorators;
    var _resetPasswordToken_initializers = [];
    var _resetPasswordToken_extraInitializers = [];
    var _resetPasswordExpires_decorators;
    var _resetPasswordExpires_initializers = [];
    var _resetPasswordExpires_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _deletedAt_decorators;
    var _deletedAt_initializers = [];
    var _deletedAt_extraInitializers = [];
    var _normalizeEmail_decorators;
    var _setDefaultValues_decorators;
    var User = _classThis = /** @class */ (function () {
        function User_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.firstName = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
            this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
            this.email = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
            this.role = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.position = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _position_initializers, void 0));
            this.phone = (__runInitializers(this, _position_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
            this.profileImageUrl = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _profileImageUrl_initializers, void 0));
            this.isActive = (__runInitializers(this, _profileImageUrl_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.organizationId = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
            this.organization = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _organization_initializers, void 0));
            this.lastLogin = (__runInitializers(this, _organization_extraInitializers), __runInitializers(this, _lastLogin_initializers, void 0));
            this.emailVerified = (__runInitializers(this, _lastLogin_extraInitializers), __runInitializers(this, _emailVerified_initializers, void 0));
            this.verificationToken = (__runInitializers(this, _emailVerified_extraInitializers), __runInitializers(this, _verificationToken_initializers, void 0));
            this.resetPasswordToken = (__runInitializers(this, _verificationToken_extraInitializers), __runInitializers(this, _resetPasswordToken_initializers, void 0));
            this.resetPasswordExpires = (__runInitializers(this, _resetPasswordToken_extraInitializers), __runInitializers(this, _resetPasswordExpires_initializers, void 0));
            this.createdAt = (__runInitializers(this, _resetPasswordExpires_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        Object.defineProperty(User_1.prototype, "fullName", {
            // Virtual property for full name
            get: function () {
                return "".concat(this.firstName, " ").concat(this.lastName);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(User_1.prototype, "initials", {
            // Virtual property for initials
            get: function () {
                return "".concat(this.firstName.charAt(0)).concat(this.lastName.charAt(0)).toUpperCase();
            },
            enumerable: false,
            configurable: true
        });
        User_1.prototype.normalizeEmail = function () {
            if (this.email) {
                this.email = this.email.toLowerCase().trim();
            }
        };
        User_1.prototype.setDefaultValues = function () {
            if (!this.role) {
                this.role = constants_1.UserRole.USER;
            }
            if (this.isActive === undefined) {
                this.isActive = true;
            }
            if (this.emailVerified === undefined) {
                this.emailVerified = false;
            }
        };
        return User_1;
    }());
    __setFunctionName(_classThis, "User");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _firstName_decorators = [(0, typeorm_1.Column)()];
        _lastName_decorators = [(0, typeorm_1.Column)()];
        _email_decorators = [(0, typeorm_1.Column)()];
        _password_decorators = [(0, typeorm_1.Column)(), (0, class_transformer_1.Exclude)()];
        _role_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: constants_1.UserRole,
                default: constants_1.UserRole.USER,
            })];
        _position_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _phone_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _profileImageUrl_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'profile_image_url' })];
        _isActive_decorators = [(0, typeorm_1.Column)({ default: true, name: 'is_active' })];
        _organizationId_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'organization_id' })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.users; }, {
                onDelete: 'CASCADE',
            }), (0, typeorm_1.JoinColumn)({ name: 'organization_id' })];
        _lastLogin_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'last_login' })];
        _emailVerified_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'email_verified' })];
        _verificationToken_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'verification_token' })];
        _resetPasswordToken_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'reset_password_token' })];
        _resetPasswordExpires_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'reset_password_expires' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' })];
        _normalizeEmail_decorators = [(0, typeorm_1.BeforeInsert)(), (0, typeorm_1.BeforeUpdate)()];
        _setDefaultValues_decorators = [(0, typeorm_1.BeforeInsert)()];
        __esDecorate(_classThis, null, _normalizeEmail_decorators, { kind: "method", name: "normalizeEmail", static: false, private: false, access: { has: function (obj) { return "normalizeEmail" in obj; }, get: function (obj) { return obj.normalizeEmail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _setDefaultValues_decorators, { kind: "method", name: "setDefaultValues", static: false, private: false, access: { has: function (obj) { return "setDefaultValues" in obj; }, get: function (obj) { return obj.setDefaultValues; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
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
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _lastLogin_decorators, { kind: "field", name: "lastLogin", static: false, private: false, access: { has: function (obj) { return "lastLogin" in obj; }, get: function (obj) { return obj.lastLogin; }, set: function (obj, value) { obj.lastLogin = value; } }, metadata: _metadata }, _lastLogin_initializers, _lastLogin_extraInitializers);
        __esDecorate(null, null, _emailVerified_decorators, { kind: "field", name: "emailVerified", static: false, private: false, access: { has: function (obj) { return "emailVerified" in obj; }, get: function (obj) { return obj.emailVerified; }, set: function (obj, value) { obj.emailVerified = value; } }, metadata: _metadata }, _emailVerified_initializers, _emailVerified_extraInitializers);
        __esDecorate(null, null, _verificationToken_decorators, { kind: "field", name: "verificationToken", static: false, private: false, access: { has: function (obj) { return "verificationToken" in obj; }, get: function (obj) { return obj.verificationToken; }, set: function (obj, value) { obj.verificationToken = value; } }, metadata: _metadata }, _verificationToken_initializers, _verificationToken_extraInitializers);
        __esDecorate(null, null, _resetPasswordToken_decorators, { kind: "field", name: "resetPasswordToken", static: false, private: false, access: { has: function (obj) { return "resetPasswordToken" in obj; }, get: function (obj) { return obj.resetPasswordToken; }, set: function (obj, value) { obj.resetPasswordToken = value; } }, metadata: _metadata }, _resetPasswordToken_initializers, _resetPasswordToken_extraInitializers);
        __esDecorate(null, null, _resetPasswordExpires_decorators, { kind: "field", name: "resetPasswordExpires", static: false, private: false, access: { has: function (obj) { return "resetPasswordExpires" in obj; }, get: function (obj) { return obj.resetPasswordExpires; }, set: function (obj, value) { obj.resetPasswordExpires = value; } }, metadata: _metadata }, _resetPasswordExpires_initializers, _resetPasswordExpires_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
}();
exports.User = User;
