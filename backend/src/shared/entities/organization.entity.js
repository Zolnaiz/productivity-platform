"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.Organization = exports.OrganizationStatus = void 0;
var typeorm_1 = require("typeorm");
var swagger_1 = require("@nestjs/swagger");
var base_entity_1 = require("./base.entity");
var user_entity_1 = require("./user.entity");
var questionnaire_entity_1 = require("./questionnaire.entity");
var response_entity_1 = require("./response.entity");
var expense_entity_1 = require("../../expenses/entities/expense.entity");
var report_entity_1 = require("./report.entity");
var OrganizationStatus;
(function (OrganizationStatus) {
    OrganizationStatus["ACTIVE"] = "active";
    OrganizationStatus["INACTIVE"] = "inactive";
    OrganizationStatus["PENDING"] = "pending";
    OrganizationStatus["SUSPENDED"] = "suspended";
})(OrganizationStatus || (exports.OrganizationStatus = OrganizationStatus = {}));
var Organization = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('organizations'), (0, typeorm_1.Index)(['email'], { unique: true }), (0, typeorm_1.Index)(['taxNumber'], { unique: true }), (0, typeorm_1.Index)(['status', 'createdAt'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _phone_decorators;
    var _phone_initializers = [];
    var _phone_extraInitializers = [];
    var _address_decorators;
    var _address_initializers = [];
    var _address_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _taxNumber_decorators;
    var _taxNumber_initializers = [];
    var _taxNumber_extraInitializers = [];
    var _logo_decorators;
    var _logo_initializers = [];
    var _logo_extraInitializers = [];
    var _website_decorators;
    var _website_initializers = [];
    var _website_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _industry_decorators;
    var _industry_initializers = [];
    var _industry_extraInitializers = [];
    var _employeeCount_decorators;
    var _employeeCount_initializers = [];
    var _employeeCount_extraInitializers = [];
    var _contactPersonName_decorators;
    var _contactPersonName_initializers = [];
    var _contactPersonName_extraInitializers = [];
    var _contactPersonPosition_decorators;
    var _contactPersonPosition_initializers = [];
    var _contactPersonPosition_extraInitializers = [];
    var _settings_decorators;
    var _settings_initializers = [];
    var _settings_extraInitializers = [];
    var _users_decorators;
    var _users_initializers = [];
    var _users_extraInitializers = [];
    var _questionnaires_decorators;
    var _questionnaires_initializers = [];
    var _questionnaires_extraInitializers = [];
    var _responses_decorators;
    var _responses_initializers = [];
    var _responses_extraInitializers = [];
    var _expenses_decorators;
    var _expenses_initializers = [];
    var _expenses_extraInitializers = [];
    var _reports_decorators;
    var _reports_initializers = [];
    var _reports_extraInitializers = [];
    var Organization = _classThis = /** @class */ (function (_super) {
        __extends(Organization_1, _super);
        function Organization_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.name = __runInitializers(_this, _name_initializers, void 0);
            _this.email = (__runInitializers(_this, _name_extraInitializers), __runInitializers(_this, _email_initializers, void 0));
            _this.phone = (__runInitializers(_this, _email_extraInitializers), __runInitializers(_this, _phone_initializers, void 0));
            _this.address = (__runInitializers(_this, _phone_extraInitializers), __runInitializers(_this, _address_initializers, void 0));
            _this.description = (__runInitializers(_this, _address_extraInitializers), __runInitializers(_this, _description_initializers, void 0));
            _this.taxNumber = (__runInitializers(_this, _description_extraInitializers), __runInitializers(_this, _taxNumber_initializers, void 0));
            _this.logo = (__runInitializers(_this, _taxNumber_extraInitializers), __runInitializers(_this, _logo_initializers, void 0));
            _this.website = (__runInitializers(_this, _logo_extraInitializers), __runInitializers(_this, _website_initializers, void 0));
            _this.status = (__runInitializers(_this, _website_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.industry = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _industry_initializers, void 0));
            _this.employeeCount = (__runInitializers(_this, _industry_extraInitializers), __runInitializers(_this, _employeeCount_initializers, void 0));
            _this.contactPersonName = (__runInitializers(_this, _employeeCount_extraInitializers), __runInitializers(_this, _contactPersonName_initializers, void 0));
            _this.contactPersonPosition = (__runInitializers(_this, _contactPersonName_extraInitializers), __runInitializers(_this, _contactPersonPosition_initializers, void 0));
            _this.settings = (__runInitializers(_this, _contactPersonPosition_extraInitializers), __runInitializers(_this, _settings_initializers, void 0));
            // Relationships
            _this.users = (__runInitializers(_this, _settings_extraInitializers), __runInitializers(_this, _users_initializers, void 0));
            _this.questionnaires = (__runInitializers(_this, _users_extraInitializers), __runInitializers(_this, _questionnaires_initializers, void 0));
            _this.responses = (__runInitializers(_this, _questionnaires_extraInitializers), __runInitializers(_this, _responses_initializers, void 0));
            _this.expenses = (__runInitializers(_this, _responses_extraInitializers), __runInitializers(_this, _expenses_initializers, void 0));
            _this.reports = (__runInitializers(_this, _expenses_extraInitializers), __runInitializers(_this, _reports_initializers, void 0));
            __runInitializers(_this, _reports_extraInitializers);
            return _this;
        }
        return Organization_1;
    }(_classSuper));
    __setFunctionName(_classThis, "Organization");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _name_decorators = [(0, swagger_1.ApiProperty)({ description: 'Байгууллагын нэр' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _email_decorators = [(0, swagger_1.ApiProperty)({ description: 'Байгууллагын и-мэйл' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true })];
        _phone_decorators = [(0, swagger_1.ApiProperty)({ description: 'Утасны дугаар' }), (0, typeorm_1.Column)({ type: 'varchar', length: 20 })];
        _address_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хаяг' }), (0, typeorm_1.Column)({ type: 'text' })];
        _description_decorators = [(0, swagger_1.ApiProperty)({ description: 'Байгууллагын тайлбар', nullable: true }), (0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _taxNumber_decorators = [(0, swagger_1.ApiProperty)({ description: 'Татварын дугаар' }), (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true })];
        _logo_decorators = [(0, swagger_1.ApiProperty)({ description: 'Байгууллагын лого', nullable: true }), (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _website_decorators = [(0, swagger_1.ApiProperty)({ description: 'Вебсайт', nullable: true }), (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _status_decorators = [(0, swagger_1.ApiProperty)({ description: 'Байгууллагын төлөв', enum: OrganizationStatus, default: OrganizationStatus.PENDING }), (0, typeorm_1.Column)({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.PENDING })];
        _industry_decorators = [(0, swagger_1.ApiProperty)({ description: 'Үйл ажиллагааны салбар' }), (0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _employeeCount_decorators = [(0, swagger_1.ApiProperty)({ description: 'Ажилчдын тоо' }), (0, typeorm_1.Column)({ type: 'integer' })];
        _contactPersonName_decorators = [(0, swagger_1.ApiProperty)({ description: 'Эрх бүхий хүний нэр' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _contactPersonPosition_decorators = [(0, swagger_1.ApiProperty)({ description: 'Эрх бүхий хүний албан тушаал' }), (0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _settings_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тохиргоо (JSON)' }), (0, typeorm_1.Column)({ type: 'json', default: {} })];
        _users_decorators = [(0, typeorm_1.OneToMany)(function () { return user_entity_1.User; }, function (user) { return user.organization; })];
        _questionnaires_decorators = [(0, typeorm_1.OneToMany)(function () { return questionnaire_entity_1.Questionnaire; }, function (questionnaire) { return questionnaire.organization; })];
        _responses_decorators = [(0, typeorm_1.OneToMany)(function () { return response_entity_1.Response; }, function (response) { return response.organization; })];
        _expenses_decorators = [(0, typeorm_1.OneToMany)(function () { return expense_entity_1.Expense; }, function (expense) { return expense.organization; })];
        _reports_decorators = [(0, typeorm_1.OneToMany)(function () { return report_entity_1.Report; }, function (report) { return report.organization; })];
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: function (obj) { return "phone" in obj; }, get: function (obj) { return obj.phone; }, set: function (obj, value) { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
        __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: function (obj) { return "address" in obj; }, get: function (obj) { return obj.address; }, set: function (obj, value) { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _taxNumber_decorators, { kind: "field", name: "taxNumber", static: false, private: false, access: { has: function (obj) { return "taxNumber" in obj; }, get: function (obj) { return obj.taxNumber; }, set: function (obj, value) { obj.taxNumber = value; } }, metadata: _metadata }, _taxNumber_initializers, _taxNumber_extraInitializers);
        __esDecorate(null, null, _logo_decorators, { kind: "field", name: "logo", static: false, private: false, access: { has: function (obj) { return "logo" in obj; }, get: function (obj) { return obj.logo; }, set: function (obj, value) { obj.logo = value; } }, metadata: _metadata }, _logo_initializers, _logo_extraInitializers);
        __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: function (obj) { return "website" in obj; }, get: function (obj) { return obj.website; }, set: function (obj, value) { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _industry_decorators, { kind: "field", name: "industry", static: false, private: false, access: { has: function (obj) { return "industry" in obj; }, get: function (obj) { return obj.industry; }, set: function (obj, value) { obj.industry = value; } }, metadata: _metadata }, _industry_initializers, _industry_extraInitializers);
        __esDecorate(null, null, _employeeCount_decorators, { kind: "field", name: "employeeCount", static: false, private: false, access: { has: function (obj) { return "employeeCount" in obj; }, get: function (obj) { return obj.employeeCount; }, set: function (obj, value) { obj.employeeCount = value; } }, metadata: _metadata }, _employeeCount_initializers, _employeeCount_extraInitializers);
        __esDecorate(null, null, _contactPersonName_decorators, { kind: "field", name: "contactPersonName", static: false, private: false, access: { has: function (obj) { return "contactPersonName" in obj; }, get: function (obj) { return obj.contactPersonName; }, set: function (obj, value) { obj.contactPersonName = value; } }, metadata: _metadata }, _contactPersonName_initializers, _contactPersonName_extraInitializers);
        __esDecorate(null, null, _contactPersonPosition_decorators, { kind: "field", name: "contactPersonPosition", static: false, private: false, access: { has: function (obj) { return "contactPersonPosition" in obj; }, get: function (obj) { return obj.contactPersonPosition; }, set: function (obj, value) { obj.contactPersonPosition = value; } }, metadata: _metadata }, _contactPersonPosition_initializers, _contactPersonPosition_extraInitializers);
        __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
        __esDecorate(null, null, _users_decorators, { kind: "field", name: "users", static: false, private: false, access: { has: function (obj) { return "users" in obj; }, get: function (obj) { return obj.users; }, set: function (obj, value) { obj.users = value; } }, metadata: _metadata }, _users_initializers, _users_extraInitializers);
        __esDecorate(null, null, _questionnaires_decorators, { kind: "field", name: "questionnaires", static: false, private: false, access: { has: function (obj) { return "questionnaires" in obj; }, get: function (obj) { return obj.questionnaires; }, set: function (obj, value) { obj.questionnaires = value; } }, metadata: _metadata }, _questionnaires_initializers, _questionnaires_extraInitializers);
        __esDecorate(null, null, _responses_decorators, { kind: "field", name: "responses", static: false, private: false, access: { has: function (obj) { return "responses" in obj; }, get: function (obj) { return obj.responses; }, set: function (obj, value) { obj.responses = value; } }, metadata: _metadata }, _responses_initializers, _responses_extraInitializers);
        __esDecorate(null, null, _expenses_decorators, { kind: "field", name: "expenses", static: false, private: false, access: { has: function (obj) { return "expenses" in obj; }, get: function (obj) { return obj.expenses; }, set: function (obj, value) { obj.expenses = value; } }, metadata: _metadata }, _expenses_initializers, _expenses_extraInitializers);
        __esDecorate(null, null, _reports_decorators, { kind: "field", name: "reports", static: false, private: false, access: { has: function (obj) { return "reports" in obj; }, get: function (obj) { return obj.reports; }, set: function (obj, value) { obj.reports = value; } }, metadata: _metadata }, _reports_initializers, _reports_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Organization = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Organization = _classThis;
}();
exports.Organization = Organization;
