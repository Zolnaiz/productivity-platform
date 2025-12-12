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
exports.UpdateExpenseDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var expense_entity_1 = require("../entities/expense.entity");
var UpdateExpenseDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _amount_decorators;
    var _amount_initializers = [];
    var _amount_extraInitializers = [];
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _date_decorators;
    var _date_initializers = [];
    var _date_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _metadata_decorators;
    var _metadata_initializers = [];
    var _metadata_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateExpenseDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.amount = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _amount_initializers, void 0));
                this.category = (__runInitializers(this, _amount_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                this.date = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _date_initializers, void 0));
                this.organizationId = (__runInitializers(this, _date_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                this.metadata = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                __runInitializers(this, _metadata_extraInitializers);
            }
            return UpdateExpenseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Business Trip - Tokyo',
                    description: 'Expense title',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3), (0, class_validator_1.MaxLength)(200)];
            _description_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Flight and accommodation for client meeting',
                    description: 'Expense description',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(1000)];
            _amount_decorators = [(0, swagger_1.ApiProperty)({
                    example: 1250.50,
                    description: 'Expense amount',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0.01)];
            _category_decorators = [(0, swagger_1.ApiProperty)({
                    enum: expense_entity_1.ExpenseCategory,
                    example: expense_entity_1.ExpenseCategory.TRAVEL,
                    description: 'Expense category',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(expense_entity_1.ExpenseCategory)];
            _date_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-01-15',
                    description: 'Expense date',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'org_123',
                    description: 'Organization ID',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _metadata_decorators = [(0, swagger_1.ApiProperty)({
                    example: { projectId: 'proj_123', clientId: 'client_456' },
                    description: 'Expense metadata',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: function (obj) { return "amount" in obj; }, get: function (obj) { return obj.amount; }, set: function (obj, value) { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: function (obj) { return "date" in obj; }, get: function (obj) { return obj.date; }, set: function (obj, value) { obj.date = value; } }, metadata: _metadata }, _date_initializers, _date_extraInitializers);
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: function (obj) { return "metadata" in obj; }, get: function (obj) { return obj.metadata; }, set: function (obj, value) { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateExpenseDto = UpdateExpenseDto;
