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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnairesService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../shared/constants");
var QuestionnairesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var QuestionnairesService = _classThis = /** @class */ (function () {
        function QuestionnairesService_1(questionnairesRepository) {
            this.questionnairesRepository = questionnairesRepository;
        }
        QuestionnairesService_1.prototype.create = function (createQuestionnaireDto, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    // Validate that user has access to the organization
                    if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                        createQuestionnaireDto.organizationId !== user.organizationId) {
                        throw new common_1.ForbiddenException('You can only create questionnaires for your organization');
                    }
                    questionnaire = this.questionnairesRepository.create(__assign(__assign({}, createQuestionnaireDto), { createdBy: user.id }));
                    return [2 /*return*/, this.questionnairesRepository.save(questionnaire)];
                });
            });
        };
        QuestionnairesService_1.prototype.findAll = function (params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, search, organizationId, isActive, expired, skip, query, total, questionnaires;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit, search = params.search, organizationId = params.organizationId, isActive = params.isActive, expired = params.expired;
                            skip = (page - 1) * limit;
                            query = this.questionnairesRepository
                                .createQueryBuilder('questionnaire')
                                .leftJoinAndSelect('questionnaire.organization', 'organization')
                                .leftJoinAndSelect('questionnaire.createdByUser', 'createdByUser');
                            // Apply filters based on user role
                            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                                // Super admin can see all questionnaires
                                if (organizationId) {
                                    query.andWhere('questionnaire.organizationId = :organizationId', {
                                        organizationId: organizationId,
                                    });
                                }
                            }
                            else if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN) {
                                // Organization admin can only see questionnaires from their organization
                                query.andWhere('questionnaire.organizationId = :organizationId', {
                                    organizationId: user.organizationId,
                                });
                            }
                            else {
                                // Regular users can only see active questionnaires from their organization
                                query.andWhere('questionnaire.organizationId = :organizationId', {
                                    organizationId: user.organizationId,
                                });
                                query.andWhere('questionnaire.isActive = :isActive', { isActive: true });
                            }
                            // Apply additional filters
                            if (isActive !== undefined) {
                                query.andWhere('questionnaire.isActive = :isActive', { isActive: isActive });
                            }
                            if (expired !== undefined) {
                                if (expired) {
                                    query.andWhere('questionnaire.expiresAt < :now', { now: new Date() });
                                }
                                else {
                                    query.andWhere('(questionnaire.expiresAt IS NULL OR questionnaire.expiresAt >= :now)', { now: new Date() });
                                }
                            }
                            // Search
                            if (search) {
                                query.andWhere('(questionnaire.title LIKE :search OR questionnaire.description LIKE :search)', { search: "%".concat(search, "%") });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('questionnaire.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            questionnaires = _a.sent();
                            return [2 /*return*/, {
                                    data: questionnaires,
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.findOne = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.questionnairesRepository.findOne({
                                where: { id: id },
                                relations: ['organization', 'createdByUser', 'questions'],
                            })];
                        case 1:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException("Questionnaire with ID ".concat(id, " not found"));
                            }
                            // Check permissions
                            this.checkQuestionnaireAccess(questionnaire, user);
                            return [2 /*return*/, questionnaire];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.findByOrganization = function (organizationId, params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, isActive, skip, query, total, questionnaires;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Check permissions
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            page = params.page, limit = params.limit, isActive = params.isActive;
                            skip = (page - 1) * limit;
                            query = this.questionnairesRepository
                                .createQueryBuilder('questionnaire')
                                .where('questionnaire.organizationId = :organizationId', { organizationId: organizationId });
                            if (isActive !== undefined) {
                                query.andWhere('questionnaire.isActive = :isActive', { isActive: isActive });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('questionnaire.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            questionnaires = _a.sent();
                            return [2 /*return*/, {
                                    data: questionnaires,
                                    meta: {
                                        total: total,
                                        page: page,
                                        limit: limit,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                }];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.update = function (id, updateQuestionnaireDto, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check if user can update this questionnaire
                            this.checkQuestionnaireModificationAccess(questionnaire, user);
                            Object.assign(questionnaire, updateQuestionnaireDto);
                            return [2 /*return*/, this.questionnairesRepository.save(questionnaire)];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.remove = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check if user can delete this questionnaire
                            this.checkQuestionnaireModificationAccess(questionnaire, user);
                            // Check if questionnaire has responses
                            if (questionnaire.responseCount > 0) {
                                throw new common_1.BadRequestException('Cannot delete questionnaire with responses. Consider deactivating it instead.');
                            }
                            return [2 /*return*/, this.questionnairesRepository.remove(questionnaire)];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.activate = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check if user can modify this questionnaire
                            this.checkQuestionnaireModificationAccess(questionnaire, user);
                            questionnaire.isActive = true;
                            return [2 /*return*/, this.questionnairesRepository.save(questionnaire)];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.deactivate = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check if user can modify this questionnaire
                            this.checkQuestionnaireModificationAccess(questionnaire, user);
                            questionnaire.isActive = false;
                            return [2 /*return*/, this.questionnairesRepository.save(questionnaire)];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.getResponses = function (id, params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check permissions
                            this.checkQuestionnaireAccess(questionnaire, user);
                            // In a real implementation, this would fetch responses from a separate service
                            // For now, return empty response
                            return [2 /*return*/, __assign({ questionnaireId: id, responses: [], total: 0 }, params)];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.getAnalytics = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, responseRate, averageCompletionTime, completionRate, questionAnalytics;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _b.sent();
                            // Check permissions
                            this.checkQuestionnaireAccess(questionnaire, user);
                            responseRate = questionnaire.responseCount > 0
                                ? (questionnaire.responseCount / 100) * 100 // This would be calculated based on target audience
                                : 0;
                            averageCompletionTime = 0;
                            completionRate = 0;
                            questionAnalytics = ((_a = questionnaire.questions) === null || _a === void 0 ? void 0 : _a.map(function (question) {
                                var _a;
                                return ({
                                    questionId: question.id,
                                    questionText: question.text,
                                    type: question.type,
                                    responseCount: 0,
                                    averageRating: 0,
                                    options: (_a = question.options) === null || _a === void 0 ? void 0 : _a.map(function (option) { return ({
                                        option: option,
                                        count: 0,
                                        percentage: 0,
                                    }); }),
                                });
                            })) || [];
                            return [2 /*return*/, {
                                    questionnaireId: id,
                                    title: questionnaire.title,
                                    totalResponses: questionnaire.responseCount,
                                    responseRate: responseRate,
                                    averageCompletionTime: averageCompletionTime,
                                    completionRate: completionRate,
                                    questionAnalytics: questionAnalytics,
                                    updatedAt: new Date(),
                                }];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.getShareLink = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, shareToken, shareLink;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check permissions
                            this.checkQuestionnaireAccess(questionnaire, user);
                            if (!questionnaire.isActive) {
                                throw new common_1.BadRequestException('Cannot share inactive questionnaire');
                            }
                            shareToken = this.generateShareToken();
                            shareLink = "".concat(process.env.FRONTEND_URL, "/questionnaires/").concat(id, "/share/").concat(shareToken);
                            return [2 /*return*/, {
                                    questionnaireId: id,
                                    shareToken: shareToken,
                                    shareLink: shareLink,
                                    expiresAt: questionnaire.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                                    isActive: questionnaire.isActive,
                                }];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.duplicate = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, duplicatedQuestionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _a.sent();
                            // Check permissions
                            this.checkQuestionnaireAccess(questionnaire, user);
                            duplicatedQuestionnaire = this.questionnairesRepository.create(__assign(__assign({}, questionnaire), { id: undefined, title: "".concat(questionnaire.title, " (Copy)"), responseCount: 0, createdAt: new Date(), updatedAt: new Date(), createdBy: user.id }));
                            return [2 /*return*/, this.questionnairesRepository.save(duplicatedQuestionnaire)];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.getQuestions = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            questionnaire = _b.sent();
                            // Check permissions
                            this.checkQuestionnaireAccess(questionnaire, user);
                            return [2 /*return*/, {
                                    questionnaireId: id,
                                    title: questionnaire.title,
                                    questions: questionnaire.questions || [],
                                    totalQuestions: ((_a = questionnaire.questions) === null || _a === void 0 ? void 0 : _a.length) || 0,
                                }];
                    }
                });
            });
        };
        QuestionnairesService_1.prototype.checkQuestionnaireAccess = function (questionnaire, user) {
            // Super admin can access all questionnaires
            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                return;
            }
            // Organization admin and users can only access questionnaires from their organization
            if (questionnaire.organizationId === user.organizationId) {
                return;
            }
            throw new common_1.ForbiddenException('Access denied');
        };
        QuestionnairesService_1.prototype.checkQuestionnaireModificationAccess = function (questionnaire, user) {
            // Super admin can modify all questionnaires
            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                return;
            }
            // Organization admin can modify questionnaires from their organization
            if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                questionnaire.organizationId === user.organizationId) {
                return;
            }
            // Regular users can only modify questionnaires they created
            if (user.role === constants_1.UserRole.USER &&
                questionnaire.createdBy === user.id &&
                questionnaire.organizationId === user.organizationId) {
                return;
            }
            throw new common_1.ForbiddenException('You do not have permission to modify this questionnaire');
        };
        QuestionnairesService_1.prototype.generateShareToken = function () {
            var length = 32;
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var token = '';
            for (var i = 0; i < length; i++) {
                token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return token;
        };
        return QuestionnairesService_1;
    }());
    __setFunctionName(_classThis, "QuestionnairesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuestionnairesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuestionnairesService = _classThis;
}();
exports.QuestionnairesService = QuestionnairesService;
