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
exports.DashboardSummaryDto = exports.QuickReportResponseDto = exports.ReportListResponseDto = exports.ReportResponseDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_transformer_1 = require("class-transformer");
var report_entity_1 = require("../../shared/entities/report.entity");
var ReportResponseDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _data_decorators;
    var _data_initializers = [];
    var _data_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _generatedById_decorators;
    var _generatedById_initializers = [];
    var _generatedById_extraInitializers = [];
    var _parameters_decorators;
    var _parameters_initializers = [];
    var _parameters_extraInitializers = [];
    var _exportedAt_decorators;
    var _exportedAt_initializers = [];
    var _exportedAt_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _generatedBy_decorators;
    var _generatedBy_initializers = [];
    var _generatedBy_extraInitializers = [];
    var _questionnaire_decorators;
    var _questionnaire_initializers = [];
    var _questionnaire_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ReportResponseDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.type = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.title = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.data = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _data_initializers, void 0));
                this.status = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.organizationId = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                this.questionnaireId = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _questionnaireId_initializers, void 0));
                this.generatedById = (__runInitializers(this, _questionnaireId_extraInitializers), __runInitializers(this, _generatedById_initializers, void 0));
                this.parameters = (__runInitializers(this, _generatedById_extraInitializers), __runInitializers(this, _parameters_initializers, void 0));
                this.exportedAt = (__runInitializers(this, _parameters_extraInitializers), __runInitializers(this, _exportedAt_initializers, void 0));
                this.createdAt = (__runInitializers(this, _exportedAt_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                this.organization = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _organization_initializers, void 0));
                this.generatedBy = (__runInitializers(this, _organization_extraInitializers), __runInitializers(this, _generatedBy_initializers, void 0));
                this.questionnaire = (__runInitializers(this, _generatedBy_extraInitializers), __runInitializers(this, _questionnaire_initializers, void 0));
                __runInitializers(this, _questionnaire_extraInitializers);
            }
            return ReportResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн ID',
                    example: '123e4567-e89b-12d3-a456-426614174000',
                }), (0, class_transformer_1.Expose)()];
            _type_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн төрөл',
                    enum: report_entity_1.ReportType,
                    example: report_entity_1.ReportType.QUESTIONNAIRE,
                }), (0, class_transformer_1.Expose)()];
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн гарчиг',
                    example: '2024 оны 1-р сарын асуулгын тайлан',
                }), (0, class_transformer_1.Expose)()];
            _description_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн тайлбар',
                    example: 'Нийт 150 хэрэглэгчийн хариултын дүн шинжилгээ',
                }), (0, class_transformer_1.Expose)()];
            _data_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн өгөгдөл (JSON)',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _status_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн статус',
                    enum: report_entity_1.ReportStatus,
                    example: report_entity_1.ReportStatus.COMPLETED,
                }), (0, class_transformer_1.Expose)()];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Байгууллагын ID',
                    example: '123e4567-e89b-12d3-a456-426614174001',
                }), (0, class_transformer_1.Expose)()];
            _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Холбогдох асуулгын ID',
                    example: '123e4567-e89b-12d3-a456-426614174002',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _generatedById_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлан үүсгэсэн хэрэглэгчийн ID',
                    example: '123e4567-e89b-12d3-a456-426614174003',
                }), (0, class_transformer_1.Expose)()];
            _parameters_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн параметрүүд',
                    type: Object,
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _exportedAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайланг экспортолсон огноо',
                    example: '2024-01-31T10:30:00.000Z',
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            _createdAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Үүсгэсэн огноо',
                    example: '2024-01-31T10:00:00.000Z',
                }), (0, class_transformer_1.Expose)()];
            _updatedAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Сүүлд шинэчлэгдсэн огноо',
                    example: '2024-01-31T10:30:00.000Z',
                }), (0, class_transformer_1.Expose)()];
            _organization_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Байгууллагын мэдээлэл',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _generatedBy_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлан үүсгэсэн хэрэглэгчийн мэдээлэл',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _questionnaire_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Холбогдох асуулгын мэдээлэл',
                    type: Object,
                    required: false,
                }), (0, class_transformer_1.Expose)()];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: function (obj) { return "data" in obj; }, get: function (obj) { return obj.data; }, set: function (obj, value) { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
            __esDecorate(null, null, _generatedById_decorators, { kind: "field", name: "generatedById", static: false, private: false, access: { has: function (obj) { return "generatedById" in obj; }, get: function (obj) { return obj.generatedById; }, set: function (obj, value) { obj.generatedById = value; } }, metadata: _metadata }, _generatedById_initializers, _generatedById_extraInitializers);
            __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: function (obj) { return "parameters" in obj; }, get: function (obj) { return obj.parameters; }, set: function (obj, value) { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
            __esDecorate(null, null, _exportedAt_decorators, { kind: "field", name: "exportedAt", static: false, private: false, access: { has: function (obj) { return "exportedAt" in obj; }, get: function (obj) { return obj.exportedAt; }, set: function (obj, value) { obj.exportedAt = value; } }, metadata: _metadata }, _exportedAt_initializers, _exportedAt_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
            __esDecorate(null, null, _generatedBy_decorators, { kind: "field", name: "generatedBy", static: false, private: false, access: { has: function (obj) { return "generatedBy" in obj; }, get: function (obj) { return obj.generatedBy; }, set: function (obj, value) { obj.generatedBy = value; } }, metadata: _metadata }, _generatedBy_initializers, _generatedBy_extraInitializers);
            __esDecorate(null, null, _questionnaire_decorators, { kind: "field", name: "questionnaire", static: false, private: false, access: { has: function (obj) { return "questionnaire" in obj; }, get: function (obj) { return obj.questionnaire; }, set: function (obj, value) { obj.questionnaire = value; } }, metadata: _metadata }, _questionnaire_initializers, _questionnaire_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ReportResponseDto = ReportResponseDto;
var ReportListResponseDto = function () {
    var _a;
    var _reports_decorators;
    var _reports_initializers = [];
    var _reports_extraInitializers = [];
    var _total_decorators;
    var _total_initializers = [];
    var _total_extraInitializers = [];
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
            function ReportListResponseDto() {
                this.reports = __runInitializers(this, _reports_initializers, void 0);
                this.total = (__runInitializers(this, _reports_extraInitializers), __runInitializers(this, _total_initializers, void 0));
                this.page = (__runInitializers(this, _total_extraInitializers), __runInitializers(this, _page_initializers, void 0));
                this.limit = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _limit_initializers, void 0));
                this.totalPages = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _totalPages_initializers, void 0));
                __runInitializers(this, _totalPages_extraInitializers);
            }
            return ReportListResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _reports_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн жагсаалт',
                    type: [ReportResponseDto],
                }), (0, class_transformer_1.Expose)()];
            _total_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт тайлангийн тоо',
                    example: 150,
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
            __esDecorate(null, null, _reports_decorators, { kind: "field", name: "reports", static: false, private: false, access: { has: function (obj) { return "reports" in obj; }, get: function (obj) { return obj.reports; }, set: function (obj, value) { obj.reports = value; } }, metadata: _metadata }, _reports_initializers, _reports_extraInitializers);
            __esDecorate(null, null, _total_decorators, { kind: "field", name: "total", static: false, private: false, access: { has: function (obj) { return "total" in obj; }, get: function (obj) { return obj.total; }, set: function (obj, value) { obj.total = value; } }, metadata: _metadata }, _total_initializers, _total_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: function (obj) { return "limit" in obj; }, get: function (obj) { return obj.limit; }, set: function (obj, value) { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _totalPages_decorators, { kind: "field", name: "totalPages", static: false, private: false, access: { has: function (obj) { return "totalPages" in obj; }, get: function (obj) { return obj.totalPages; }, set: function (obj, value) { obj.totalPages = value; } }, metadata: _metadata }, _totalPages_initializers, _totalPages_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ReportListResponseDto = ReportListResponseDto;
var QuickReportResponseDto = function () {
    var _a;
    var _data_decorators;
    var _data_initializers = [];
    var _data_extraInitializers = [];
    var _generatedAt_decorators;
    var _generatedAt_initializers = [];
    var _generatedAt_extraInitializers = [];
    var _parameters_decorators;
    var _parameters_initializers = [];
    var _parameters_extraInitializers = [];
    return _a = /** @class */ (function () {
            function QuickReportResponseDto() {
                this.data = __runInitializers(this, _data_initializers, void 0);
                this.generatedAt = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _generatedAt_initializers, void 0));
                this.parameters = (__runInitializers(this, _generatedAt_extraInitializers), __runInitializers(this, _parameters_initializers, void 0));
                __runInitializers(this, _parameters_extraInitializers);
            }
            return QuickReportResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _data_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Түргэн тайлангийн мэдээлэл',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _generatedAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлан үүсгэсэн огноо',
                    example: '2024-01-31T10:30:00.000Z',
                }), (0, class_transformer_1.Expose)()];
            _parameters_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн параметрүүд',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: function (obj) { return "data" in obj; }, get: function (obj) { return obj.data; }, set: function (obj, value) { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _generatedAt_decorators, { kind: "field", name: "generatedAt", static: false, private: false, access: { has: function (obj) { return "generatedAt" in obj; }, get: function (obj) { return obj.generatedAt; }, set: function (obj, value) { obj.generatedAt = value; } }, metadata: _metadata }, _generatedAt_initializers, _generatedAt_extraInitializers);
            __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: function (obj) { return "parameters" in obj; }, get: function (obj) { return obj.parameters; }, set: function (obj, value) { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.QuickReportResponseDto = QuickReportResponseDto;
var DashboardSummaryDto = function () {
    var _a;
    var _totals_decorators;
    var _totals_initializers = [];
    var _totals_extraInitializers = [];
    var _recentActivity_decorators;
    var _recentActivity_initializers = [];
    var _recentActivity_extraInitializers = [];
    var _charts_decorators;
    var _charts_initializers = [];
    var _charts_extraInitializers = [];
    return _a = /** @class */ (function () {
            function DashboardSummaryDto() {
                this.totals = __runInitializers(this, _totals_initializers, void 0);
                this.recentActivity = (__runInitializers(this, _totals_extraInitializers), __runInitializers(this, _recentActivity_initializers, void 0));
                this.charts = (__runInitializers(this, _recentActivity_extraInitializers), __runInitializers(this, _charts_initializers, void 0));
                __runInitializers(this, _charts_extraInitializers);
            }
            return DashboardSummaryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _totals_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Нийт статистик',
                    type: Object,
                    example: {
                        questionnaires: 50,
                        expenses: 200,
                        responses: 1500,
                        totalExpenseAmount: 5000000,
                    },
                }), (0, class_transformer_1.Expose)()];
            _recentActivity_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Сүүлийн үйл ажиллагаа',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            _charts_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'График, диаграммын өгөгдөл',
                    type: Object,
                }), (0, class_transformer_1.Expose)()];
            __esDecorate(null, null, _totals_decorators, { kind: "field", name: "totals", static: false, private: false, access: { has: function (obj) { return "totals" in obj; }, get: function (obj) { return obj.totals; }, set: function (obj, value) { obj.totals = value; } }, metadata: _metadata }, _totals_initializers, _totals_extraInitializers);
            __esDecorate(null, null, _recentActivity_decorators, { kind: "field", name: "recentActivity", static: false, private: false, access: { has: function (obj) { return "recentActivity" in obj; }, get: function (obj) { return obj.recentActivity; }, set: function (obj, value) { obj.recentActivity = value; } }, metadata: _metadata }, _recentActivity_initializers, _recentActivity_extraInitializers);
            __esDecorate(null, null, _charts_decorators, { kind: "field", name: "charts", static: false, private: false, access: { has: function (obj) { return "charts" in obj; }, get: function (obj) { return obj.charts; }, set: function (obj, value) { obj.charts = value; } }, metadata: _metadata }, _charts_initializers, _charts_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.DashboardSummaryDto = DashboardSummaryDto;
