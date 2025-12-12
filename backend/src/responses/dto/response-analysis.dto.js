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
exports.ResponseAnalysisDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var ResponseAnalysisDto = function () {
    var _a;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _questionnaireTitle_decorators;
    var _questionnaireTitle_initializers = [];
    var _questionnaireTitle_extraInitializers = [];
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    var _userEmail_decorators;
    var _userEmail_initializers = [];
    var _userEmail_extraInitializers = [];
    var _submittedAt_decorators;
    var _submittedAt_initializers = [];
    var _submittedAt_extraInitializers = [];
    var _completionTime_decorators;
    var _completionTime_initializers = [];
    var _completionTime_extraInitializers = [];
    var _totalQuestions_decorators;
    var _totalQuestions_initializers = [];
    var _totalQuestions_extraInitializers = [];
    var _answeredQuestions_decorators;
    var _answeredQuestions_initializers = [];
    var _answeredQuestions_extraInitializers = [];
    var _completionPercentage_decorators;
    var _completionPercentage_initializers = [];
    var _completionPercentage_extraInitializers = [];
    var _averageTextLength_decorators;
    var _averageTextLength_initializers = [];
    var _averageTextLength_extraInitializers = [];
    var _answers_decorators;
    var _answers_initializers = [];
    var _answers_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ResponseAnalysisDto() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.questionnaireId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _questionnaireId_initializers, void 0));
                this.questionnaireTitle = (__runInitializers(this, _questionnaireId_extraInitializers), __runInitializers(this, _questionnaireTitle_initializers, void 0));
                this.userId = (__runInitializers(this, _questionnaireTitle_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
                this.userEmail = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _userEmail_initializers, void 0));
                this.submittedAt = (__runInitializers(this, _userEmail_extraInitializers), __runInitializers(this, _submittedAt_initializers, void 0));
                this.completionTime = (__runInitializers(this, _submittedAt_extraInitializers), __runInitializers(this, _completionTime_initializers, void 0));
                this.totalQuestions = (__runInitializers(this, _completionTime_extraInitializers), __runInitializers(this, _totalQuestions_initializers, void 0));
                this.answeredQuestions = (__runInitializers(this, _totalQuestions_extraInitializers), __runInitializers(this, _answeredQuestions_initializers, void 0));
                this.completionPercentage = (__runInitializers(this, _answeredQuestions_extraInitializers), __runInitializers(this, _completionPercentage_initializers, void 0));
                this.averageTextLength = (__runInitializers(this, _completionPercentage_extraInitializers), __runInitializers(this, _averageTextLength_initializers, void 0));
                this.answers = (__runInitializers(this, _averageTextLength_extraInitializers), __runInitializers(this, _answers_initializers, void 0));
                __runInitializers(this, _answers_extraInitializers);
            }
            return ResponseAnalysisDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'resp_123',
                    description: 'Response ID',
                })];
            _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'ques_123',
                    description: 'Questionnaire ID',
                })];
            _questionnaireTitle_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'Customer Satisfaction Survey',
                    description: 'Questionnaire title',
                })];
            _userId_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'user_123',
                    description: 'User ID',
                })];
            _userEmail_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'user@example.com',
                    description: 'User email',
                })];
            _submittedAt_decorators = [(0, swagger_1.ApiProperty)({
                    example: '2024-01-01T00:00:00.000Z',
                    description: 'Submission timestamp',
                })];
            _completionTime_decorators = [(0, swagger_1.ApiProperty)({
                    example: 120,
                    description: 'Completion time in seconds',
                })];
            _totalQuestions_decorators = [(0, swagger_1.ApiProperty)({
                    example: 10,
                    description: 'Total questions',
                })];
            _answeredQuestions_decorators = [(0, swagger_1.ApiProperty)({
                    example: 8,
                    description: 'Answered questions',
                })];
            _completionPercentage_decorators = [(0, swagger_1.ApiProperty)({
                    example: 80,
                    description: 'Completion percentage',
                })];
            _averageTextLength_decorators = [(0, swagger_1.ApiProperty)({
                    example: 45.5,
                    description: 'Average text length',
                })];
            _answers_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Detailed answers',
                })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
            __esDecorate(null, null, _questionnaireTitle_decorators, { kind: "field", name: "questionnaireTitle", static: false, private: false, access: { has: function (obj) { return "questionnaireTitle" in obj; }, get: function (obj) { return obj.questionnaireTitle; }, set: function (obj, value) { obj.questionnaireTitle = value; } }, metadata: _metadata }, _questionnaireTitle_initializers, _questionnaireTitle_extraInitializers);
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            __esDecorate(null, null, _userEmail_decorators, { kind: "field", name: "userEmail", static: false, private: false, access: { has: function (obj) { return "userEmail" in obj; }, get: function (obj) { return obj.userEmail; }, set: function (obj, value) { obj.userEmail = value; } }, metadata: _metadata }, _userEmail_initializers, _userEmail_extraInitializers);
            __esDecorate(null, null, _submittedAt_decorators, { kind: "field", name: "submittedAt", static: false, private: false, access: { has: function (obj) { return "submittedAt" in obj; }, get: function (obj) { return obj.submittedAt; }, set: function (obj, value) { obj.submittedAt = value; } }, metadata: _metadata }, _submittedAt_initializers, _submittedAt_extraInitializers);
            __esDecorate(null, null, _completionTime_decorators, { kind: "field", name: "completionTime", static: false, private: false, access: { has: function (obj) { return "completionTime" in obj; }, get: function (obj) { return obj.completionTime; }, set: function (obj, value) { obj.completionTime = value; } }, metadata: _metadata }, _completionTime_initializers, _completionTime_extraInitializers);
            __esDecorate(null, null, _totalQuestions_decorators, { kind: "field", name: "totalQuestions", static: false, private: false, access: { has: function (obj) { return "totalQuestions" in obj; }, get: function (obj) { return obj.totalQuestions; }, set: function (obj, value) { obj.totalQuestions = value; } }, metadata: _metadata }, _totalQuestions_initializers, _totalQuestions_extraInitializers);
            __esDecorate(null, null, _answeredQuestions_decorators, { kind: "field", name: "answeredQuestions", static: false, private: false, access: { has: function (obj) { return "answeredQuestions" in obj; }, get: function (obj) { return obj.answeredQuestions; }, set: function (obj, value) { obj.answeredQuestions = value; } }, metadata: _metadata }, _answeredQuestions_initializers, _answeredQuestions_extraInitializers);
            __esDecorate(null, null, _completionPercentage_decorators, { kind: "field", name: "completionPercentage", static: false, private: false, access: { has: function (obj) { return "completionPercentage" in obj; }, get: function (obj) { return obj.completionPercentage; }, set: function (obj, value) { obj.completionPercentage = value; } }, metadata: _metadata }, _completionPercentage_initializers, _completionPercentage_extraInitializers);
            __esDecorate(null, null, _averageTextLength_decorators, { kind: "field", name: "averageTextLength", static: false, private: false, access: { has: function (obj) { return "averageTextLength" in obj; }, get: function (obj) { return obj.averageTextLength; }, set: function (obj, value) { obj.averageTextLength = value; } }, metadata: _metadata }, _averageTextLength_initializers, _averageTextLength_extraInitializers);
            __esDecorate(null, null, _answers_decorators, { kind: "field", name: "answers", static: false, private: false, access: { has: function (obj) { return "answers" in obj; }, get: function (obj) { return obj.answers; }, set: function (obj, value) { obj.answers = value; } }, metadata: _metadata }, _answers_initializers, _answers_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ResponseAnalysisDto = ResponseAnalysisDto;
