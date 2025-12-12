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
exports.QuestionnaireResponseDto = exports.QuestionResponseDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var questionnaire_entity_1 = require("../entities/questionnaire.entity");
var QuestionResponseDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _text_decorators;
    var _text_initializers = [];
    var _text_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _options_decorators;
    var _options_initializers = [];
    var _options_extraInitializers = [];
    var _isRequired_decorators;
    var _isRequired_initializers = [];
    var _isRequired_extraInitializers = [];
    var _placeholder_decorators;
    var _placeholder_initializers = [];
    var _placeholder_extraInitializers = [];
    var _minValue_decorators;
    var _minValue_initializers = [];
    var _minValue_extraInitializers = [];
    var _maxValue_decorators;
    var _maxValue_initializers = [];
    var _maxValue_extraInitializers = [];
    return _a = /** @class */ (function () {
            function QuestionResponseDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.text = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _text_initializers, void 0));
                this.type = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.options = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _options_initializers, void 0));
                this.isRequired = (__runInitializers(this, _options_extraInitializers), __runInitializers(this, _isRequired_initializers, void 0));
                this.placeholder = (__runInitializers(this, _isRequired_extraInitializers), __runInitializers(this, _placeholder_initializers, void 0));
                this.minValue = (__runInitializers(this, _placeholder_extraInitializers), __runInitializers(this, _minValue_initializers, void 0));
                this.maxValue = (__runInitializers(this, _minValue_extraInitializers), __runInitializers(this, _maxValue_initializers, void 0));
                __runInitializers(this, _maxValue_extraInitializers);
            }
            return QuestionResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'ques_123',
                    description: 'Question ID',
                })];
            _text_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'How satisfied are you with our service?',
                    description: 'Question text',
                })];
            _type_decorators = [(0, swagger_1.ApiProperty)({
                    enum: questionnaire_entity_1.QuestionType,
                    example: questionnaire_entity_1.QuestionType.RATING,
                    description: 'Question type',
                })];
            _options_decorators = [(0, swagger_1.ApiProperty)({
                    example: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
                    description: 'Answer options',
                })];
            _isRequired_decorators = [(0, swagger_1.ApiProperty)({
                    example: true,
                    description: 'Whether the question is required',
                })];
            _placeholder_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Please rate from 1 to 5',
                    description: 'Placeholder text',
                })];
            _minValue_decorators = [(0, swagger_1.ApiProperty)({
                    example: 1,
                    description: 'Minimum value',
                })];
            _maxValue_decorators = [(0, swagger_1.ApiProperty)({
                    example: 5,
                    description: 'Maximum value',
                })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _text_decorators, { kind: "field", name: "text", static: false, private: false, access: { has: function (obj) { return "text" in obj; }, get: function (obj) { return obj.text; }, set: function (obj, value) { obj.text = value; } }, metadata: _metadata }, _text_initializers, _text_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: function (obj) { return "options" in obj; }, get: function (obj) { return obj.options; }, set: function (obj, value) { obj.options = value; } }, metadata: _metadata }, _options_initializers, _options_extraInitializers);
            __esDecorate(null, null, _isRequired_decorators, { kind: "field", name: "isRequired", static: false, private: false, access: { has: function (obj) { return "isRequired" in obj; }, get: function (obj) { return obj.isRequired; }, set: function (obj, value) { obj.isRequired = value; } }, metadata: _metadata }, _isRequired_initializers, _isRequired_extraInitializers);
            __esDecorate(null, null, _placeholder_decorators, { kind: "field", name: "placeholder", static: false, private: false, access: { has: function (obj) { return "placeholder" in obj; }, get: function (obj) { return obj.placeholder; }, set: function (obj, value) { obj.placeholder = value; } }, metadata: _metadata }, _placeholder_initializers, _placeholder_extraInitializers);
            __esDecorate(null, null, _minValue_decorators, { kind: "field", name: "minValue", static: false, private: false, access: { has: function (obj) { return "minValue" in obj; }, get: function (obj) { return obj.minValue; }, set: function (obj, value) { obj.minValue = value; } }, metadata: _metadata }, _minValue_initializers, _minValue_extraInitializers);
            __esDecorate(null, null, _maxValue_decorators, { kind: "field", name: "maxValue", static: false, private: false, access: { has: function (obj) { return "maxValue" in obj; }, get: function (obj) { return obj.maxValue; }, set: function (obj, value) { obj.maxValue = value; } }, metadata: _metadata }, _maxValue_initializers, _maxValue_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.QuestionResponseDto = QuestionResponseDto;
var QuestionnaireResponseDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _questions_decorators;
    var _questions_initializers = [];
    var _questions_extraInitializers = [];
    var _responseCount_decorators;
    var _responseCount_initializers = [];
    var _responseCount_extraInitializers = [];
    var _expiresAt_decorators;
    var _expiresAt_initializers = [];
    var _expiresAt_extraInitializers = [];
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _tags_decorators;
    var _tags_initializers = [];
    var _tags_extraInitializers = [];
    var _settings_decorators;
    var _settings_initializers = [];
    var _settings_extraInitializers = [];
    var _createdBy_decorators;
    var _createdBy_initializers = [];
    var _createdBy_extraInitializers = [];
    var _createdByName_decorators;
    var _createdByName_initializers = [];
    var _createdByName_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function QuestionnaireResponseDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.title = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.organizationId = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                this.questions = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _questions_initializers, void 0));
                this.responseCount = (__runInitializers(this, _questions_extraInitializers), __runInitializers(this, _responseCount_initializers, void 0));
                this.expiresAt = (__runInitializers(this, _responseCount_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
                this.isActive = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                this.tags = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
                this.settings = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _settings_initializers, void 0));
                this.createdBy = (__runInitializers(this, _settings_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
                this.createdByName = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _createdByName_initializers, void 0));
                this.createdAt = (__runInitializers(this, _createdByName_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
                __runInitializers(this, _updatedAt_extraInitializers);
            }
            return QuestionnaireResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'ques_123',
                    description: 'Questionnaire ID',
                })];
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Customer Satisfaction Survey',
                    description: 'Questionnaire title',
                })];
            _description_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Survey to measure customer satisfaction with our services',
                    description: 'Questionnaire description',
                })];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'org_123',
                    description: 'Organization ID',
                })];
            _questions_decorators = [(0, swagger_1.ApiProperty)({
                    type: [QuestionResponseDto],
                    description: 'List of questions',
                })];
            _responseCount_decorators = [(0, swagger_1.ApiProperty)({
                    example: 150,
                    description: 'Number of responses',
                })];
            _expiresAt_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-12-31T23:59:59.999Z',
                    description: 'Expiration date',
                })];
            _isActive_decorators = [(0, swagger_1.ApiProperty)({
                    example: true,
                    description: 'Whether the questionnaire is active',
                })];
            _tags_decorators = [(0, swagger_1.ApiProperty)({
                    example: ['tag1', 'tag2'],
                    description: 'Questionnaire tags',
                })];
            _settings_decorators = [(0, swagger_1.ApiProperty)({
                    example: { allowAnonymous: true, requireLogin: false },
                    description: 'Questionnaire settings',
                })];
            _createdBy_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'user_123',
                    description: 'Created by user ID',
                })];
            _createdByName_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'John Doe',
                    description: 'Created by user name',
                })];
            _createdAt_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-01-01T00:00:00.000Z',
                    description: 'Creation timestamp',
                })];
            _updatedAt_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-01-01T00:00:00.000Z',
                    description: 'Last update timestamp',
                })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            __esDecorate(null, null, _questions_decorators, { kind: "field", name: "questions", static: false, private: false, access: { has: function (obj) { return "questions" in obj; }, get: function (obj) { return obj.questions; }, set: function (obj, value) { obj.questions = value; } }, metadata: _metadata }, _questions_initializers, _questions_extraInitializers);
            __esDecorate(null, null, _responseCount_decorators, { kind: "field", name: "responseCount", static: false, private: false, access: { has: function (obj) { return "responseCount" in obj; }, get: function (obj) { return obj.responseCount; }, set: function (obj, value) { obj.responseCount = value; } }, metadata: _metadata }, _responseCount_initializers, _responseCount_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: function (obj) { return "expiresAt" in obj; }, get: function (obj) { return obj.expiresAt; }, set: function (obj, value) { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: function (obj) { return "tags" in obj; }, get: function (obj) { return obj.tags; }, set: function (obj, value) { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
            __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
            __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: function (obj) { return "createdBy" in obj; }, get: function (obj) { return obj.createdBy; }, set: function (obj, value) { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
            __esDecorate(null, null, _createdByName_decorators, { kind: "field", name: "createdByName", static: false, private: false, access: { has: function (obj) { return "createdByName" in obj; }, get: function (obj) { return obj.createdByName; }, set: function (obj, value) { obj.createdByName = value; } }, metadata: _metadata }, _createdByName_initializers, _createdByName_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.QuestionnaireResponseDto = QuestionnaireResponseDto;
