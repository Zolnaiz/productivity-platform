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
exports.ReportFilterDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var expense_entity_1 = require("../../expenses/entities/expense.entity");
var ReportFilterDto = function () {
    var _a;
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _startDate_decorators;
    var _startDate_initializers = [];
    var _startDate_extraInitializers = [];
    var _endDate_decorators;
    var _endDate_initializers = [];
    var _endDate_extraInitializers = [];
    var _category_decorators;
    var _category_initializers = [];
    var _category_extraInitializers = [];
    var _reportType_decorators;
    var _reportType_initializers = [];
    var _reportType_extraInitializers = [];
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _limit_decorators;
    var _limit_initializers = [];
    var _limit_extraInitializers = [];
    var _sortBy_decorators;
    var _sortBy_initializers = [];
    var _sortBy_extraInitializers = [];
    var _sortOrder_decorators;
    var _sortOrder_initializers = [];
    var _sortOrder_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ReportFilterDto() {
                this.organizationId = __runInitializers(this, _organizationId_initializers, void 0);
                this.startDate = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.category = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                this.reportType = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _reportType_initializers, void 0));
                this.page = (__runInitializers(this, _reportType_extraInitializers), __runInitializers(this, _page_initializers, 1));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, 10));
                this.sortBy = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _sortBy_initializers, 'createdAt'));
                this.sortOrder = (__runInitializers(this, _sortBy_extraInitializers), __runInitializers(this, _sortOrder_initializers, 'DESC'));
                __runInitializers(this, _sortOrder_extraInitializers);
            }
            return ReportFilterDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Байгууллагын ID',
                    example: '123e4567-e89b-12d3-a456-426614174000',
                    required: false,
                }), (0, class_validator_1.IsUUID)(), (0, class_validator_1.IsOptional)()];
            _startDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Эхлэх огноо (YYYY-MM-DD)',
                    example: '2024-01-01',
                    required: false,
                }), (0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _endDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Дуусах огноо (YYYY-MM-DD)',
                    example: '2024-01-31',
                    required: false,
                }), (0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _category_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Зардлын төрөл',
                    enum: expense_entity_1.ExpenseCategory,
                    required: false,
                }), (0, class_validator_1.IsEnum)(expense_entity_1.ExpenseCategory), (0, class_validator_1.IsOptional)()];
            _reportType_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн төрөл',
                    example: 'questionnaire',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            _page_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хуудасны дугаар',
                    example: 1,
                    required: false,
                    default: 1,
                }), (0, class_validator_1.IsOptional)()];
            _limit_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Хуудасны хэмжээ',
                    example: 10,
                    required: false,
                    default: 10,
                }), (0, class_validator_1.IsOptional)()];
            _sortBy_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Эрэмбэлэх талбар',
                    example: 'createdAt',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            _sortOrder_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Эрэмбэлэх чиглэл',
                    example: 'DESC',
                    enum: ['ASC', 'DESC'],
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: function (obj) { return "category" in obj; }, get: function (obj) { return obj.category; }, set: function (obj, value) { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            __esDecorate(null, null, _reportType_decorators, { kind: "field", name: "reportType", static: false, private: false, access: { has: function (obj) { return "reportType" in obj; }, get: function (obj) { return obj.reportType; }, set: function (obj, value) { obj.reportType = value; } }, metadata: _metadata }, _reportType_initializers, _reportType_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _sortBy_decorators, { kind: "field", name: "sortBy", static: false, private: false, access: { has: function (obj) { return "sortBy" in obj; }, get: function (obj) { return obj.sortBy; }, set: function (obj, value) { obj.sortBy = value; } }, metadata: _metadata }, _sortBy_initializers, _sortBy_extraInitializers);
            __esDecorate(null, null, _sortOrder_decorators, { kind: "field", name: "sortOrder", static: false, private: false, access: { has: function (obj) { return "sortOrder" in obj; }, get: function (obj) { return obj.sortOrder; }, set: function (obj, value) { obj.sortOrder = value; } }, metadata: _metadata }, _sortOrder_initializers, _sortOrder_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ReportFilterDto = ReportFilterDto;
