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
exports.Report = exports.ReportStatus = exports.ReportType = void 0;
var typeorm_1 = require("typeorm");
var swagger_1 = require("@nestjs/swagger");
var base_entity_1 = require("./base.entity");
var user_entity_1 = require("./user.entity");
var organization_entity_1 = require("./organization.entity");
var questionnaire_entity_1 = require("./questionnaire.entity");
var ReportType;
(function (ReportType) {
    ReportType["QUESTIONNAIRE"] = "questionnaire";
    ReportType["EXPENSE"] = "expense";
    ReportType["COMBINED"] = "combined";
    ReportType["CUSTOM"] = "custom";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["PROCESSING"] = "processing";
    ReportStatus["COMPLETED"] = "completed";
    ReportStatus["FAILED"] = "failed";
    ReportStatus["EXPORTED"] = "exported";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var Report = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('reports'), (0, typeorm_1.Index)(['organizationId', 'type']), (0, typeorm_1.Index)(['generatedById', 'createdAt']), (0, typeorm_1.Index)(['status', 'exportedAt'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
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
    var _exportPath_decorators;
    var _exportPath_initializers = [];
    var _exportPath_extraInitializers = [];
    var _exportFormat_decorators;
    var _exportFormat_initializers = [];
    var _exportFormat_extraInitializers = [];
    var _exportedAt_decorators;
    var _exportedAt_initializers = [];
    var _exportedAt_extraInitializers = [];
    var _parameters_decorators;
    var _parameters_initializers = [];
    var _parameters_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _generatedById_decorators;
    var _generatedById_initializers = [];
    var _generatedById_extraInitializers = [];
    var _errorMessage_decorators;
    var _errorMessage_initializers = [];
    var _errorMessage_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _generatedBy_decorators;
    var _generatedBy_initializers = [];
    var _generatedBy_extraInitializers = [];
    var _questionnaire_decorators;
    var _questionnaire_initializers = [];
    var _questionnaire_extraInitializers = [];
    var Report = _classThis = /** @class */ (function (_super) {
        __extends(Report_1, _super);
        function Report_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.type = __runInitializers(_this, _type_initializers, void 0);
            _this.title = (__runInitializers(_this, _type_extraInitializers), __runInitializers(_this, _title_initializers, void 0));
            _this.description = (__runInitializers(_this, _title_extraInitializers), __runInitializers(_this, _description_initializers, void 0));
            _this.data = (__runInitializers(_this, _description_extraInitializers), __runInitializers(_this, _data_initializers, void 0));
            _this.status = (__runInitializers(_this, _data_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.exportPath = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _exportPath_initializers, void 0));
            _this.exportFormat = (__runInitializers(_this, _exportPath_extraInitializers), __runInitializers(_this, _exportFormat_initializers, void 0));
            _this.exportedAt = (__runInitializers(_this, _exportFormat_extraInitializers), __runInitializers(_this, _exportedAt_initializers, void 0));
            _this.parameters = (__runInitializers(_this, _exportedAt_extraInitializers), __runInitializers(_this, _parameters_initializers, void 0));
            _this.organizationId = (__runInitializers(_this, _parameters_extraInitializers), __runInitializers(_this, _organizationId_initializers, void 0));
            _this.questionnaireId = (__runInitializers(_this, _organizationId_extraInitializers), __runInitializers(_this, _questionnaireId_initializers, void 0));
            _this.generatedById = (__runInitializers(_this, _questionnaireId_extraInitializers), __runInitializers(_this, _generatedById_initializers, void 0));
            _this.errorMessage = (__runInitializers(_this, _generatedById_extraInitializers), __runInitializers(_this, _errorMessage_initializers, void 0));
            // Relationships
            _this.organization = (__runInitializers(_this, _errorMessage_extraInitializers), __runInitializers(_this, _organization_initializers, void 0));
            _this.generatedBy = (__runInitializers(_this, _organization_extraInitializers), __runInitializers(_this, _generatedBy_initializers, void 0));
            _this.questionnaire = (__runInitializers(_this, _generatedBy_extraInitializers), __runInitializers(_this, _questionnaire_initializers, void 0));
            __runInitializers(_this, _questionnaire_extraInitializers);
            return _this;
        }
        return Report_1;
    }(_classSuper));
    __setFunctionName(_classThis, "Report");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _type_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлангийн төрөл', enum: ReportType }), (0, typeorm_1.Column)({ type: 'enum', enum: ReportType })];
        _title_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлангийн гарчиг' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлангийн тайлбар', nullable: true }), (0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _data_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлангийн өгөгдөл (JSON)' }), (0, typeorm_1.Column)({ type: 'json' })];
        _status_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлангийн статус', enum: ReportStatus, default: ReportStatus.PENDING }), (0, typeorm_1.Column)({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })];
        _exportPath_decorators = [(0, swagger_1.ApiProperty)({ description: 'Экспортолсон зам (PDF, Excel)', nullable: true }), (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _exportFormat_decorators = [(0, swagger_1.ApiProperty)({ description: 'Экспортолсон формат', nullable: true }), (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true })];
        _exportedAt_decorators = [(0, swagger_1.ApiProperty)({ description: 'Экспортолсон огноо', nullable: true }), (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true })];
        _parameters_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлангийн параметрүүд (JSON)', nullable: true }), (0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _organizationId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хамаарах байгууллагын ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Холбогдох асуулгын ID', nullable: true }), (0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _generatedById_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлан үүсгэсэн хэрэглэгчийн ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _errorMessage_decorators = [(0, swagger_1.ApiProperty)({ description: 'Алдааны мэдээлэл', nullable: true }), (0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.reports; }), (0, typeorm_1.JoinColumn)({ name: 'organizationId' })];
        _generatedBy_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.generatedReports; }), (0, typeorm_1.JoinColumn)({ name: 'generatedById' })];
        _questionnaire_decorators = [(0, typeorm_1.ManyToOne)(function () { return questionnaire_entity_1.Questionnaire; }, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'questionnaireId' })];
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: function (obj) { return "data" in obj; }, get: function (obj) { return obj.data; }, set: function (obj, value) { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _exportPath_decorators, { kind: "field", name: "exportPath", static: false, private: false, access: { has: function (obj) { return "exportPath" in obj; }, get: function (obj) { return obj.exportPath; }, set: function (obj, value) { obj.exportPath = value; } }, metadata: _metadata }, _exportPath_initializers, _exportPath_extraInitializers);
        __esDecorate(null, null, _exportFormat_decorators, { kind: "field", name: "exportFormat", static: false, private: false, access: { has: function (obj) { return "exportFormat" in obj; }, get: function (obj) { return obj.exportFormat; }, set: function (obj, value) { obj.exportFormat = value; } }, metadata: _metadata }, _exportFormat_initializers, _exportFormat_extraInitializers);
        __esDecorate(null, null, _exportedAt_decorators, { kind: "field", name: "exportedAt", static: false, private: false, access: { has: function (obj) { return "exportedAt" in obj; }, get: function (obj) { return obj.exportedAt; }, set: function (obj, value) { obj.exportedAt = value; } }, metadata: _metadata }, _exportedAt_initializers, _exportedAt_extraInitializers);
        __esDecorate(null, null, _parameters_decorators, { kind: "field", name: "parameters", static: false, private: false, access: { has: function (obj) { return "parameters" in obj; }, get: function (obj) { return obj.parameters; }, set: function (obj, value) { obj.parameters = value; } }, metadata: _metadata }, _parameters_initializers, _parameters_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
        __esDecorate(null, null, _generatedById_decorators, { kind: "field", name: "generatedById", static: false, private: false, access: { has: function (obj) { return "generatedById" in obj; }, get: function (obj) { return obj.generatedById; }, set: function (obj, value) { obj.generatedById = value; } }, metadata: _metadata }, _generatedById_initializers, _generatedById_extraInitializers);
        __esDecorate(null, null, _errorMessage_decorators, { kind: "field", name: "errorMessage", static: false, private: false, access: { has: function (obj) { return "errorMessage" in obj; }, get: function (obj) { return obj.errorMessage; }, set: function (obj, value) { obj.errorMessage = value; } }, metadata: _metadata }, _errorMessage_initializers, _errorMessage_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _generatedBy_decorators, { kind: "field", name: "generatedBy", static: false, private: false, access: { has: function (obj) { return "generatedBy" in obj; }, get: function (obj) { return obj.generatedBy; }, set: function (obj, value) { obj.generatedBy = value; } }, metadata: _metadata }, _generatedBy_initializers, _generatedBy_extraInitializers);
        __esDecorate(null, null, _questionnaire_decorators, { kind: "field", name: "questionnaire", static: false, private: false, access: { has: function (obj) { return "questionnaire" in obj; }, get: function (obj) { return obj.questionnaire; }, set: function (obj, value) { obj.questionnaire = value; } }, metadata: _metadata }, _questionnaire_initializers, _questionnaire_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Report = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Report = _classThis;
}();
exports.Report = Report;
