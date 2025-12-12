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
exports.CreateQuestionnaireDto = exports.QuestionDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var swagger_1 = require("@nestjs/swagger");
var questionnaire_entity_1 = require("../entities/questionnaire.entity");
var QuestionDto = function () {
    var _a;
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
            function QuestionDto() {
                this.text = __runInitializers(this, _text_initializers, void 0);
                this.type = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.options = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _options_initializers, void 0));
                this.isRequired = (__runInitializers(this, _options_extraInitializers), __runInitializers(this, _isRequired_initializers, void 0));
                this.placeholder = (__runInitializers(this, _isRequired_extraInitializers), __runInitializers(this, _placeholder_initializers, void 0));
                this.minValue = (__runInitializers(this, _placeholder_extraInitializers), __runInitializers(this, _minValue_initializers, void 0));
                this.maxValue = (__runInitializers(this, _minValue_extraInitializers), __runInitializers(this, _maxValue_initializers, void 0));
                __runInitializers(this, _maxValue_extraInitializers);
            }
            return QuestionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _text_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'How satisfied are you with our service?',
                    description: 'Question text',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3), (0, class_validator_1.MaxLength)(500)];
            _type_decorators = [(0, swagger_1.ApiProperty)({
                    enum: questionnaire_entity_1.QuestionType,
                    example: questionnaire_entity_1.QuestionType.RATING,
                    description: 'Question type',
                }), (0, class_validator_1.IsEnum)(questionnaire_entity_1.QuestionType)];
            _options_decorators = [(0, swagger_1.ApiProperty)({
                    example: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
                    description: 'Answer options (for choice questions)',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _isRequired_decorators = [(0, swagger_1.ApiProperty)({
                    example: true,
                    description: 'Whether the question is required',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _placeholder_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Please rate from 1 to 5',
                    description: 'Placeholder text',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _minValue_decorators = [(0, swagger_1.ApiProperty)({
                    example: 1,
                    description: 'Minimum value (for number/rating questions)',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            _maxValue_decorators = [(0, swagger_1.ApiProperty)({
                    example: 5,
                    description: 'Maximum value (for number/rating questions)',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
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
exports.QuestionDto = QuestionDto;
var CreateQuestionnaireDto = function () {
    var _a;
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
    return _a = /** @class */ (function () {
            function CreateQuestionnaireDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.organizationId = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
                this.questions = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _questions_initializers, void 0));
                this.expiresAt = (__runInitializers(this, _questions_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
                this.isActive = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
                this.tags = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
                this.settings = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _settings_initializers, void 0));
                __runInitializers(this, _settings_extraInitializers);
            }
            return CreateQuestionnaireDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Customer Satisfaction Survey',
                    description: 'Questionnaire title',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3), (0, class_validator_1.MaxLength)(200)];
            _description_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Survey to measure customer satisfaction with our services',
                    description: 'Questionnaire description',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(1000)];
            _organizationId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'org_123',
                    description: 'Organization ID',
                }), (0, class_validator_1.IsUUID)()];
            _questions_decorators = [(0, swagger_1.ApiProperty)({
                    type: [QuestionDto],
                    description: 'List of questions',
                }), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return QuestionDto; })];
            _expiresAt_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-12-31T23:59:59.999Z',
                    description: 'Expiration date',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _isActive_decorators = [(0, swagger_1.ApiProperty)({
                    example: true,
                    description: 'Whether the questionnaire is active',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _tags_decorators = [(0, swagger_1.ApiProperty)({
                    example: ['tag1', 'tag2'],
                    description: 'Questionnaire tags',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _settings_decorators = [(0, swagger_1.ApiProperty)({
                    example: { allowAnonymous: true, requireLogin: false },
                    description: 'Questionnaire settings',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
            __esDecorate(null, null, _questions_decorators, { kind: "field", name: "questions", static: false, private: false, access: { has: function (obj) { return "questions" in obj; }, get: function (obj) { return obj.questions; }, set: function (obj, value) { obj.questions = value; } }, metadata: _metadata }, _questions_initializers, _questions_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: function (obj) { return "expiresAt" in obj; }, get: function (obj) { return obj.expiresAt; }, set: function (obj, value) { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: function (obj) { return "tags" in obj; }, get: function (obj) { return obj.tags; }, set: function (obj, value) { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
            __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateQuestionnaireDto = CreateQuestionnaireDto;
