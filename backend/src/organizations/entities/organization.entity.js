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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organization = void 0;
var typeorm_1 = require("typeorm");
var user_entity_1 = require("../../users/entities/user.entity");
var Organization = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('organizations'), (0, typeorm_1.Index)(['name'], { unique: true })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _logoUrl_decorators;
    var _logoUrl_initializers = [];
    var _logoUrl_extraInitializers = [];
    var _website_decorators;
    var _website_initializers = [];
    var _website_extraInitializers = [];
    var _contactEmail_decorators;
    var _contactEmail_initializers = [];
    var _contactEmail_extraInitializers = [];
    var _phone_decorators;
    var _phone_initializers = [];
    var _phone_extraInitializers = [];
    var _address_decorators;
    var _address_initializers = [];
    var _address_extraInitializers = [];
    var _features_decorators;
    var _features_initializers = [];
    var _features_extraInitializers = [];
    var _settings_decorators;
    var _settings_initializers = [];
    var _settings_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _users_decorators;
    var _users_initializers = [];
    var _users_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _deletedAt_decorators;
    var _deletedAt_initializers = [];
    var _deletedAt_extraInitializers = [];
    var Organization = _classThis = /** @class */ (function () {
        function Organization_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.logoUrl = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _logoUrl_initializers, void 0));
            this.website = (__runInitializers(this, _logoUrl_extraInitializers), __runInitializers(this, _website_initializers, void 0));
            this.contactEmail = (__runInitializers(this, _website_extraInitializers), __runInitializers(this, _contactEmail_initializers, void 0));
            this.phone = (__runInitializers(this, _contactEmail_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
            this.address = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _address_initializers, void 0));
            this.features = (__runInitializers(this, _address_extraInitializers), __runInitializers(this, _features_initializers, void 0));
            this.settings = (__runInitializers(this, _features_extraInitializers), __runInitializers(this, _settings_initializers, void 0));
            this.isActive = (__runInitializers(this, _settings_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.users = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _users_initializers, void 0));
            this.createdAt = (__runInitializers(this, _users_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        Object.defineProperty(Organization_1.prototype, "userCount", {
            // Virtual property for user count
            get: function () {
                var _a;
                return ((_a = this.users) === null || _a === void 0 ? void 0 : _a.length) || 0;
            },
            enumerable: false,
            configurable: true
        });
        return Organization_1;
    }());
    __setFunctionName(_classThis, "Organization");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)()];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _logoUrl_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'logo_url' })];
        _website_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _contactEmail_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'contact_email' })];
        _phone_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _address_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _features_decorators = [(0, typeorm_1.Column)('simple-array', { nullable: true })];
        _settings_decorators = [(0, typeorm_1.Column)('jsonb', { nullable: true })];
        _isActive_decorators = [(0, typeorm_1.Column)({ default: true, name: 'is_active' })];
        _users_decorators = [(0, typeorm_1.OneToMany)(function () { return user_entity_1.User; }, function (user) { return user.organization; })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _logoUrl_decorators, { kind: "field", name: "logoUrl", static: false, private: false, access: { has: function (obj) { return "logoUrl" in obj; }, get: function (obj) { return obj.logoUrl; }, set: function (obj, value) { obj.logoUrl = value; } }, metadata: _metadata }, _logoUrl_initializers, _logoUrl_extraInitializers);
        __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: function (obj) { return "website" in obj; }, get: function (obj) { return obj.website; }, set: function (obj, value) { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
        __esDecorate(null, null, _contactEmail_decorators, { kind: "field", name: "contactEmail", static: false, private: false, access: { has: function (obj) { return "contactEmail" in obj; }, get: function (obj) { return obj.contactEmail; }, set: function (obj, value) { obj.contactEmail = value; } }, metadata: _metadata }, _contactEmail_initializers, _contactEmail_extraInitializers);
        __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: function (obj) { return "phone" in obj; }, get: function (obj) { return obj.phone; }, set: function (obj, value) { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
        __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: function (obj) { return "address" in obj; }, get: function (obj) { return obj.address; }, set: function (obj, value) { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
        __esDecorate(null, null, _features_decorators, { kind: "field", name: "features", static: false, private: false, access: { has: function (obj) { return "features" in obj; }, get: function (obj) { return obj.features; }, set: function (obj, value) { obj.features = value; } }, metadata: _metadata }, _features_initializers, _features_extraInitializers);
        __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _users_decorators, { kind: "field", name: "users", static: false, private: false, access: { has: function (obj) { return "users" in obj; }, get: function (obj) { return obj.users; }, set: function (obj, value) { obj.users = value; } }, metadata: _metadata }, _users_initializers, _users_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Organization = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Organization = _classThis;
}();
exports.Organization = Organization;
