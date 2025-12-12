"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Questionnaire = exports.QuestionType = void 0;
var typeorm_1 = require("typeorm");
var organization_entity_1 = require("../../organizations/entities/organization.entity");
var user_entity_1 = require("../../users/entities/user.entity");
var QuestionType;
(function (QuestionType) {
    QuestionType["MULTIPLE_CHOICE"] = "multiple_choice";
    QuestionType["SINGLE_CHOICE"] = "single_choice";
    QuestionType["TEXT"] = "text";
    QuestionType["RATING"] = "rating";
    QuestionType["DATE"] = "date";
    QuestionType["NUMBER"] = "number";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var Questionnaire = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('questionnaires'), (0, typeorm_1.Index)(['organizationId']), (0, typeorm_1.Index)(['createdBy']), (0, typeorm_1.Index)(['isActive'])];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
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
    var _organization_decorators;
    var _organization_initializers = [];
    var _organization_extraInitializers = [];
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
    var _createdByUser_decorators;
    var _createdByUser_initializers = [];
    var _createdByUser_extraInitializers = [];
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
    var _updateTimestamps_decorators;
    var Questionnaire = _classThis = /** @class */ (function () {
        function Questionnaire_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.title = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _title_initializers, void 0));
            this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.organizationId = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _organizationId_initializers, void 0));
            this.organization = (__runInitializers(this, _organizationId_extraInitializers), __runInitializers(this, _organization_initializers, void 0));
            this.questions = (__runInitializers(this, _organization_extraInitializers), __runInitializers(this, _questions_initializers, void 0));
            this.responseCount = (__runInitializers(this, _questions_extraInitializers), __runInitializers(this, _responseCount_initializers, void 0));
            this.expiresAt = (__runInitializers(this, _responseCount_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
            this.isActive = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
            this.tags = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
            this.settings = (__runInitializers(this, _tags_extraInitializers), __runInitializers(this, _settings_initializers, void 0));
            this.createdBy = (__runInitializers(this, _settings_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
            this.createdByUser = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _createdByUser_initializers, void 0));
            this.createdAt = (__runInitializers(this, _createdByUser_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        Object.defineProperty(Questionnaire_1.prototype, "totalQuestions", {
            // Virtual property for total questions
            get: function () {
                var _a;
                return ((_a = this.questions) === null || _a === void 0 ? void 0 : _a.length) || 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Questionnaire_1.prototype, "isExpired", {
            // Virtual property to check if questionnaire is expired
            get: function () {
                if (!this.expiresAt)
                    return false;
                return this.expiresAt < new Date();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Questionnaire_1.prototype, "isOpen", {
            // Virtual property to check if questionnaire is open (active and not expired)
            get: function () {
                return this.isActive && !this.isExpired;
            },
            enumerable: false,
            configurable: true
        });
        Questionnaire_1.prototype.setDefaultValues = function () {
            if (!this.questions) {
                this.questions = [];
            }
            if (this.isActive === undefined) {
                this.isActive = true;
            }
            if (this.responseCount === undefined) {
                this.responseCount = 0;
            }
        };
        Questionnaire_1.prototype.updateTimestamps = function () {
            this.updatedAt = new Date();
        };
        // Helper method to add a question
        Questionnaire_1.prototype.addQuestion = function (question) {
            if (!this.questions) {
                this.questions = [];
            }
            var questionId = "q_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
            this.questions.push({
                id: questionId,
                text: question.text,
                type: question.type,
                options: question.options || [],
                isRequired: question.isRequired || false,
                placeholder: question.placeholder,
                minValue: question.minValue,
                maxValue: question.maxValue,
            });
        };
        // Helper method to remove a question
        Questionnaire_1.prototype.removeQuestion = function (questionId) {
            if (this.questions) {
                this.questions = this.questions.filter(function (q) { return q.id !== questionId; });
            }
        };
        // Helper method to update a question
        Questionnaire_1.prototype.updateQuestion = function (questionId, updates) {
            if (this.questions) {
                var questionIndex = this.questions.findIndex(function (q) { return q.id === questionId; });
                if (questionIndex !== -1) {
                    this.questions[questionIndex] = __assign(__assign({}, this.questions[questionIndex]), updates);
                }
            }
        };
        return Questionnaire_1;
    }());
    __setFunctionName(_classThis, "Questionnaire");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _title_decorators = [(0, typeorm_1.Column)()];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _organizationId_decorators = [(0, typeorm_1.Column)({ name: 'organization_id' })];
        _organization_decorators = [(0, typeorm_1.ManyToOne)(function () { return organization_entity_1.Organization; }, function (organization) { return organization.id; }, {
                onDelete: 'CASCADE',
            }), (0, typeorm_1.JoinColumn)({ name: 'organization_id' })];
        _questions_decorators = [(0, typeorm_1.Column)('jsonb', { default: [] })];
        _responseCount_decorators = [(0, typeorm_1.Column)({ default: 0, name: 'response_count' })];
        _expiresAt_decorators = [(0, typeorm_1.Column)({ nullable: true, name: 'expires_at' })];
        _isActive_decorators = [(0, typeorm_1.Column)({ default: true, name: 'is_active' })];
        _tags_decorators = [(0, typeorm_1.Column)('simple-array', { nullable: true })];
        _settings_decorators = [(0, typeorm_1.Column)('jsonb', { nullable: true })];
        _createdBy_decorators = [(0, typeorm_1.Column)({ name: 'created_by' })];
        _createdByUser_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.id; }), (0, typeorm_1.JoinColumn)({ name: 'created_by' })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' })];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' })];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' })];
        _setDefaultValues_decorators = [(0, typeorm_1.BeforeInsert)()];
        _updateTimestamps_decorators = [(0, typeorm_1.BeforeUpdate)()];
        __esDecorate(_classThis, null, _setDefaultValues_decorators, { kind: "method", name: "setDefaultValues", static: false, private: false, access: { has: function (obj) { return "setDefaultValues" in obj; }, get: function (obj) { return obj.setDefaultValues; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateTimestamps_decorators, { kind: "method", name: "updateTimestamps", static: false, private: false, access: { has: function (obj) { return "updateTimestamps" in obj; }, get: function (obj) { return obj.updateTimestamps; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _organizationId_decorators, { kind: "field", name: "organizationId", static: false, private: false, access: { has: function (obj) { return "organizationId" in obj; }, get: function (obj) { return obj.organizationId; }, set: function (obj, value) { obj.organizationId = value; } }, metadata: _metadata }, _organizationId_initializers, _organizationId_extraInitializers);
        __esDecorate(null, null, _organization_decorators, { kind: "field", name: "organization", static: false, private: false, access: { has: function (obj) { return "organization" in obj; }, get: function (obj) { return obj.organization; }, set: function (obj, value) { obj.organization = value; } }, metadata: _metadata }, _organization_initializers, _organization_extraInitializers);
        __esDecorate(null, null, _questions_decorators, { kind: "field", name: "questions", static: false, private: false, access: { has: function (obj) { return "questions" in obj; }, get: function (obj) { return obj.questions; }, set: function (obj, value) { obj.questions = value; } }, metadata: _metadata }, _questions_initializers, _questions_extraInitializers);
        __esDecorate(null, null, _responseCount_decorators, { kind: "field", name: "responseCount", static: false, private: false, access: { has: function (obj) { return "responseCount" in obj; }, get: function (obj) { return obj.responseCount; }, set: function (obj, value) { obj.responseCount = value; } }, metadata: _metadata }, _responseCount_initializers, _responseCount_extraInitializers);
        __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: function (obj) { return "expiresAt" in obj; }, get: function (obj) { return obj.expiresAt; }, set: function (obj, value) { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
        __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
        __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: function (obj) { return "tags" in obj; }, get: function (obj) { return obj.tags; }, set: function (obj, value) { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
        __esDecorate(null, null, _settings_decorators, { kind: "field", name: "settings", static: false, private: false, access: { has: function (obj) { return "settings" in obj; }, get: function (obj) { return obj.settings; }, set: function (obj, value) { obj.settings = value; } }, metadata: _metadata }, _settings_initializers, _settings_extraInitializers);
        __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: function (obj) { return "createdBy" in obj; }, get: function (obj) { return obj.createdBy; }, set: function (obj, value) { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
        __esDecorate(null, null, _createdByUser_decorators, { kind: "field", name: "createdByUser", static: false, private: false, access: { has: function (obj) { return "createdByUser" in obj; }, get: function (obj) { return obj.createdByUser; }, set: function (obj, value) { obj.createdByUser = value; } }, metadata: _metadata }, _createdByUser_initializers, _createdByUser_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Questionnaire = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Questionnaire = _classThis;
}();
exports.Questionnaire = Questionnaire;
