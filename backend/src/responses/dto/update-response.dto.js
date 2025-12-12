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
exports.UpdateResponseDto = exports.UpdateAnswerDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var swagger_1 = require("@nestjs/swagger");
var UpdateAnswerDto = function () {
    var _a;
    var _questionId_decorators;
    var _questionId_initializers = [];
    var _questionId_extraInitializers = [];
    var _value_decorators;
    var _value_initializers = [];
    var _value_extraInitializers = [];
    var _answeredAt_decorators;
    var _answeredAt_initializers = [];
    var _answeredAt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateAnswerDto() {
                this.questionId = __runInitializers(this, _questionId_initializers, void 0);
                this.value = (__runInitializers(this, _questionId_extraInitializers), __runInitializers(this, _value_initializers, void 0));
                this.answeredAt = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _answeredAt_initializers, void 0));
                __runInitializers(this, _answeredAt_extraInitializers);
            }
            return UpdateAnswerDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _questionId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'q_123',
                    description: 'Question ID',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _value_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Very Satisfied',
                    description: 'Answer value',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            _answeredAt_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-01-01T00:00:00.000Z',
                    description: 'Answer timestamp',
                    required: false,
                }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _questionId_decorators, { kind: "field", name: "questionId", static: false, private: false, access: { has: function (obj) { return "questionId" in obj; }, get: function (obj) { return obj.questionId; }, set: function (obj, value) { obj.questionId = value; } }, metadata: _metadata }, _questionId_initializers, _questionId_extraInitializers);
            __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
            __esDecorate(null, null, _answeredAt_decorators, { kind: "field", name: "answeredAt", static: false, private: false, access: { has: function (obj) { return "answeredAt" in obj; }, get: function (obj) { return obj.answeredAt; }, set: function (obj, value) { obj.answeredAt = value; } }, metadata: _metadata }, _answeredAt_initializers, _answeredAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateAnswerDto = UpdateAnswerDto;
var UpdateResponseDto = function () {
    var _a;
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _answers_decorators;
    var _answers_initializers = [];
    var _answers_extraInitializers = [];
    var _completionTime_decorators;
    var _completionTime_initializers = [];
    var _completionTime_extraInitializers = [];
    var _metadata_decorators;
    var _metadata_initializers = [];
    var _metadata_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateResponseDto() {
                this.questionnaireId = __runInitializers(this, _questionnaireId_initializers, void 0);
                this.answers = (__runInitializers(this, _questionnaireId_extraInitializers), __runInitializers(this, _answers_initializers, void 0));
                this.completionTime = (__runInitializers(this, _answers_extraInitializers), __runInitializers(this, _completionTime_initializers, void 0));
                this.metadata = (__runInitializers(this, _completionTime_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
                __runInitializers(this, _metadata_extraInitializers);
            }
            return UpdateResponseDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'ques_123',
                    description: 'Questionnaire ID',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            _answers_decorators = [(0, swagger_1.ApiProperty)({
                    type: [UpdateAnswerDto],
                    description: 'List of answers',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return UpdateAnswerDto; })];
            _completionTime_decorators = [(0, swagger_1.ApiProperty)({
                    example: 30000,
                    description: 'Completion time in milliseconds',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _metadata_decorators = [(0, swagger_1.ApiProperty)({
                    example: { device: 'mobile', browser: 'Chrome' },
                    description: 'Response metadata',
                    required: false,
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsObject)()];
            __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
            __esDecorate(null, null, _answers_decorators, { kind: "field", name: "answers", static: false, private: false, access: { has: function (obj) { return "answers" in obj; }, get: function (obj) { return obj.answers; }, set: function (obj, value) { obj.answers = value; } }, metadata: _metadata }, _answers_initializers, _answers_extraInitializers);
            __esDecorate(null, null, _completionTime_decorators, { kind: "field", name: "completionTime", static: false, private: false, access: { has: function (obj) { return "completionTime" in obj; }, get: function (obj) { return obj.completionTime; }, set: function (obj, value) { obj.completionTime = value; } }, metadata: _metadata }, _completionTime_initializers, _completionTime_extraInitializers);
            __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: function (obj) { return "metadata" in obj; }, get: function (obj) { return obj.metadata; }, set: function (obj, value) { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateResponseDto = UpdateResponseDto;
