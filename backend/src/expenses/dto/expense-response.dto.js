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
exports.ExpenseSummaryDto = exports.ExpenseListResponseDto = exports.ExpenseResponseDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var expense_entity_1 = require("../../shared/entities/expense.entity");
var ExpenseResponseDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
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
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _questionnaire_decorators;
    var _questionnaire_initializers = [];
    var _questionnaire_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _creator_decorators;
    var _creator_initializers = [];
    var _creator_extraInitializers = [];
    var _approver_decorators;
    var _approver_initializers = [];
    var _approver_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ExpenseResponseDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.amount = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _amount_initializers, void 0));
                this.category = (__runInitializers(this, _amount_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                this.status = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.expenseDate = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _expenseDate_initializers, void 0));
                this.paidDate = (__runInitializers(this, _expenseDate_extraInitializers), __runInitializers(this, _paidDate_initializers, void 0));
                this.recipientName = (__runInitializers(this, _paidDate_extraInitializers), __runInitializers(this, _recipientName_initializers, void 0));
                this.recipientAccount = (__runInitializers(this, _recipientName_extraInitializers), __runInitializers(this, _recipientAccount_initializers, void 0));
                this.invoiceNumber = (__runInitializers(this, _recipientAccount_extraInitializers), __runInitializers(this, _invoiceNumber_initializers, void 0));
                this.attachments = (__runInitializers(this, _invoiceNumber_extraInitializers), __runInitializers(this, _attachments_initializers, void 0));
                this.questionnaireId = (__runInitializers(this, _attachments_extraInitializers), __runInitializers(this, _questionnaireId_initializers, void 0));
                this.organizationId = (__runInitializers(this, _questionnaireId_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                this.createdBy = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
                this.approvedBy = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _approvedBy_initializers, void 0));
                this.createdAt = (__runInitializers(this, _approvedBy_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                this.questionnaire = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _questionnaire_initializers, void 0));
                this.organization = (__runInitializers(this, _questionnaire_extraInitializers), __runInitializers(this, _organization_initializers, void 0));
                this.creator = (__runInitializers(this, _organization_extraInitializers), __runInitializers(this, _creator_initializers, void 0));
                this.approver = (__runInitializers(this, _creator_extraInitializers), __runInitializers(this, _approver_initializers, void 0));
                __runInitializers(this, _approver_extraInitializers);
            }
            return ExpenseResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын ID',
                    example: '123e4567-e89b-12d3-a456-426614174000',
                }), (0, class_transformer_1.Expose)()];
            _name_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын нэр',
                    example: 'Цахилгаан төлбөр',
                }), (0, class_transformer_1.Expose)()];
            _description_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын дэлгэрэнгүй мэдээлэл',
                    example: '2024 оны 1-р сарын цахилгаан төлбөр',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _amount_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын дүн',
                    example: 150000,
                    minimum: 0,
                }), (0, class_transformer_1.Expose)()];
            _category_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын төрөл',
                    enum: expense_entity_1.ExpenseCategory,
                    example: expense_entity_1.ExpenseCategory.UTILITY,
                }), (0, class_transformer_1.Expose)()];
            _status_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын төлөв',
                    enum: expense_entity_1.ExpenseStatus,
                    example: expense_entity_1.ExpenseStatus.PAID,
                    default: expense_entity_1.ExpenseStatus.PENDING,
                }), (0, class_transformer_1.Expose)()];
            _expenseDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын огноо',
                    example: '2024-01-15',
                }), (0, class_transformer_1.Expose)(), (0, class_transformer_1.Transform)(function (_b) {
                    var value = _b.value;
                    return value.toISOString().split('T')[0];
                })];
            _paidDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлыг төлсөн огноо',
                    example: '2024-01-20',
                    required: false,
                }), (0, class_transformer_1.Expose)(), (0, class_transformer_1.Transform)(function (_b) {
                    var value = _b.value;
                    return value ? value.toISOString().split('T')[0] : null;
                })];
            _recipientName_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хүлээн авагчийн нэр',
                    example: 'Дархан цахилгаан түгээх',
                }), (0, class_transformer_1.Expose)()];
            _recipientAccount_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хүлээн авагчийн дансны дугаар',
                    example: '5000123456789',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _invoiceNumber_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын нэхэмжлэх/баримтын дугаар',
                    example: 'INV-2024-001',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _attachments_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын файл хавсралтууд',
                    example: ['invoice.pdf', 'receipt.jpg'],
                    required: false,
                    type: [String],
                }), (0, class_transformer_1.Expose)()];
            _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Холбогдох асуулгын ID',
                    example: '123e4567-e89b-12d3-a456-426614174001',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хамааралтай байгууллагын ID',
                    example: '123e4567-e89b-12d3-a456-426614174002',
                }), (0, class_transformer_1.Expose)()];
            _createdBy_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлыг үүсгэсэн хэрэглэгчийн ID',
                    example: '123e4567-e89b-12d3-a456-426614174003',
                }), (0, class_transformer_1.Expose)()];
            _approvedBy_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлыг баталгаажуулсан хэрэглэгчийн ID',
                    example: '123e4567-e89b-12d3-a456-426614174004',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _createdAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Үүсгэсэн огноо',
                    example: '2024-01-15T10:30:00.000Z',
                }), (0, class_transformer_1.Expose)()];
            _updatedAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Сүүлд шинэчлэгдсэн огноо',
                    example: '2024-01-20T14:45:00.000Z',
                }), (0, class_transformer_1.Expose)()];
            _questionnaire_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Холбогдох асуулгын мэдээлэл',
                    type: Object,
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _organization_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хамааралтай байгууллагын мэдээлэл',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _creator_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Үүсгэсэн хэрэглэгчийн мэдээлэл',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _approver_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Баталгаажуулсан хэрэглэгчийн мэдээлэл',
                    type: Object,
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
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
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            __esDecorate(null, null, _questionnaire_decorators, { kind: "field", name: "questionnaire", static: false, private: false, access: { has: function (obj) { return "questionnaire" in obj; }, get: function (obj) { return obj.questionnaire; }, set: function (obj, value) { obj.questionnaire = value; } }, metadata: _metadata }, _questionnaire_initializers, _questionnaire_extraInitializers);
            __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
            __esDecorate(null, null, _creator_decorators, { kind: "field", name: "creator", static: false, private: false, access: { has: function (obj) { return "creator" in obj; }, get: function (obj) { return obj.creator; }, set: function (obj, value) { obj.creator = value; } }, metadata: _metadata }, _creator_initializers, _creator_extraInitializers);
            __esDecorate(null, null, _approver_decorators, { kind: "field", name: "approver", static: false, private: false, access: { has: function (obj) { return "approver" in obj; }, get: function (obj) { return obj.approver; }, set: function (obj, value) { obj.approver = value; } }, metadata: _metadata }, _approver_initializers, _approver_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ExpenseResponseDto = ExpenseResponseDto;
var ExpenseListResponseDto = function () {
    var _a;
    var _expenses_decorators;
    var _expenses_initializers = [];
    var _expenses_extraInitializers = [];
    var _total_decorators;
    var _total_initializers = [];
    var _total_extraInitializers = [];
    var _totalAmount_decorators;
    var _totalAmount_initializers = [];
    var _totalAmount_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    var _totalPages_decorators;
    var _totalPages_initializers = [];
    var _totalPages_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ExpenseListResponseDto() {
                this.expenses = __runInitializers(this, _expenses_initializers, void 0);
                this.total = (__runInitializers(this, _expenses_extraInitializers), __runInitializers(this, _total_initializers, void 0));
                this.totalAmount = (__runInitializers(this, _total_extraInitializers), __runInitializers(this, _totalAmount_initializers, void 0));
                this.page = (__runInitializers(this, _totalAmount_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                this.totalPages = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _totalPages_initializers, void 0));
                __runInitializers(this, _totalPages_extraInitializers);
            }
            return ExpenseListResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _expenses_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын жагсаалт',
                    type: [ExpenseResponseDto],
                }), (0, class_transformer_1.Expose)()];
            _total_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт зардлын тоо',
                    example: 150,
                }), (0, class_transformer_1.Expose)()];
            _totalAmount_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт зардлын дүн',
                    example: 4500000,
                }), (0, class_transformer_1.Expose)()];
            _page_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Одоогийн хуудас',
                    example: 1,
                }), (0, class_transformer_1.Expose)()];
            _limit_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хуудасны хэмжээ',
                    example: 10,
                }), (0, class_transformer_1.Expose)()];
            _totalPages_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт хуудасны тоо',
                    example: 15,
                }), (0, class_transformer_1.Expose)()];
            __esDecorate(null, null, _expenses_decorators, { kind: "field", name: "expenses", static: false, private: false, access: { has: function (obj) { return "expenses" in obj; }, get: function (obj) { return obj.expenses; }, set: function (obj, value) { obj.expenses = value; } }, metadata: _metadata }, _expenses_initializers, _expenses_extraInitializers);
            __esDecorate(null, null, _total_decorators, { kind: "field", name: "total", static: false, private: false, access: { has: function (obj) { return "total" in obj; }, get: function (obj) { return obj.total; }, set: function (obj, value) { obj.total = value; } }, metadata: _metadata }, _total_initializers, _total_extraInitializers);
            __esDecorate(null, null, _totalAmount_decorators, { kind: "field", name: "totalAmount", static: false, private: false, access: { has: function (obj) { return "totalAmount" in obj; }, get: function (obj) { return obj.totalAmount; }, set: function (obj, value) { obj.totalAmount = value; } }, metadata: _metadata }, _totalAmount_initializers, _totalAmount_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _totalPages_decorators, { kind: "field", name: "totalPages", static: false, private: false, access: { has: function (obj) { return "totalPages" in obj; }, get: function (obj) { return obj.totalPages; }, set: function (obj, value) { obj.totalPages = value; } }, metadata: _metadata }, _totalPages_initializers, _totalPages_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ExpenseListResponseDto = ExpenseListResponseDto;
var ExpenseSummaryDto = function () {
    var _a;
    var _amountByCategory_decorators;
    var _amountByCategory_initializers = [];
    var _amountByCategory_extraInitializers = [];
    var _countByStatus_decorators;
    var _countByStatus_initializers = [];
    var _countByStatus_extraInitializers = [];
    var _amountByMonth_decorators;
    var _amountByMonth_initializers = [];
    var _amountByMonth_extraInitializers = [];
    var _totalAmount_decorators;
    var _totalAmount_initializers = [];
    var _totalAmount_extraInitializers = [];
    var _totalCount_decorators;
    var _totalCount_initializers = [];
    var _totalCount_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ExpenseSummaryDto() {
                this.amountByCategory = __runInitializers(this, _amountByCategory_initializers, void 0);
                this.countByStatus = (__runInitializers(this, _amountByCategory_extraInitializers), __runInitializers(this, _countByStatus_initializers, void 0));
                this.amountByMonth = (__runInitializers(this, _countByStatus_extraInitializers), __runInitializers(this, _amountByMonth_initializers, void 0));
                this.totalAmount = (__runInitializers(this, _amountByMonth_extraInitializers), __runInitializers(this, _totalAmount_initializers, void 0));
                this.totalCount = (__runInitializers(this, _totalAmount_extraInitializers), __runInitializers(this, _totalCount_initializers, void 0));
                __runInitializers(this, _totalCount_extraInitializers);
            }
            return ExpenseSummaryDto;
        }()),
        (function () {
            var _b, _c;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _amountByCategory_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Төрөл тус бүрийн нийт дүн',
                    type: Object,
                    example: (_b = {},
                        _b[expense_entity_1.ExpenseCategory.UTILITY] = 150000,
                        _b[expense_entity_1.ExpenseCategory.SALARY] = 3000000,
                        _b[expense_entity_1.ExpenseCategory.OFFICE_SUPPLIES] = 500000,
                        _b),
                }), (0, class_transformer_1.Expose)()];
            _countByStatus_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Төлөв тус бүрийн тоо',
                    type: Object,
                    example: (_c = {},
                        _c[expense_entity_1.ExpenseStatus.PENDING] = 5,
                        _c[expense_entity_1.ExpenseStatus.PAID] = 45,
                        _c[expense_entity_1.ExpenseStatus.REJECTED] = 2,
                        _c),
                }), (0, class_transformer_1.Expose)()];
            _amountByMonth_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Сар бүрийн нийт дүн',
                    type: Object,
                    example: {
                        '2024-01': 1500000,
                        '2024-02': 1800000,
                        '2024-03': 1200000,
                    },
                }), (0, class_transformer_1.Expose)()];
            _totalAmount_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт зардлын дүн',
                    example: 4500000,
                }), (0, class_transformer_1.Expose)()];
            _totalCount_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт зардлын тоо',
                    example: 52,
                }), (0, class_transformer_1.Expose)()];
            __esDecorate(null, null, _amountByCategory_decorators, { kind: "field", name: "amountByCategory", static: false, private: false, access: { has: function (obj) { return "amountByCategory" in obj; }, get: function (obj) { return obj.amountByCategory; }, set: function (obj, value) { obj.amountByCategory = value; } }, metadata: _metadata }, _amountByCategory_initializers, _amountByCategory_extraInitializers);
            __esDecorate(null, null, _countByStatus_decorators, { kind: "field", name: "countByStatus", static: false, private: false, access: { has: function (obj) { return "countByStatus" in obj; }, get: function (obj) { return obj.countByStatus; }, set: function (obj, value) { obj.countByStatus = value; } }, metadata: _metadata }, _countByStatus_initializers, _countByStatus_extraInitializers);
            __esDecorate(null, null, _amountByMonth_decorators, { kind: "field", name: "amountByMonth", static: false, private: false, access: { has: function (obj) { return "amountByMonth" in obj; }, get: function (obj) { return obj.amountByMonth; }, set: function (obj, value) { obj.amountByMonth = value; } }, metadata: _metadata }, _amountByMonth_initializers, _amountByMonth_extraInitializers);
            __esDecorate(null, null, _totalAmount_decorators, { kind: "field", name: "totalAmount", static: false, private: false, access: { has: function (obj) { return "totalAmount" in obj; }, get: function (obj) { return obj.totalAmount; }, set: function (obj, value) { obj.totalAmount = value; } }, metadata: _metadata }, _totalAmount_initializers, _totalAmount_extraInitializers);
            __esDecorate(null, null, _totalCount_decorators, { kind: "field", name: "totalCount", static: false, private: false, access: { has: function (obj) { return "totalCount" in obj; }, get: function (obj) { return obj.totalCount; }, set: function (obj, value) { obj.totalCount = value; } }, metadata: _metadata }, _totalCount_initializers, _totalCount_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ExpenseSummaryDto = ExpenseSummaryDto;
