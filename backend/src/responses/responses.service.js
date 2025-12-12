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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsesService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("typeorm");
var constants_1 = require("../shared/constants");
var ResponsesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ResponsesService = _classThis = /** @class */ (function () {
        function ResponsesService_1(responsesRepository, questionnairesService) {
            this.responsesRepository = responsesRepository;
            this.questionnairesService = questionnairesService;
        }
        ResponsesService_1.prototype.create = function (createResponseDto, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, existingResponse, completionTimeSeconds, response, savedResponse;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                where: { id: createResponseDto.questionnaireId },
                            })];
                        case 1:
                            questionnaire = _b.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            // Check permissions
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                questionnaire.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            // Check if questionnaire is active and not expired
                            if (!questionnaire.isActive || questionnaire.isExpired) {
                                throw new common_1.BadRequestException('Questionnaire is not active or has expired');
                            }
                            if (!((_a = questionnaire.settings) === null || _a === void 0 ? void 0 : _a.requireUniqueResponse)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.responsesRepository.findOne({
                                    where: {
                                        questionnaireId: createResponseDto.questionnaireId,
                                        userId: user.id,
                                    },
                                })];
                        case 2:
                            existingResponse = _b.sent();
                            if (existingResponse) {
                                throw new common_1.BadRequestException('You have already submitted a response to this questionnaire');
                            }
                            _b.label = 3;
                        case 3:
                            // Validate answers against questions
                            this.validateAnswers(createResponseDto.answers, questionnaire.questions);
                            if (createResponseDto.completionTime) {
                                completionTimeSeconds = Math.floor(createResponseDto.completionTime / 1000);
                            }
                            response = this.responsesRepository.create(__assign(__assign({}, createResponseDto), { userId: user.id, organizationId: questionnaire.organizationId, completionTime: completionTimeSeconds }));
                            return [4 /*yield*/, this.responsesRepository.save(response)];
                        case 4:
                            savedResponse = _b.sent();
                            // Update questionnaire response count
                            return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].increment({ id: questionnaire.id }, 'responseCount', 1)];
                        case 5:
                            // Update questionnaire response count
                            _b.sent();
                            return [2 /*return*/, savedResponse];
                    }
                });
            });
        };
        ResponsesService_1.prototype.findAll = function (params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, questionnaireId, organizationId, userId, startDate, endDate, skip, query, total, responses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            page = params.page, limit = params.limit, questionnaireId = params.questionnaireId, organizationId = params.organizationId, userId = params.userId, startDate = params.startDate, endDate = params.endDate;
                            skip = (page - 1) * limit;
                            query = this.responsesRepository
                                .createQueryBuilder('response')
                                .leftJoinAndSelect('response.questionnaire', 'questionnaire')
                                .leftJoinAndSelect('response.user', 'user')
                                .leftJoinAndSelect('response.organization', 'organization');
                            // Apply filters based on user role
                            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                                // Super admin can see all responses
                                if (organizationId) {
                                    query.andWhere('response.organizationId = :organizationId', {
                                        organizationId: organizationId,
                                    });
                                }
                            }
                            else if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN) {
                                // Organization admin can only see responses from their organization
                                query.andWhere('response.organizationId = :organizationId', {
                                    organizationId: user.organizationId,
                                });
                            }
                            else {
                                // Regular users can only see their own responses
                                query.andWhere('response.userId = :userId', { userId: user.id });
                            }
                            // Apply additional filters
                            if (questionnaireId) {
                                query.andWhere('response.questionnaireId = :questionnaireId', {
                                    questionnaireId: questionnaireId,
                                });
                            }
                            if (userId && (user.role === constants_1.UserRole.SUPER_ADMIN || user.role === constants_1.UserRole.ORGANIZATION_ADMIN)) {
                                query.andWhere('response.userId = :userId', { userId: userId });
                            }
                            if (startDate) {
                                query.andWhere('response.submittedAt >= :startDate', { startDate: new Date(startDate) });
                            }
                            if (endDate) {
                                query.andWhere('response.submittedAt <= :endDate', { endDate: new Date(endDate) });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('response.submittedAt', 'DESC')
                                    .getMany()];
                        case 2:
                            responses = _a.sent();
                            return [2 /*return*/, {
                                    data: responses,
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
        ResponsesService_1.prototype.findOne = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.responsesRepository.findOne({
                                where: { id: id },
                                relations: ['questionnaire', 'user', 'organization'],
                            })];
                        case 1:
                            response = _a.sent();
                            if (!response) {
                                throw new common_1.NotFoundException("Response with ID ".concat(id, " not found"));
                            }
                            // Check permissions
                            this.checkResponseAccess(response, user);
                            return [2 /*return*/, response];
                    }
                });
            });
        };
        ResponsesService_1.prototype.findByQuestionnaire = function (questionnaireId, params, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, page, limit, skip, query, total, responses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                where: { id: questionnaireId },
                            })];
                        case 1:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            // Check permissions
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                questionnaire.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            page = params.page, limit = params.limit;
                            skip = (page - 1) * limit;
                            query = this.responsesRepository
                                .createQueryBuilder('response')
                                .leftJoinAndSelect('response.user', 'user')
                                .where('response.questionnaireId = :questionnaireId', { questionnaireId: questionnaireId });
                            return [4 /*yield*/, query.getCount()];
                        case 2:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('response.submittedAt', 'DESC')
                                    .getMany()];
                        case 3:
                            responses = _a.sent();
                            return [2 /*return*/, {
                                    data: responses,
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
        ResponsesService_1.prototype.findByUser = function (userId, params, currentUser) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, skip, query, total, responses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Check permissions
                            if (currentUser.role !== constants_1.UserRole.SUPER_ADMIN &&
                                currentUser.role !== constants_1.UserRole.ORGANIZATION_ADMIN &&
                                currentUser.id !== userId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            page = params.page, limit = params.limit;
                            skip = (page - 1) * limit;
                            query = this.responsesRepository
                                .createQueryBuilder('response')
                                .leftJoinAndSelect('response.questionnaire', 'questionnaire')
                                .where('response.userId = :userId', { userId: userId });
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('response.submittedAt', 'DESC')
                                    .getMany()];
                        case 2:
                            responses = _a.sent();
                            return [2 /*return*/, {
                                    data: responses,
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
        ResponsesService_1.prototype.findMyResponses = function (params, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.findByUser(user.id, params, user)];
                });
            });
        };
        ResponsesService_1.prototype.update = function (id, updateResponseDto, user) {
            return __awaiter(this, void 0, void 0, function () {
                var response, questionnaire;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            response = _a.sent();
                            // Check permissions - only super admin and organization admin can update responses
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN && user.role !== constants_1.UserRole.ORGANIZATION_ADMIN) {
                                throw new common_1.ForbiddenException('You do not have permission to update responses');
                            }
                            return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                    where: { id: response.questionnaireId },
                                })];
                        case 2:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            // Validate answers if provided
                            if (updateResponseDto.answers) {
                                this.validateAnswers(updateResponseDto.answers, questionnaire.questions);
                            }
                            Object.assign(response, updateResponseDto);
                            return [2 /*return*/, this.responsesRepository.save(response)];
                    }
                });
            });
        };
        ResponsesService_1.prototype.remove = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            response = _a.sent();
                            // Check permissions - only super admin and organization admin can delete responses
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN && user.role !== constants_1.UserRole.ORGANIZATION_ADMIN) {
                                throw new common_1.ForbiddenException('You do not have permission to delete responses');
                            }
                            // Decrement questionnaire response count
                            return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].decrement({ id: response.questionnaireId }, 'responseCount', 1)];
                        case 2:
                            // Decrement questionnaire response count
                            _a.sent();
                            return [2 /*return*/, this.responsesRepository.remove(response)];
                    }
                });
            });
        };
        ResponsesService_1.prototype.getAnalysis = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var response, questionnaire, totalQuestions, answeredQuestions, completionPercentage, totalTextLength, textQuestionCount, averageTextLength;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                    where: { id: response.questionnaireId },
                                })];
                        case 2:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            totalQuestions = questionnaire.questions.length;
                            answeredQuestions = response.answers.length;
                            completionPercentage = totalQuestions > 0
                                ? (answeredQuestions / totalQuestions) * 100
                                : 0;
                            totalTextLength = 0;
                            textQuestionCount = 0;
                            response.answers.forEach(function (answer) {
                                var question = questionnaire.questions.find(function (q) { return q.id === answer.questionId; });
                                if (question && question.type === 'text' && typeof answer.value === 'string') {
                                    totalTextLength += answer.value.length;
                                    textQuestionCount++;
                                }
                            });
                            averageTextLength = textQuestionCount > 0
                                ? totalTextLength / textQuestionCount
                                : 0;
                            return [2 /*return*/, {
                                    responseId: id,
                                    questionnaireId: response.questionnaireId,
                                    questionnaireTitle: questionnaire.title,
                                    userId: response.userId,
                                    submittedAt: response.submittedAt,
                                    completionTime: response.completionTime,
                                    totalQuestions: totalQuestions,
                                    answeredQuestions: answeredQuestions,
                                    completionPercentage: completionPercentage,
                                    averageTextLength: averageTextLength,
                                    answers: response.answers.map(function (answer) {
                                        var question = questionnaire.questions.find(function (q) { return q.id === answer.questionId; });
                                        return {
                                            questionId: answer.questionId,
                                            questionText: (question === null || question === void 0 ? void 0 : question.text) || 'Unknown question',
                                            questionType: question === null || question === void 0 ? void 0 : question.type,
                                            answer: answer.value,
                                            answeredAt: answer.answeredAt,
                                        };
                                    }),
                                }];
                    }
                });
            });
        };
        ResponsesService_1.prototype.exportResponses = function (questionnaireId, format, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, responses, questions, exportData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                where: { id: questionnaireId },
                            })];
                        case 1:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            // Check permissions
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                questionnaire.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            return [4 /*yield*/, this.responsesRepository.find({
                                    where: { questionnaireId: questionnaireId },
                                    relations: ['user'],
                                    order: { submittedAt: 'DESC' },
                                })];
                        case 2:
                            responses = _a.sent();
                            questions = questionnaire.questions;
                            switch (format) {
                                case 'csv':
                                    exportData = this.formatAsCSV(responses, questions);
                                    break;
                                case 'excel':
                                    exportData = this.formatAsExcel(responses, questions);
                                    break;
                                case 'json':
                                default:
                                    exportData = this.formatAsJSON(responses, questions);
                                    break;
                            }
                            return [2 /*return*/, {
                                    questionnaireId: questionnaireId,
                                    questionnaireTitle: questionnaire.title,
                                    format: format,
                                    totalResponses: responses.length,
                                    generatedAt: new Date(),
                                    data: exportData,
                                }];
                    }
                });
            });
        };
        ResponsesService_1.prototype.getQuestionnaireSummary = function (questionnaireId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, responseStats, avgCompletionTime, byDayOfWeek, _a;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                where: { id: questionnaireId },
                            })];
                        case 1:
                            questionnaire = _c.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            // Check permissions
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                questionnaire.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            return [4 /*yield*/, this.responsesRepository
                                    .createQueryBuilder('response')
                                    .select('DATE(response.submittedAt)', 'date')
                                    .addSelect('COUNT(response.id)', 'count')
                                    .where('response.questionnaireId = :questionnaireId', { questionnaireId: questionnaireId })
                                    .groupBy('DATE(response.submittedAt)')
                                    .orderBy('date', 'DESC')
                                    .limit(30)
                                    .getRawMany()];
                        case 2:
                            responseStats = _c.sent();
                            return [4 /*yield*/, this.responsesRepository
                                    .createQueryBuilder('response')
                                    .select('AVG(response.completionTime)', 'average')
                                    .where('response.questionnaireId = :questionnaireId', { questionnaireId: questionnaireId })
                                    .andWhere('response.completionTime IS NOT NULL')
                                    .getRawOne()];
                        case 3:
                            avgCompletionTime = _c.sent();
                            return [4 /*yield*/, this.responsesRepository
                                    .createQueryBuilder('response')
                                    .select('EXTRACT(DOW FROM response.submittedAt)', 'dayOfWeek')
                                    .addSelect('COUNT(response.id)', 'count')
                                    .where('response.questionnaireId = :questionnaireId', { questionnaireId: questionnaireId })
                                    .groupBy('EXTRACT(DOW FROM response.submittedAt)')
                                    .getRawMany()];
                        case 4:
                            byDayOfWeek = _c.sent();
                            _b = {
                                questionnaireId: questionnaireId,
                                questionnaireTitle: questionnaire.title,
                                totalResponses: questionnaire.responseCount,
                                responseStats: responseStats,
                                averageCompletionTime: parseFloat(avgCompletionTime === null || avgCompletionTime === void 0 ? void 0 : avgCompletionTime.average) || 0,
                                byDayOfWeek: byDayOfWeek
                            };
                            if (!(questionnaire.responseCount > 0)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.responsesRepository.findOne({
                                    where: { questionnaireId: questionnaireId },
                                    order: { submittedAt: 'DESC' },
                                })];
                        case 5:
                            _a = _c.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            _a = null;
                            _c.label = 7;
                        case 7: return [2 /*return*/, (_b.lastResponse = _a,
                                _b)];
                    }
                });
            });
        };
        ResponsesService_1.prototype.bulkDelete = function (questionnaireId, responseIds, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].findOne({
                                where: { id: questionnaireId },
                            })];
                        case 1:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException('Questionnaire not found');
                            }
                            // Check permissions
                            if (user.role !== constants_1.UserRole.SUPER_ADMIN &&
                                questionnaire.organizationId !== user.organizationId) {
                                throw new common_1.ForbiddenException('Access denied');
                            }
                            return [4 /*yield*/, this.responsesRepository.delete({
                                    id: (0, typeorm_1.In)(responseIds),
                                    questionnaireId: questionnaireId,
                                })];
                        case 2:
                            result = _a.sent();
                            if (!(result.affected && result.affected > 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.questionnairesService['questionnairesRepository'].decrement({ id: questionnaireId }, 'responseCount', result.affected)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/, {
                                message: "".concat(result.affected, " responses deleted successfully"),
                                deletedCount: result.affected,
                            }];
                    }
                });
            });
        };
        ResponsesService_1.prototype.checkResponseAccess = function (response, user) {
            // Super admin can access all responses
            if (user.role === constants_1.UserRole.SUPER_ADMIN) {
                return;
            }
            // Organization admin can access responses from their organization
            if (user.role === constants_1.UserRole.ORGANIZATION_ADMIN &&
                response.organizationId === user.organizationId) {
                return;
            }
            // Regular users can only access their own responses
            if (user.role === constants_1.UserRole.USER && response.userId === user.id) {
                return;
            }
            throw new common_1.ForbiddenException('Access denied');
        };
        ResponsesService_1.prototype.validateAnswers = function (answers, questions) {
            var _loop_1 = function (answer) {
                var question = questions.find(function (q) { return q.id === answer.questionId; });
                if (!question) {
                    throw new common_1.BadRequestException("Question with ID ".concat(answer.questionId, " not found"));
                }
                // Check if answer is required
                if (question.isRequired && (answer.value === undefined || answer.value === null || answer.value === '')) {
                    throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" is required"));
                }
                // Validate answer based on question type
                switch (question.type) {
                    case 'multiple_choice':
                        if (!Array.isArray(answer.value)) {
                            throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" must be an array"));
                        }
                        if (question.options && answer.value.some(function (val) { var _a; return !((_a = question.options) === null || _a === void 0 ? void 0 : _a.includes(val)); })) {
                            throw new common_1.BadRequestException("Invalid choice for question \"".concat(question.text, "\""));
                        }
                        break;
                    case 'single_choice':
                        if (question.options && !question.options.includes(answer.value)) {
                            throw new common_1.BadRequestException("Invalid choice for question \"".concat(question.text, "\""));
                        }
                        break;
                    case 'rating':
                    case 'number':
                        var numValue = Number(answer.value);
                        if (isNaN(numValue)) {
                            throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" must be a number"));
                        }
                        if (question.minValue !== undefined && numValue < question.minValue) {
                            throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" must be at least ").concat(question.minValue));
                        }
                        if (question.maxValue !== undefined && numValue > question.maxValue) {
                            throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" must be at most ").concat(question.maxValue));
                        }
                        break;
                    case 'date':
                        if (isNaN(Date.parse(answer.value))) {
                            throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" must be a valid date"));
                        }
                        break;
                    case 'text':
                        if (typeof answer.value !== 'string') {
                            throw new common_1.BadRequestException("Answer for question \"".concat(question.text, "\" must be text"));
                        }
                        break;
                }
            };
            for (var _i = 0, answers_1 = answers; _i < answers_1.length; _i++) {
                var answer = answers_1[_i];
                _loop_1(answer);
            }
        };
        ResponsesService_1.prototype.formatAsCSV = function (responses, questions) {
            var _this = this;
            // Create headers
            var headers = ['Response ID', 'User', 'Submitted At', 'Completion Time (s)'];
            questions.forEach(function (q) {
                headers.push("Q: ".concat(q.text));
            });
            // Create rows
            var rows = responses.map(function (response) {
                var _a;
                var row = [
                    response.id,
                    ((_a = response.user) === null || _a === void 0 ? void 0 : _a.email) || 'Anonymous',
                    response.submittedAt.toISOString(),
                    response.completionTime || 'N/A',
                ];
                // Add answers
                questions.forEach(function (question) {
                    var answer = response.answers.find(function (a) { return a.questionId === question.id; });
                    row.push(answer ? _this.formatAnswerValue(answer.value) : '');
                });
                return row.join(',');
            });
            return __spreadArray([headers.join(',')], rows, true).join('\n');
        };
        ResponsesService_1.prototype.formatAsExcel = function (responses, questions) {
            // This would generate Excel file in a real implementation
            // For now, return the same data as CSV but indicate Excel format
            return {
                format: 'excel',
                data: this.formatAsCSV(responses, questions),
                fileName: "responses_".concat(Date.now(), ".xlsx"),
            };
        };
        ResponsesService_1.prototype.formatAsJSON = function (responses, questions) {
            return responses.map(function (response) {
                var _a;
                return ({
                    id: response.id,
                    questionnaireId: response.questionnaireId,
                    userId: response.userId,
                    userEmail: (_a = response.user) === null || _a === void 0 ? void 0 : _a.email,
                    submittedAt: response.submittedAt,
                    completionTime: response.completionTime,
                    metadata: response.metadata,
                    answers: response.answers.map(function (answer) {
                        var question = questions.find(function (q) { return q.id === answer.questionId; });
                        return {
                            questionId: answer.questionId,
                            questionText: question === null || question === void 0 ? void 0 : question.text,
                            questionType: question === null || question === void 0 ? void 0 : question.type,
                            value: answer.value,
                            answeredAt: answer.answeredAt,
                        };
                    }),
                });
            });
        };
        ResponsesService_1.prototype.formatAnswerValue = function (value) {
            if (Array.isArray(value)) {
                return value.join('; ');
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            return String(value);
        };
        return ResponsesService_1;
    }());
    __setFunctionName(_classThis, "ResponsesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ResponsesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ResponsesService = _classThis;
}();
exports.ResponsesService = ResponsesService;
