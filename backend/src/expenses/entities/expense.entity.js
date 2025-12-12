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
exports.Expense = exports.ExpenseStatus = exports.ExpenseCategory = void 0;
var typeorm_1 = require("typeorm");
var swagger_1 = require("@nestjs/swagger");
var base_entity_1 = require("../../shared/entities/base.entity");
var user_entity_1 = require("../../shared/entities/user.entity");
var organization_entity_1 = require("../../shared/entities/organization.entity");
var questionnaire_entity_1 = require("../../shared/entities/questionnaire.entity");
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["SALARY"] = "salary";
    ExpenseCategory["UTILITY"] = "utility";
    ExpenseCategory["RENT"] = "rent";
    ExpenseCategory["OFFICE_SUPPLIES"] = "office_supplies";
    ExpenseCategory["MARKETING"] = "marketing";
    ExpenseCategory["TRAVEL"] = "travel";
    ExpenseCategory["EQUIPMENT"] = "equipment";
    ExpenseCategory["SOFTWARE"] = "software";
    ExpenseCategory["TRAINING"] = "training";
    ExpenseCategory["OTHER"] = "other";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
var ExpenseStatus;
(function (ExpenseStatus) {
    ExpenseStatus["PENDING"] = "pending";
    ExpenseStatus["APPROVED"] = "approved";
    ExpenseStatus["PAID"] = "paid";
    ExpenseStatus["REJECTED"] = "rejected";
    ExpenseStatus["CANCELLED"] = "cancelled";
})(ExpenseStatus || (exports.ExpenseStatus = ExpenseStatus = {}));
var Expense = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('expenses'), (0, typeorm_1.Index)(['organizationId', 'expenseDate']), (0, typeorm_1.Index)(['status', 'expenseDate']), (0, typeorm_1.Index)(['category', 'organizationId'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _amount_decorators;
    var _amount_initializers = [];
    var _amount_extraInitializers = [];
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _expenseDate_decorators;
    var _expenseDate_initializers = [];
    var _expenseDate_extraInitializers = [];
    var _paidDate_decorators;
    var _paidDate_initializers = [];
    var _paidDate_extraInitializers = [];
    var _recipientName_decorators;
    var _recipientName_initializers = [];
    var _recipientName_extraInitializers = [];
    var _recipientAccount_decorators;
    var _recipientAccount_initializers = [];
    var _recipientAccount_extraInitializers = [];
    var _invoiceNumber_decorators;
    var _invoiceNumber_initializers = [];
    var _invoiceNumber_extraInitializers = [];
    var _attachments_decorators;
    var _attachments_initializers = [];
    var _attachments_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _createdBy_decorators;
    var _createdBy_initializers = [];
    var _createdBy_extraInitializers = [];
    var _approvedBy_decorators;
    var _approvedBy_initializers = [];
    var _approvedBy_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _creator_decorators;
    var _creator_initializers = [];
    var _creator_extraInitializers = [];
    var _approver_decorators;
    var _approver_initializers = [];
    var _approver_extraInitializers = [];
    var _questionnaire_decorators;
    var _questionnaire_initializers = [];
    var _questionnaire_extraInitializers = [];
    var Expense = _classThis = /** @class */ (function (_super) {
        __extends(Expense_1, _super);
        function Expense_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.name = __runInitializers(_this, _name_initializers, void 0);
            _this.description = (__runInitializers(_this, _name_extraInitializers), __runInitializers(_this, _description_initializers, void 0));
            _this.amount = (__runInitializers(_this, _description_extraInitializers), __runInitializers(_this, _amount_initializers, void 0));
            _this.category = (__runInitializers(_this, _amount_extraInitializers), __runInitializers(_this, _category_initializers, void 0));
            _this.status = (__runInitializers(_this, _category_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.expenseDate = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _expenseDate_initializers, void 0));
            _this.paidDate = (__runInitializers(_this, _expenseDate_extraInitializers), __runInitializers(_this, _paidDate_initializers, void 0));
            _this.recipientName = (__runInitializers(_this, _paidDate_extraInitializers), __runInitializers(_this, _recipientName_initializers, void 0));
            _this.recipientAccount = (__runInitializers(_this, _recipientName_extraInitializers), __runInitializers(_this, _recipientAccount_initializers, void 0));
            _this.invoiceNumber = (__runInitializers(_this, _recipientAccount_extraInitializers), __runInitializers(_this, _invoiceNumber_initializers, void 0));
            _this.attachments = (__runInitializers(_this, _invoiceNumber_extraInitializers), __runInitializers(_this, _attachments_initializers, void 0));
            _this.questionnaireId = (__runInitializers(_this, _attachments_extraInitializers), __runInitializers(_this, _questionnaireId_initializers, void 0));
            _this.organizationId = (__runInitializers(_this, _questionnaireId_extraInitializers), __runInitializers(_this, _organizationId_initializers, void 0));
            _this.createdBy = (__runInitializers(_this, _organizationId_extraInitializers), __runInitializers(_this, _createdBy_initializers, void 0));
            _this.approvedBy = (__runInitializers(_this, _createdBy_extraInitializers), __runInitializers(_this, _approvedBy_initializers, void 0));
            // Relationships
            _this.organization = (__runInitializers(_this, _approvedBy_extraInitializers), __runInitializers(_this, _organization_initializers, void 0));
            _this.creator = (__runInitializers(_this, _organization_extraInitializers), __runInitializers(_this, _creator_initializers, void 0));
            _this.approver = (__runInitializers(_this, _creator_extraInitializers), __runInitializers(_this, _approver_initializers, void 0));
            _this.questionnaire = (__runInitializers(_this, _approver_extraInitializers), __runInitializers(_this, _questionnaire_initializers, void 0));
            __runInitializers(_this, _questionnaire_extraInitializers);
            return _this;
        }
        return Expense_1;
    }(_classSuper));
    __setFunctionName(_classThis, "Expense");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _name_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын нэр' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын дэлгэрэнгүй мэдээлэл', nullable: true }), (0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _amount_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын дүн' }), (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 })];
        _category_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын төрөл', enum: ExpenseCategory }), (0, typeorm_1.Column)({ type: 'enum', enum: ExpenseCategory })];
        _status_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын төлөв', enum: ExpenseStatus, default: ExpenseStatus.PENDING }), (0, typeorm_1.Column)({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })];
        _expenseDate_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын огноо' }), (0, typeorm_1.Column)({ type: 'date' })];
        _paidDate_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлыг төлсөн огноо', nullable: true }), (0, typeorm_1.Column)({ type: 'date', nullable: true })];
        _recipientName_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хүлээн авагчийн нэр' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _recipientAccount_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хүлээн авагчийн дансны дугаар', nullable: true }), (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _invoiceNumber_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын нэхэмжлэх/баримтын дугаар', nullable: true }), (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _attachments_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлын файл хавсралтууд', type: 'json', nullable: true }), (0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Холбогдох асуулгын ID', nullable: true }), (0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _organizationId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хамааралтай байгууллагын ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _createdBy_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлыг үүсгэсэн хэрэглэгчийн ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _approvedBy_decorators = [(0, swagger_1.ApiProperty)({ description: 'Зардлыг баталгаажуулсан хэрэглэгчийн ID', nullable: true }), (0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.expenses; }), (0, typeorm_1.JoinColumn)({ name: 'organizationId' })];
        _creator_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.createdExpenses; }), (0, typeorm_1.JoinColumn)({ name: 'createdBy' })];
        _approver_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.approvedExpenses; }, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'approvedBy' })];
        _questionnaire_decorators = [(0, typeorm_1.ManyToOne)(function () { return questionnaire_entity_1.Questionnaire; }, function (questionnaire) { return questionnaire.expenses; }, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'questionnaireId' })];
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: function (obj) { return "amount" in obj; }, get: function (obj) { return obj.amount; }, set: function (obj, value) { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _expenseDate_decorators, { kind: "field", name: "expenseDate", static: false, private: false, access: { has: function (obj) { return "expenseDate" in obj; }, get: function (obj) { return obj.expenseDate; }, set: function (obj, value) { obj.expenseDate = value; } }, metadata: _metadata }, _expenseDate_initializers, _expenseDate_extraInitializers);
        __esDecorate(null, null, _paidDate_decorators, { kind: "field", name: "paidDate", static: false, private: false, access: { has: function (obj) { return "paidDate" in obj; }, get: function (obj) { return obj.paidDate; }, set: function (obj, value) { obj.paidDate = value; } }, metadata: _metadata }, _paidDate_initializers, _paidDate_extraInitializers);
        __esDecorate(null, null, _recipientName_decorators, { kind: "field", name: "recipientName", static: false, private: false, access: { has: function (obj) { return "recipientName" in obj; }, get: function (obj) { return obj.recipientName; }, set: function (obj, value) { obj.recipientName = value; } }, metadata: _metadata }, _recipientName_initializers, _recipientName_extraInitializers);
        __esDecorate(null, null, _recipientAccount_decorators, { kind: "field", name: "recipientAccount", static: false, private: false, access: { has: function (obj) { return "recipientAccount" in obj; }, get: function (obj) { return obj.recipientAccount; }, set: function (obj, value) { obj.recipientAccount = value; } }, metadata: _metadata }, _recipientAccount_initializers, _recipientAccount_extraInitializers);
        __esDecorate(null, null, _invoiceNumber_decorators, { kind: "field", name: "invoiceNumber", static: false, private: false, access: { has: function (obj) { return "invoiceNumber" in obj; }, get: function (obj) { return obj.invoiceNumber; }, set: function (obj, value) { obj.invoiceNumber = value; } }, metadata: _metadata }, _invoiceNumber_initializers, _invoiceNumber_extraInitializers);
        __esDecorate(null, null, _attachments_decorators, { kind: "field", name: "attachments", static: false, private: false, access: { has: function (obj) { return "attachments" in obj; }, get: function (obj) { return obj.attachments; }, set: function (obj, value) { obj.attachments = value; } }, metadata: _metadata }, _attachments_initializers, _attachments_extraInitializers);
        __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: function (obj) { return "createdBy" in obj; }, get: function (obj) { return obj.createdBy; }, set: function (obj, value) { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _approvedBy_decorators, { kind: "field", name: "approvedBy", static: false, private: false, access: { has: function (obj) { return "approvedBy" in obj; }, get: function (obj) { return obj.approvedBy; }, set: function (obj, value) { obj.approvedBy = value; } }, metadata: _metadata }, _approvedBy_initializers, _approvedBy_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _creator_decorators, { kind: "field", name: "creator", static: false, private: false, access: { has: function (obj) { return "creator" in obj; }, get: function (obj) { return obj.creator; }, set: function (obj, value) { obj.creator = value; } }, metadata: _metadata }, _creator_initializers, _creator_extraInitializers);
        __esDecorate(null, null, _approver_decorators, { kind: "field", name: "approver", static: false, private: false, access: { has: function (obj) { return "approver" in obj; }, get: function (obj) { return obj.approver; }, set: function (obj, value) { obj.approver = value; } }, metadata: _metadata }, _approver_initializers, _approver_extraInitializers);
        __esDecorate(null, null, _questionnaire_decorators, { kind: "field", name: "questionnaire", static: false, private: false, access: { has: function (obj) { return "questionnaire" in obj; }, get: function (obj) { return obj.questionnaire; }, set: function (obj, value) { obj.questionnaire = value; } }, metadata: _metadata }, _questionnaire_initializers, _questionnaire_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Expense = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Expense = _classThis;
}();
exports.Expense = Expense;
