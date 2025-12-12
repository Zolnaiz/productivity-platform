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
exports.GenerateReportDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var report_entity_1 = require("../../shared/entities/report.entity");
var GenerateReportDto = function () {
    var _a;
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _startDate_decorators;
    var _startDate_initializers = [];
    var _startDate_extraInitializers = [];
    var _endDate_decorators;
    var _endDate_initializers = [];
    var _endDate_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _generatedBy_decorators;
    var _generatedBy_initializers = [];
    var _generatedBy_extraInitializers = [];
    var _parameters_decorators;
    var _parameters_initializers = [];
    var _parameters_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GenerateReportDto() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.organizationId = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                this.startDate = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.questionnaireId = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _questionnaireId_initializers, void 0));
                this.generatedBy = (__runInitializers(this, _questionnaireId_extraInitializers), __runInitializers(this, _generatedBy_initializers, void 0));
                this.parameters = (__runInitializers(this, _generatedBy_extraInitializers), __runInitializers(this, _parameters_initializers, void 0));
                __runInitializers(this, _parameters_extraInitializers);
            }
            return GenerateReportDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн төрөл',
                    enum: report_entity_1.ReportType,
                    example: report_entity_1.ReportType.QUESTIONNAIRE,
                }), (0, class_validator_1.IsEnum)(report_entity_1.ReportType), (0, class_validator_1.IsNotEmpty)()];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Байгууллагын ID',
                    example: '123e4567-e89b-12d3-a456-426614174000',
                }), (0, class_validator_1.IsUUID)(), (0, class_validator_1.IsNotEmpty)()];
            _startDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Эхлэх огноо (YYYY-MM-DD)',
                    example: '2024-01-01',
                }), (0, class_validator_1.IsDateString)(), (0, class_validator_1.IsNotEmpty)()];
            _endDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Дуусах огноо (YYYY-MM-DD)',
                    example: '2024-01-31',
                }), (0, class_validator_1.IsDateString)(), (0, class_validator_1.IsNotEmpty)()];
            _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Асуулгын ID (QUESTIONNAIRE төрөлд шаардлагатай)',
                    example: '123e4567-e89b-12d3-a456-426614174001',
                    required: false,
                }), (0, class_validator_1.IsUUID)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.ValidateIf)(function (o) { return o.type === report_entity_1.ReportType.QUESTIONNAIRE; })];
            _generatedBy_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлан үүсгэсэн хэрэглэгчийн ID',
                    example: '123e4567-e89b-12d3-a456-426614174002',
                }), (0, class_validator_1.IsUUID)(), (0, class_validator_1.IsNotEmpty)()];
            _parameters_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Тайлангийн нэмэлт параметрүүд',
                    type: Object,
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
            __esDecorate(null, null, _generatedBy_decorators, { kind: "field", name: "generatedBy", static: false, private: false, access: { has: function (obj) { return "generatedBy" in obj; }, get: function (obj) { return obj.generatedBy; }, set: function (obj, value) { obj.generatedBy = value; } }, metadata: _metadata }, _generatedBy_initializers, _generatedBy_extraInitializers);
            __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: function (obj) { return "parameters" in obj; }, get: function (obj) { return obj.parameters; }, set: function (obj, value) { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GenerateReportDto = GenerateReportDto;
