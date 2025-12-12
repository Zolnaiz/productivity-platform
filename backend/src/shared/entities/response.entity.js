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
exports.Response = exports.ResponseStatus = void 0;
var typeorm_1 = require("typeorm");
var swagger_1 = require("@nestjs/swagger");
var base_entity_1 = require("./base.entity");
var user_entity_1 = require("./user.entity");
var organization_entity_1 = require("./organization.entity");
var questionnaire_entity_1 = require("./questionnaire.entity");
var ResponseStatus;
(function (ResponseStatus) {
    ResponseStatus["IN_PROGRESS"] = "in_progress";
    ResponseStatus["SUBMITTED"] = "submitted";
    ResponseStatus["REVIEWED"] = "reviewed";
    ResponseStatus["APPROVED"] = "approved";
    ResponseStatus["REJECTED"] = "rejected";
})(ResponseStatus || (exports.ResponseStatus = ResponseStatus = {}));
var Response = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('responses'), (0, typeorm_1.Index)(['questionnaireId', 'userId']), (0, typeorm_1.Index)(['organizationId', 'submittedAt']), (0, typeorm_1.Index)(['status', 'score'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _classSuper = base_entity_1.BaseEntity;
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    var _questionnaireId_decorators;
    var _questionnaireId_initializers = [];
    var _questionnaireId_extraInitializers = [];
    var _organizationId_decorators;
    var _organizationId_initializers = [];
    var _organizationId_extraInitializers = [];
    var _answers_decorators;
    var _answers_initializers = [];
    var _answers_extraInitializers = [];
    var _score_decorators;
    var _score_initializers = [];
    var _score_extraInitializers = [];
    var _maxScore_decorators;
    var _maxScore_initializers = [];
    var _maxScore_extraInitializers = [];
    var _percentage_decorators;
    var _percentage_initializers = [];
    var _percentage_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _submittedAt_decorators;
    var _submittedAt_initializers = [];
    var _submittedAt_extraInitializers = [];
    var _reviewedAt_decorators;
    var _reviewedAt_initializers = [];
    var _reviewedAt_extraInitializers = [];
    var _reviewedBy_decorators;
    var _reviewedBy_initializers = [];
    var _reviewedBy_extraInitializers = [];
    var _comments_decorators;
    var _comments_initializers = [];
    var _comments_extraInitializers = [];
    var _revisionHistory_decorators;
    var _revisionHistory_initializers = [];
    var _revisionHistory_extraInitializers = [];
    var _metadata_decorators;
    var _metadata_initializers = [];
    var _metadata_extraInitializers = [];
    var _user_decorators;
    var _user_initializers = [];
    var _user_extraInitializers = [];
    var _questionnaire_decorators;
    var _questionnaire_initializers = [];
    var _questionnaire_extraInitializers = [];
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
    var _reviewer_decorators;
    var _reviewer_initializers = [];
    var _reviewer_extraInitializers = [];
    var Response = _classThis = /** @class */ (function (_super) {
        __extends(Response_1, _super);
        function Response_1() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.userId = __runInitializers(_this, _userId_initializers, void 0);
            _this.questionnaireId = (__runInitializers(_this, _userId_extraInitializers), __runInitializers(_this, _questionnaireId_initializers, void 0));
            _this.organizationId = (__runInitializers(_this, _questionnaireId_extraInitializers), __runInitializers(_this, _organizationId_initializers, void 0));
            _this.answers = (__runInitializers(_this, _organizationId_extraInitializers), __runInitializers(_this, _answers_initializers, void 0));
            _this.score = (__runInitializers(_this, _answers_extraInitializers), __runInitializers(_this, _score_initializers, void 0));
            _this.maxScore = (__runInitializers(_this, _score_extraInitializers), __runInitializers(_this, _maxScore_initializers, void 0));
            _this.percentage = (__runInitializers(_this, _maxScore_extraInitializers), __runInitializers(_this, _percentage_initializers, void 0));
            _this.status = (__runInitializers(_this, _percentage_extraInitializers), __runInitializers(_this, _status_initializers, void 0));
            _this.submittedAt = (__runInitializers(_this, _status_extraInitializers), __runInitializers(_this, _submittedAt_initializers, void 0));
            _this.reviewedAt = (__runInitializers(_this, _submittedAt_extraInitializers), __runInitializers(_this, _reviewedAt_initializers, void 0));
            _this.reviewedBy = (__runInitializers(_this, _reviewedAt_extraInitializers), __runInitializers(_this, _reviewedBy_initializers, void 0));
            _this.comments = (__runInitializers(_this, _reviewedBy_extraInitializers), __runInitializers(_this, _comments_initializers, void 0));
            _this.revisionHistory = (__runInitializers(_this, _comments_extraInitializers), __runInitializers(_this, _revisionHistory_initializers, void 0));
            _this.metadata = (__runInitializers(_this, _revisionHistory_extraInitializers), __runInitializers(_this, _metadata_initializers, void 0));
            // Relationships
            _this.user = (__runInitializers(_this, _metadata_extraInitializers), __runInitializers(_this, _user_initializers, void 0));
            _this.questionnaire = (__runInitializers(_this, _user_extraInitializers), __runInitializers(_this, _questionnaire_initializers, void 0));
            _this.organization = (__runInitializers(_this, _questionnaire_extraInitializers), __runInitializers(_this, _organization_initializers, void 0));
            _this.reviewer = (__runInitializers(_this, _organization_extraInitializers), __runInitializers(_this, _reviewer_initializers, void 0));
            __runInitializers(_this, _reviewer_extraInitializers);
            return _this;
        }
        return Response_1;
    }(_classSuper));
    __setFunctionName(_classThis, "Response");
    (function () {
        var _a;
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        _userId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хариулт өгсөн хэрэглэгчийн ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _questionnaireId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хамаарах асуулгын ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _organizationId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Байгууллагын ID' }), (0, typeorm_1.Column)({ type: 'uuid' })];
        _answers_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хариултууд (JSON)' }), (0, typeorm_1.Column)({ type: 'json' })];
        _score_decorators = [(0, swagger_1.ApiProperty)({ description: 'Нийт оноо', nullable: true }), (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })];
        _maxScore_decorators = [(0, swagger_1.ApiProperty)({ description: 'Максимум оноо', nullable: true }), (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })];
        _percentage_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хувь (%)', nullable: true }), (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true })];
        _status_decorators = [(0, swagger_1.ApiProperty)({ description: 'Хариултын статус', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS }), (0, typeorm_1.Column)({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.IN_PROGRESS })];
        _submittedAt_decorators = [(0, swagger_1.ApiProperty)({ description: 'Илгээсэн огноо', nullable: true }), (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true })];
        _reviewedAt_decorators = [(0, swagger_1.ApiProperty)({ description: 'Шалгасан огноо', nullable: true }), (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true })];
        _reviewedBy_decorators = [(0, swagger_1.ApiProperty)({ description: 'Шалгасан хэрэглэгчийн ID', nullable: true }), (0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _comments_decorators = [(0, swagger_1.ApiProperty)({ description: 'Тайлбар', nullable: true }), (0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _revisionHistory_decorators = [(0, swagger_1.ApiProperty)({ description: 'Өөрчлөлтийн түүх (JSON)', nullable: true }), (0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _metadata_decorators = [(0, swagger_1.ApiProperty)({ description: 'Нэмэлт өгөгдөл (JSON)', nullable: true }), (0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _user_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.responses; }), (0, typeorm_1.JoinColumn)({ name: 'userId' })];
        _questionnaire_decorators = [(0, typeorm_1.ManyToOne)(function () { return questionnaire_entity_1.Questionnaire; }, function (questionnaire) { return questionnaire.responses; }), (0, typeorm_1.JoinColumn)({ name: 'questionnaireId' })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.responses; }), (0, typeorm_1.JoinColumn)({ name: 'organizationId' })];
        _reviewer_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'reviewedBy' })];
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _questionnaireId_decorators, { kind: "field", name: "questionnaireId", static: false, private: false, access: { has: function (obj) { return "questionnaireId" in obj; }, get: function (obj) { return obj.questionnaireId; }, set: function (obj, value) { obj.questionnaireId = value; } }, metadata: _metadata }, _questionnaireId_initializers, _questionnaireId_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _answers_decorators, { kind: "field", name: "answers", static: false, private: false, access: { has: function (obj) { return "answers" in obj; }, get: function (obj) { return obj.answers; }, set: function (obj, value) { obj.answers = value; } }, metadata: _metadata }, _answers_initializers, _answers_extraInitializers);
        __esDecorate(null, null, _score_decorators, { kind: "field", name: "score", static: false, private: false, access: { has: function (obj) { return "score" in obj; }, get: function (obj) { return obj.score; }, set: function (obj, value) { obj.score = value; } }, metadata: _metadata }, _score_initializers, _score_extraInitializers);
        __esDecorate(null, null, _maxScore_decorators, { kind: "field", name: "maxScore", static: false, private: false, access: { has: function (obj) { return "maxScore" in obj; }, get: function (obj) { return obj.maxScore; }, set: function (obj, value) { obj.maxScore = value; } }, metadata: _metadata }, _maxScore_initializers, _maxScore_extraInitializers);
        __esDecorate(null, null, _percentage_decorators, { kind: "field", name: "percentage", static: false, private: false, access: { has: function (obj) { return "percentage" in obj; }, get: function (obj) { return obj.percentage; }, set: function (obj, value) { obj.percentage = value; } }, metadata: _metadata }, _percentage_initializers, _percentage_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _submittedAt_decorators, { kind: "field", name: "submittedAt", static: false, private: false, access: { has: function (obj) { return "submittedAt" in obj; }, get: function (obj) { return obj.submittedAt; }, set: function (obj, value) { obj.submittedAt = value; } }, metadata: _metadata }, _submittedAt_initializers, _submittedAt_extraInitializers);
        __esDecorate(null, null, _reviewedAt_decorators, { kind: "field", name: "reviewedAt", static: false, private: false, access: { has: function (obj) { return "reviewedAt" in obj; }, get: function (obj) { return obj.reviewedAt; }, set: function (obj, value) { obj.reviewedAt = value; } }, metadata: _metadata }, _reviewedAt_initializers, _reviewedAt_extraInitializers);
        __esDecorate(null, null, _reviewedBy_decorators, { kind: "field", name: "reviewedBy", static: false, private: false, access: { has: function (obj) { return "reviewedBy" in obj; }, get: function (obj) { return obj.reviewedBy; }, set: function (obj, value) { obj.reviewedBy = value; } }, metadata: _metadata }, _reviewedBy_initializers, _reviewedBy_extraInitializers);
        __esDecorate(null, null, _comments_decorators, { kind: "field", name: "comments", static: false, private: false, access: { has: function (obj) { return "comments" in obj; }, get: function (obj) { return obj.comments; }, set: function (obj, value) { obj.comments = value; } }, metadata: _metadata }, _comments_initializers, _comments_extraInitializers);
        __esDecorate(null, null, _revisionHistory_decorators, { kind: "field", name: "revisionHistory", static: false, private: false, access: { has: function (obj) { return "revisionHistory" in obj; }, get: function (obj) { return obj.revisionHistory; }, set: function (obj, value) { obj.revisionHistory = value; } }, metadata: _metadata }, _revisionHistory_initializers, _revisionHistory_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: function (obj) { return "metadata" in obj; }, get: function (obj) { return obj.metadata; }, set: function (obj, value) { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: function (obj) { return "user" in obj; }, get: function (obj) { return obj.user; }, set: function (obj, value) { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _questionnaire_decorators, { kind: "field", name: "questionnaire", static: false, private: false, access: { has: function (obj) { return "questionnaire" in obj; }, get: function (obj) { return obj.questionnaire; }, set: function (obj, value) { obj.questionnaire = value; } }, metadata: _metadata }, _questionnaire_initializers, _questionnaire_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _reviewer_decorators, { kind: "field", name: "reviewer", static: false, private: false, access: { has: function (obj) { return "reviewer" in obj; }, get: function (obj) { return obj.reviewer; }, set: function (obj, value) { obj.reviewer = value; } }, metadata: _metadata }, _reviewer_initializers, _reviewer_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Response = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Response = _classThis;
}();
exports.Response = Response;
