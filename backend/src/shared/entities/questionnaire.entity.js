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
exports.Questionnaire = exports.QuestionnaireType = exports.QuestionnaireStatus = void 0;
var typeorm_1 = require("typeorm");
var swagger_1 = require("@nestjs/swagger");
var base_entity_1 = require("./base.entity");
var user_entity_1 = require("./user.entity");
var organization_entity_1 = require("./organization.entity");
var response_entity_1 = require("./response.entity");
var expense_entity_1 = require("../../expenses/entities/expense.entity");
var QuestionnaireStatus;
(function (QuestionnaireStatus) {
    QuestionnaireStatus["DRAFT"] = "draft";
    QuestionnaireStatus["PUBLISHED"] = "published";
    QuestionnaireStatus["ARCHIVED"] = "archived";
})(QuestionnaireStatus || (exports.QuestionnaireStatus = QuestionnaireStatus = {}));
var QuestionnaireType;
(function (QuestionnaireType) {
    QuestionnaireType["SURVEY"] = "survey";
    QuestionnaireType["QUIZ"] = "quiz";
    QuestionnaireType["EVALUATION"] = "evaluation";
    QuestionnaireType["FEEDBACK"] = "feedback";
})(QuestionnaireType || (exports.QuestionnaireType = QuestionnaireType = {}));
var Questionnaire = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('questionnaires'), (0, typeorm_1.Index)(['organizationId', 'status']), (0, typeorm_1.Index)(['createdBy', 'createdAt']), (0, typeorm_1.Index)(['type', 'isActive'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _questions_decorators;
    var _questions_initializers = [];
    var _questions_extraInitializers = [];
    var _timeLimit_decorators;
    var _timeLimit_initializers = [];
    var _timeLimit_extraInitializers = [];
    var _startDate_decorators;
    var _startDate_initializers = [];
    var _startDate_extraInitializers = [];
    var _endDate_decorators;
    var _endDate_initializers = [];
    var _endDate_extraInitializers = [];
    var _scoring_decorators;
    var _scoring_initializers = [];
    var _scoring_extraInitializers = [];
    var _responseCount_decorators;
    var _responseCount_initializers = [];
    var _responseCount_extraInitializers = [];
    var _averageScore_decorators;
    var _averageScore_initializers = [];
    var _averageScore_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _createdBy_decorators;
    var _createdBy_initializers = [];
    var _createdBy_extraInitializers = [];
    var _settings_decorators;
    var _settings_initializers = [];
    var _settings_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _creator_decorators;
    var _creator_initializers = [];
    var _creator_extraInitializers = [];
    var _responses_decorators;
    var _responses_initializers = [];
    var _responses_extraInitializers = [];
    var _expenses_decorators;
    var _expenses_initializers = [];
    var _expenses_extraInitializers = [];
    var Questionnaire = _classThis = /** @class */ (function (_super) {
        __extends(Questionnaire_1, _super);
        function Questionnaire_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.title = __runInitializers(_this, _title_initializers, void 0);
            _this.description = (__runInitializers(_this, _title_extraInitializers), __runInitializers(_this, _description_initializers, void 0));
            _this.type = (__runInitializers(_this, _description_extraInitializers), __runInitializers(_this, _type_initializers, void 0));
            _this.status = (__runInitializers(_this, _type_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.isActive = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _isActive_initializers, void 0));
            _this.questions = (__runInitializers(_this, _isActive_extraInitializers), __runInitializers(_this, _questions_initializers, void 0));
            _this.timeLimit = (__runInitializers(_this, _questions_extraInitializers), __runInitializers(_this, _timeLimit_initializers, void 0));
            _this.startDate = (__runInitializers(_this, _timeLimit_extraInitializers), __runInitializers(_this, _startDate_initializers, void 0));
            _this.endDate = (__runInitializers(_this, _startDate_extraInitializers), __runInitializers(_this, _endDate_initializers, void 0));
            _this.scoring = (__runInitializers(_this, _endDate_extraInitializers), __runInitializers(_this, _scoring_initializers, void 0));
            _this.responseCount = (__runInitializers(_this, _scoring_extraInitializers), __runInitializers(_this, _responseCount_initializers, void 0));
            _this.averageScore = (__runInitializers(_this, _responseCount_extraInitializers), __runInitializers(_this, _averageScore_initializers, void 0));
            _this.organizationId = (__runInitializers(_this, _averageScore_extraInitializers), __runInitializers(_this, _organizationId_initializers, void 0));
            _this.createdBy = (__runInitializers(_this, _organizationId_extraInitializers), __runInitializers(_this, _createdBy_initializers, void 0));
            _this.settings = (__runInitializers(_this, _createdBy_extraInitializers), __runInitializers(_this, _settings_initializers, void 0));
            // Relationships
            _this.organization = (__runInitializers(_this, _settings_extraInitializers), __runInitializers(_this, _organization_initializers, void 0));
            _this.creator = (__runInitializers(_this, _organization_extraInitializers), __runInitializers(_this, _creator_initializers, void 0));
            _this.responses = (__runInitializers(_this, _creator_extraInitializers), __runInitializers(_this, _responses_initializers, void 0));
            _this.expenses = (__runInitializers(_this, _responses_extraInitializers), __runInitializers(_this, _expenses_initializers, void 0));
            __runInitializers(_this, _expenses_extraInitializers);
            return _this;
        }
        return Questionnaire_1;
    }(_classSuper));
    __setFunctionName(_classThis, "Questionnaire");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _title_decorators = [(0, swagger_1.ApiProperty)({ description: 'Асуулгын гарчиг' }), (0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, swagger_1.ApiProperty)({ description: 'Асуулгын тайлбар', nullable: true }), (0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _type_decorators = [(0, swagger_1.ApiProperty)({ description: 'Асуулгын төрөл', enum: QuestionnaireType, default: QuestionnaireType.SURVEY }), (0, typeorm_1.Column)({ type: 'enum', enum: QuestionnaireType, default: QuestionnaireType.SURVEY })];
        _status_decorators = [(0, swagger_1.ApiProperty)({ description: 'Асуулгын статус', enum: QuestionnaireStatus, default: QuestionnaireStatus.DRAFT }), (0, typeorm_1.Column)({ type: 'enum', enum: QuestionnaireStatus, default: QuestionnaireStatus.DRAFT })];
        _isActive_decorators = [(0, swagger_1.ApiProperty)({ description: 'Идэвхтэй эсэх', default: true }), (0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _questions_decorators = [(0, swagger_1.ApiProperty)({ description: 'Асуултууд (JSON массив)' }), (0, typeorm_1.Column)({ type: 'json' })];
        _timeLimit_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хугацаа (минут)', nullable: true }), (0, typeorm_1.Column)({ type: 'integer', nullable: true })];
        _startDate_decorators = [(0, swagger_1.ApiProperty)({ description: 'Эхлэх огноо', nullable: true }), (0, typeorm_1.Column)({ type: 'date', nullable: true })];
        _endDate_decorators = [(0, swagger_1.ApiProperty)({ description: 'Дуусах огноо', nullable: true }), (0, typeorm_1.Column)({ type: 'date', nullable: true })];
        _scoring_decorators = [(0, swagger_1.ApiProperty)({ description: 'Онооны систем', type: 'json', nullable: true }), (0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _responseCount_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хариултын тоо', default: 0 }), (0, typeorm_1.Column)({ type: 'integer', default: 0 })];
        _averageScore_decorators = [(0, swagger_1.ApiProperty)({ description: 'Дундаж оноо', nullable: true }), (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })];
        _organizationId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хамаарах байгууллагын ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _createdBy_decorators = [(0, swagger_1.ApiProperty)({ description: 'Асуулга үүсгэсэн хэрэглэгчийн ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _settings_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тохиргоо (JSON)' }), (0, typeorm_1.Column)({ type: 'json', default: {} })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.questionnaires; }), (0, typeorm_1.JoinColumn)({ name: 'organizationId' })];
        _creator_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.createdQuestionnaires; }), (0, typeorm_1.JoinColumn)({ name: 'createdBy' })];
        _responses_decorators = [(0, typeorm_1.OneToMany)(function () { return response_entity_1.Response; }, function (response) { return response.questionnaire; })];
        _expenses_decorators = [(0, typeorm_1.OneToMany)(function () { return expense_entity_1.Expense; }, function (expense) { return expense.questionnaire; })];
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _questions_decorators, { kind: "field", name: "questions", static: false, private: false, access: { has: function (obj) { return "questions" in obj; }, get: function (obj) { return obj.questions; }, set: function (obj, value) { obj.questions = value; } }, metadata: _metadata }, _questions_initializers, _questions_extraInitializers);
        __esDecorate(null, null, _timeLimit_decorators, { kind: "field", name: "timeLimit", static: false, private: false, access: { has: function (obj) { return "timeLimit" in obj; }, get: function (obj) { return obj.timeLimit; }, set: function (obj, value) { obj.timeLimit = value; } }, metadata: _metadata }, _timeLimit_initializers, _timeLimit_extraInitializers);
        __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
        __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
        __esDecorate(null, null, _scoring_decorators, { kind: "field", name: "scoring", static: false, private: false, access: { has: function (obj) { return "scoring" in obj; }, get: function (obj) { return obj.scoring; }, set: function (obj, value) { obj.scoring = value; } }, metadata: _metadata }, _scoring_initializers, _scoring_extraInitializers);
        __esDecorate(null, null, _responseCount_decorators, { kind: "field", name: "responseCount", static: false, private: false, access: { has: function (obj) { return "responseCount" in obj; }, get: function (obj) { return obj.responseCount; }, set: function (obj, value) { obj.responseCount = value; } }, metadata: _metadata }, _responseCount_initializers, _responseCount_extraInitializers);
        __esDecorate(null, null, _averageScore_decorators, { kind: "field", name: "averageScore", static: false, private: false, access: { has: function (obj) { return "averageScore" in obj; }, get: function (obj) { return obj.averageScore; }, set: function (obj, value) { obj.averageScore = value; } }, metadata: _metadata }, _averageScore_initializers, _averageScore_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: function (obj) { return "createdBy" in obj; }, get: function (obj) { return obj.createdBy; }, set: function (obj, value) { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _creator_decorators, { kind: "field", name: "creator", static: false, private: false, access: { has: function (obj) { return "creator" in obj; }, get: function (obj) { return obj.creator; }, set: function (obj, value) { obj.creator = value; } }, metadata: _metadata }, _creator_initializers, _creator_extraInitializers);
        __esDecorate(null, null, _responses_decorators, { kind: "field", name: "responses", static: false, private: false, access: { has: function (obj) { return "responses" in obj; }, get: function (obj) { return obj.responses; }, set: function (obj, value) { obj.responses = value; } }, metadata: _metadata }, _responses_initializers, _responses_extraInitializers);
        __esDecorate(null, null, _expenses_decorators, { kind: "field", name: "expenses", static: false, private: false, access: { has: function (obj) { return "expenses" in obj; }, get: function (obj) { return obj.expenses; }, set: function (obj, value) { obj.expenses = value; } }, metadata: _metadata }, _expenses_initializers, _expenses_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Questionnaire = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Questionnaire = _classThis;
}();
exports.Questionnaire = Questionnaire;
