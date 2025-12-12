"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
var typeorm_1 = require("typeorm");
var questionnaire_entity_1 = require("../../questionnaires/entities/questionnaire.entity");
var user_entity_1 = require("../../users/entities/user.entity");
var organization_entity_1 = require("../../organizations/entities/organization.entity");
var Response = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('responses'), (0, typeorm_1.Index)(['questionnaireId']), (0, typeorm_1.Index)(['userId']), (0, typeorm_1.Index)(['organizationId']), (0, typeorm_1.Index)(['submittedAt'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _questionnaire_decorators;
    var _questionnaire_initializers = [];
    var _questionnaire_extraInitializers = [];
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    var _user_decorators;
    var _user_initializers = [];
    var _user_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _answers_decorators;
    var _answers_initializers = [];
    var _answers_extraInitializers = [];
    var _completionTime_decorators;
    var _completionTime_initializers = [];
    var _completionTime_extraInitializers = [];
    var _metadata_decorators;
    var _metadata_initializers = [];
    var _metadata_extraInitializers = [];
    var _submittedAt_decorators;
    var _submittedAt_initializers = [];
    var _submittedAt_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _deletedAt_decorators;
    var _deletedAt_initializers = [];
    var _deletedAt_extraInitializers = [];
    var _setDefaultValues_decorators;
    var Response = _classThis = /** @class */ (function () {
        function Response_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.questionnaireId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _questionnaireId_initializers, void 0));
            this.questionnaire = (__runInitializers(this, _questionnaireId_extraInitializers), __runInitializers(this, _questionnaire_initializers, void 0));
            this.userId = (__runInitializers(this, _questionnaire_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
            this.user = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.organizationId = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
            this.organization = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _organization_initializers, void 0));
            this.answers = (__runInitializers(this, _organization_extraInitializers), __runInitializers(this, _answers_initializers, void 0));
            this.completionTime = (__runInitializers(this, _answers_extraInitializers), __runInitializers(this, _completionTime_initializers, void 0)); // in seconds
            this.metadata = (__runInitializers(this, _completionTime_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.submittedAt = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _submittedAt_initializers, void 0));
            this.createdAt = (__runInitializers(this, _submittedAt_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        Response_1.prototype.setDefaultValues = function () {
            if (!this.submittedAt) {
                this.submittedAt = new Date();
            }
            if (!this.answers) {
                this.answers = [];
            }
        };
        Object.defineProperty(Response_1.prototype, "completionPercentage", {
            // Virtual property for completion percentage
            get: function () {
                var _a, _b;
                if (!((_b = (_a = this.questionnaire) === null || _a === void 0 ? void 0 : _a.questions) === null || _b === void 0 ? void 0 : _b.length))
                    return 0;
                return (this.answers.length / this.questionnaire.questions.length) * 100;
            },
            enumerable: false,
            configurable: true
        });
        // Helper method to add an answer
        Response_1.prototype.addAnswer = function (questionId, value) {
            if (!this.answers) {
                this.answers = [];
            }
            this.answers.push({
                questionId: questionId,
                value: value,
                answeredAt: new Date(),
            });
        };
        // Helper method to get answer for a specific question
        Response_1.prototype.getAnswer = function (questionId) {
            var answer = this.answers.find(function (a) { return a.questionId === questionId; });
            return answer === null || answer === void 0 ? void 0 : answer.value;
        };
        // Helper method to check if a question was answered
        Response_1.prototype.hasAnswer = function (questionId) {
            return this.answers.some(function (a) { return a.questionId === questionId; });
        };
        return Response_1;
    }());
    __setFunctionName(_classThis, "Response");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _questionnaireId_decorators = [(0, typeorm_1.Column)({ name: 'questionnaire_id' })];
        _questionnaire_decorators = [(0, typeorm_1.ManyToOne)(function () { return questionnaire_entity_1.Questionnaire; }, function (questionnaire) { return questionnaire.id; }, {
                onDelete: 'CASCADE',
            }), (0, typeorm_1.JoinColumn)({ name: 'questionnaire_id' })];
        _userId_decorators = [(0, typeorm_1.Column)({ name: 'user_id' })];
        _user_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.id; }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _organizationId_decorators = [(0, typeorm_1.Column)({ name: 'organization_id' })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.id; }), (0, typeorm_1.JoinColumn)({ name: 'organization_id' })];
        _answers_decorators = [(0, typeorm_1.Column)('jsonb', { default: [] })];
        _completionTime_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'completion_time' })];
        _metadata_decorators = [(0, typeorm_1.Column)('jsonb', { nullable: true })];
        _submittedAt_decorators = [(0, typeorm_1.Column)({ name: 'submitted_at' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' })];
        _setDefaultValues_decorators = [(0, typeorm_1.BeforeInsert)()];
        __esDecorate(_classThis, null, _setDefaultValues_decorators, { kind: "method", name: "setDefaultValues", static: false, private: false, access: { has: function (obj) { return "setDefaultValues" in obj; }, get: function (obj) { return obj.setDefaultValues; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
        __esDecorate(null, null, _questionnaire_decorators, { kind: "field", name: "questionnaire", static: false, private: false, access: { has: function (obj) { return "questionnaire" in obj; }, get: function (obj) { return obj.questionnaire; }, set: function (obj, value) { obj.questionnaire = value; } }, metadata: _metadata }, _questionnaire_initializers, _questionnaire_extraInitializers);
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: function (obj) { return "user" in obj; }, get: function (obj) { return obj.user; }, set: function (obj, value) { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _answers_decorators, { kind: "field", name: "answers", static: false, private: false, access: { has: function (obj) { return "answers" in obj; }, get: function (obj) { return obj.answers; }, set: function (obj, value) { obj.answers = value; } }, metadata: _metadata }, _answers_initializers, _answers_extraInitializers);
        __esDecorate(null, null, _completionTime_decorators, { kind: "field", name: "completionTime", static: false, private: false, access: { has: function (obj) { return "completionTime" in obj; }, get: function (obj) { return obj.completionTime; }, set: function (obj, value) { obj.completionTime = value; } }, metadata: _metadata }, _completionTime_initializers, _completionTime_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: function (obj) { return "metadata" in obj; }, get: function (obj) { return obj.metadata; }, set: function (obj, value) { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _submittedAt_decorators, { kind: "field", name: "submittedAt", static: false, private: false, access: { has: function (obj) { return "submittedAt" in obj; }, get: function (obj) { return obj.submittedAt; }, set: function (obj, value) { obj.submittedAt = value; } }, metadata: _metadata }, _submittedAt_initializers, _submittedAt_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Response = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Response = _classThis;
}();
exports.Response = Response;
