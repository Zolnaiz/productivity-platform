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
exports.ReportsService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("typeorm");
var report_entity_1 = require("../shared/entities/report.entity");
var scoring_utils_1 = require("../shared/utils/scoring.utils");
var ReportsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ReportsService = _classThis = /** @class */ (function () {
        function ReportsService_1(reportRepository, questionnaireRepository, expenseRepository, responseRepository) {
            this.reportRepository = reportRepository;
            this.questionnaireRepository = questionnaireRepository;
            this.expenseRepository = expenseRepository;
            this.responseRepository = responseRepository;
        }
        ReportsService_1.prototype.findAll = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var page, limit, type, skip, where, _a, reports, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            page = options.page, limit = options.limit, type = options.type;
                            skip = (page - 1) * limit;
                            where = {};
                            if (type) {
                                where.type = type;
                            }
                            return [4 /*yield*/, this.reportRepository.findAndCount({
                                    where: where,
                                    relations: ['generatedBy', 'organization'],
                                    order: { createdAt: 'DESC' },
                                    skip: skip,
                                    take: limit,
                                })];
                        case 1:
                            _a = _b.sent(), reports = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    reports: reports,
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    totalPages: Math.ceil(total / limit),
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var report;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.reportRepository.findOne({
                                where: { id: id },
                                relations: ['generatedBy', 'organization', 'questionnaire'],
                            })];
                        case 1:
                            report = _a.sent();
                            if (!report) {
                                throw new common_1.NotFoundException("\u0422\u0430\u0439\u043B\u0430\u043D \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439: ".concat(id));
                            }
                            return [2 /*return*/, report];
                    }
                });
            });
        };
        ReportsService_1.prototype.generateReport = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var type, organizationId, startDate, endDate, questionnaireId, generatedBy, data, title, description, _a, questionnaire, report;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            type = dto.type, organizationId = dto.organizationId, startDate = dto.startDate, endDate = dto.endDate, questionnaireId = dto.questionnaireId, generatedBy = dto.generatedBy;
                            _a = type;
                            switch (_a) {
                                case report_entity_1.ReportType.QUESTIONNAIRE: return [3 /*break*/, 1];
                                case report_entity_1.ReportType.EXPENSE: return [3 /*break*/, 4];
                                case report_entity_1.ReportType.COMBINED: return [3 /*break*/, 6];
                            }
                            return [3 /*break*/, 8];
                        case 1: return [4 /*yield*/, this.generateQuestionnaireReport(questionnaireId, organizationId, startDate, endDate)];
                        case 2:
                            data = _b.sent();
                            return [4 /*yield*/, this.questionnaireRepository.findOne({ where: { id: questionnaireId } })];
                        case 3:
                            questionnaire = _b.sent();
                            title = "\u0410\u0441\u0443\u0443\u043B\u0433\u044B\u043D \u0442\u0430\u0439\u043B\u0430\u043D: ".concat((questionnaire === null || questionnaire === void 0 ? void 0 : questionnaire.title) || questionnaireId);
                            description = "".concat(startDate, " - ").concat(endDate, " \u0445\u043E\u043E\u0440\u043E\u043D\u0434\u044B\u043D \u0430\u0441\u0443\u0443\u043B\u0433\u044B\u043D \u0442\u0430\u0439\u043B\u0430\u043D");
                            return [3 /*break*/, 9];
                        case 4: return [4 /*yield*/, this.generateExpenseReport(organizationId, startDate, endDate)];
                        case 5:
                            data = _b.sent();
                            title = "\u0417\u0430\u0440\u0434\u043B\u044B\u043D \u0442\u0430\u0439\u043B\u0430\u043D: ".concat(organizationId);
                            description = "".concat(startDate, " - ").concat(endDate, " \u0445\u043E\u043E\u0440\u043E\u043D\u0434\u044B\u043D \u0437\u0430\u0440\u0434\u043B\u044B\u043D \u0442\u0430\u0439\u043B\u0430\u043D");
                            return [3 /*break*/, 9];
                        case 6: return [4 /*yield*/, this.generateCombinedReport(organizationId, startDate, endDate)];
                        case 7:
                            data = _b.sent();
                            title = "\u041D\u0438\u0439\u0442 \u0442\u0430\u0439\u043B\u0430\u043D: ".concat(organizationId);
                            description = "".concat(startDate, " - ").concat(endDate, " \u0445\u043E\u043E\u0440\u043E\u043D\u0434\u044B\u043D \u043D\u0438\u0439\u0442 \u0442\u0430\u0439\u043B\u0430\u043D");
                            return [3 /*break*/, 9];
                        case 8: throw new common_1.BadRequestException('Тайлангийн төрөл буруу байна');
                        case 9:
                            report = this.reportRepository.create({
                                type: type,
                                title: title,
                                description: description,
                                data: data,
                                organizationId: organizationId,
                                generatedById: generatedBy,
                                status: report_entity_1.ReportStatus.COMPLETED,
                                parameters: {
                                    startDate: startDate,
                                    endDate: endDate,
                                    organizationId: organizationId,
                                    questionnaireId: questionnaireId,
                                },
                            });
                            return [2 /*return*/, this.reportRepository.save(report)];
                    }
                });
            });
        };
        ReportsService_1.prototype.generateQuickReport = function (filterDto) {
            return __awaiter(this, void 0, void 0, function () {
                var organizationId, startDate, endDate, category, _a, questionnaires, expenses, responses, totalExpenses, avgResponseScore;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            organizationId = filterDto.organizationId, startDate = filterDto.startDate, endDate = filterDto.endDate, category = filterDto.category;
                            return [4 /*yield*/, Promise.all([
                                    this.questionnaireRepository.find({
                                        where: {
                                            organizationId: organizationId,
                                            createdAt: (0, typeorm_1.Between)(new Date(startDate), new Date(endDate)),
                                        },
                                        relations: ['responses'],
                                    }),
                                    this.expenseRepository.find({
                                        where: __assign({ organizationId: organizationId, expenseDate: (0, typeorm_1.Between)(new Date(startDate), new Date(endDate)) }, (category ? { category: category } : {})),
                                    }),
                                    this.responseRepository.find({
                                        where: {
                                            organizationId: organizationId,
                                            submittedAt: (0, typeorm_1.Between)(new Date(startDate), new Date(endDate)),
                                        },
                                    }),
                                ])];
                        case 1:
                            _a = _b.sent(), questionnaires = _a[0], expenses = _a[1], responses = _a[2];
                            totalExpenses = expenses.reduce(function (sum, expense) { return sum + Number(expense.amount); }, 0);
                            avgResponseScore = responses.length > 0
                                ? responses.reduce(function (sum, response) { return sum + (response.score || 0); }, 0) / responses.length
                                : 0;
                            return [2 /*return*/, {
                                    period: { startDate: startDate, endDate: endDate },
                                    summary: {
                                        totalQuestionnaires: questionnaires.length,
                                        totalResponses: responses.length,
                                        totalExpenses: expenses.length,
                                        totalExpenseAmount: totalExpenses,
                                        averageScore: avgResponseScore,
                                        completionRate: questionnaires.length > 0
                                            ? (responses.length / questionnaires.length) * 100
                                            : 0,
                                    },
                                    breakdown: {
                                        byExpenseCategory: this.groupExpensesByCategory(expenses),
                                        byQuestionnaire: questionnaires.map(function (q) { return ({
                                            id: q.id,
                                            title: q.title,
                                            responseCount: q.responses.length,
                                            averageScore: q.responses.length > 0
                                                ? q.responses.reduce(function (sum, r) { return sum + (r.score || 0); }, 0) / q.responses.length
                                                : 0,
                                        }); }),
                                    },
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.getDashboardSummary = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, questionnaires, expenses, responses, recentExpenses, monthlyExpenses, topQuestionnaires;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.questionnaireRepository.find({
                                    where: { isActive: true },
                                    relations: ['responses'],
                                }),
                                this.expenseRepository.find(),
                                this.responseRepository.find(),
                            ])];
                        case 1:
                            _a = _b.sent(), questionnaires = _a[0], expenses = _a[1], responses = _a[2];
                            recentExpenses = expenses
                                .sort(function (a, b) { return b.expenseDate.getTime() - a.expenseDate.getTime(); })
                                .slice(0, 5);
                            monthlyExpenses = this.calculateMonthlyExpenses(expenses);
                            topQuestionnaires = questionnaires
                                .sort(function (a, b) { return b.responses.length - a.responses.length; })
                                .slice(0, 5);
                            return [2 /*return*/, {
                                    totals: {
                                        questionnaires: questionnaires.length,
                                        expenses: expenses.length,
                                        responses: responses.length,
                                        totalExpenseAmount: expenses.reduce(function (sum, expense) { return sum + Number(expense.amount); }, 0),
                                    },
                                    recentActivity: {
                                        recentExpenses: recentExpenses,
                                        topQuestionnaires: topQuestionnaires,
                                        recentResponses: responses
                                            .sort(function (a, b) { return b.submittedAt.getTime() - a.submittedAt.getTime(); })
                                            .slice(0, 10)
                                            .map(function (r) { return ({
                                            id: r.id,
                                            questionnaireId: r.questionnaireId,
                                            score: r.score,
                                            submittedAt: r.submittedAt,
                                        }); }),
                                    },
                                    charts: {
                                        monthlyExpenses: monthlyExpenses,
                                        expenseByCategory: this.groupExpensesByCategory(expenses),
                                        responseTrends: this.calculateResponseTrends(responses),
                                    },
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.getOrganizationReports = function (organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var where, reports, expenses, totalExpense;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            where = { organizationId: organizationId };
                            if (startDate && endDate) {
                                where.createdAt = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
                            }
                            return [4 /*yield*/, this.reportRepository.find({
                                    where: where,
                                    relations: ['generatedBy'],
                                    order: { createdAt: 'DESC' },
                                })];
                        case 1:
                            reports = _a.sent();
                            return [4 /*yield*/, this.expenseRepository.find({
                                    where: __assign({ organizationId: organizationId }, (startDate && endDate ? {
                                        expenseDate: (0, typeorm_1.Between)(new Date(startDate), new Date(endDate)),
                                    } : {})),
                                    order: { expenseDate: 'DESC' },
                                })];
                        case 2:
                            expenses = _a.sent();
                            totalExpense = expenses.reduce(function (sum, expense) { return sum + Number(expense.amount); }, 0);
                            return [2 /*return*/, {
                                    reports: reports,
                                    financialSummary: {
                                        totalExpense: totalExpense,
                                        expenseCount: expenses.length,
                                        byCategory: this.groupExpensesByCategory(expenses),
                                        byStatus: this.groupExpensesByStatus(expenses),
                                    },
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.exportReport = function (id, format) {
            return __awaiter(this, void 0, void 0, function () {
                var report;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id)];
                        case 1:
                            report = _a.sent();
                            if (!['pdf', 'excel', 'csv'].includes(format)) {
                                throw new common_1.BadRequestException('Дэмжигдэхгүй формат: pdf, excel, csv зөвхөн');
                            }
                            // Export логик энд орно
                            return [2 /*return*/, {
                                    report: report,
                                    format: format,
                                    downloadUrl: "/api/reports/export/".concat(id, "/file.").concat(format),
                                    message: "".concat(format.toUpperCase(), " \u0444\u043E\u0440\u043C\u0430\u0442\u0442\u0430\u0439 \u0442\u0430\u0439\u043B\u0430\u043D \u0431\u044D\u043B\u044D\u043D \u0431\u043E\u043B\u043B\u043E\u043E"),
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.generateQuestionnaireReport = function (questionnaireId, organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaire, responses, analysis;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.questionnaireRepository.findOne({
                                where: { id: questionnaireId },
                                relations: ['questions', 'responses', 'responses.user'],
                            })];
                        case 1:
                            questionnaire = _a.sent();
                            if (!questionnaire) {
                                throw new common_1.NotFoundException("\u0410\u0441\u0443\u0443\u043B\u0433\u0430 \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439: ".concat(questionnaireId));
                            }
                            responses = questionnaire.responses.filter(function (response) {
                                return response.submittedAt >= new Date(startDate) &&
                                    response.submittedAt <= new Date(endDate) &&
                                    response.organizationId === organizationId;
                            });
                            analysis = scoring_utils_1.ScoringUtils.analyzeQuestionnaireResponses(questionnaire, responses);
                            return [2 /*return*/, {
                                    questionnaire: {
                                        id: questionnaire.id,
                                        title: questionnaire.title,
                                        description: questionnaire.description,
                                        questionCount: questionnaire.questions.length,
                                    },
                                    period: { startDate: startDate, endDate: endDate },
                                    responses: {
                                        total: responses.length,
                                        averageScore: analysis.averageScore,
                                        completionRate: analysis.completionRate,
                                        scoreDistribution: analysis.scoreDistribution,
                                    },
                                    detailedAnalysis: analysis.detailedAnalysis,
                                    recommendations: analysis.recommendations,
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.generateExpenseReport = function (organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var expenses, totalAmount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.expenseRepository.find({
                                where: {
                                    organizationId: organizationId,
                                    expenseDate: (0, typeorm_1.Between)(new Date(startDate), new Date(endDate)),
                                },
                                relations: ['creator', 'approver', 'questionnaire'],
                                order: { expenseDate: 'DESC' },
                            })];
                        case 1:
                            expenses = _a.sent();
                            totalAmount = expenses.reduce(function (sum, expense) { return sum + Number(expense.amount); }, 0);
                            return [2 /*return*/, {
                                    period: { startDate: startDate, endDate: endDate },
                                    summary: {
                                        totalExpenses: expenses.length,
                                        totalAmount: totalAmount,
                                        averageExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
                                    },
                                    breakdown: {
                                        byCategory: this.groupExpensesByCategory(expenses),
                                        byStatus: this.groupExpensesByStatus(expenses),
                                        monthly: this.calculateMonthlyExpenses(expenses),
                                    },
                                    topExpenses: expenses
                                        .sort(function (a, b) { return Number(b.amount) - Number(a.amount); })
                                        .slice(0, 10)
                                        .map(function (expense) { return ({
                                        id: expense.id,
                                        name: expense.name,
                                        amount: expense.amount,
                                        category: expense.category,
                                        date: expense.expenseDate,
                                    }); }),
                                    detailedList: expenses.map(function (expense) {
                                        var _a, _b;
                                        return ({
                                            id: expense.id,
                                            name: expense.name,
                                            description: expense.description,
                                            amount: expense.amount,
                                            category: expense.category,
                                            status: expense.status,
                                            date: expense.expenseDate,
                                            recipient: expense.recipientName,
                                            createdBy: (_a = expense.creator) === null || _a === void 0 ? void 0 : _a.email,
                                            approvedBy: (_b = expense.approver) === null || _b === void 0 ? void 0 : _b.email,
                                        });
                                    }),
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.generateCombinedReport = function (organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, questionnaireReport, expenseReport;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.generateQuestionnaireReportForOrganization(organizationId, startDate, endDate),
                                this.generateExpenseReport(organizationId, startDate, endDate),
                            ])];
                        case 1:
                            _a = _b.sent(), questionnaireReport = _a[0], expenseReport = _a[1];
                            return [2 /*return*/, {
                                    period: { startDate: startDate, endDate: endDate },
                                    questionnaireAnalysis: questionnaireReport,
                                    financialAnalysis: expenseReport,
                                    overallAssessment: this.calculateOverallAssessment(questionnaireReport, expenseReport),
                                    kpis: this.calculateKPIs(questionnaireReport, expenseReport),
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.generateQuestionnaireReportForOrganization = function (organizationId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var questionnaires, allResponses, totalResponses, avgScore;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.questionnaireRepository.find({
                                where: {
                                    organizationId: organizationId,
                                    createdAt: (0, typeorm_1.Between)(new Date(startDate), new Date(endDate)),
                                },
                                relations: ['responses'],
                            })];
                        case 1:
                            questionnaires = _a.sent();
                            allResponses = questionnaires.flatMap(function (q) { return q.responses; });
                            totalResponses = allResponses.length;
                            avgScore = totalResponses > 0
                                ? allResponses.reduce(function (sum, r) { return sum + (r.score || 0); }, 0) / totalResponses
                                : 0;
                            return [2 /*return*/, {
                                    totalQuestionnaires: questionnaires.length,
                                    totalResponses: totalResponses,
                                    averageScore: avgScore,
                                    completionRate: questionnaires.length > 0
                                        ? (totalResponses / questionnaires.length) * 100
                                        : 0,
                                    byQuestionnaire: questionnaires.map(function (q) { return ({
                                        id: q.id,
                                        title: q.title,
                                        responseCount: q.responses.length,
                                        averageScore: q.responses.length > 0
                                            ? q.responses.reduce(function (sum, r) { return sum + (r.score || 0); }, 0) / q.responses.length
                                            : 0,
                                    }); }),
                                }];
                    }
                });
            });
        };
        ReportsService_1.prototype.groupExpensesByCategory = function (expenses) {
            var result = {};
            expenses.forEach(function (expense) {
                if (!result[expense.category]) {
                    result[expense.category] = { count: 0, amount: 0 };
                }
                result[expense.category].count++;
                result[expense.category].amount += Number(expense.amount);
            });
            return result;
        };
        ReportsService_1.prototype.groupExpensesByStatus = function (expenses) {
            var result = {};
            expenses.forEach(function (expense) {
                if (!result[expense.status]) {
                    result[expense.status] = { count: 0, amount: 0 };
                }
                result[expense.status].count++;
                result[expense.status].amount += Number(expense.amount);
            });
            return result;
        };
        ReportsService_1.prototype.calculateMonthlyExpenses = function (expenses) {
            var result = {};
            expenses.forEach(function (expense) {
                var monthKey = "".concat(expense.expenseDate.getFullYear(), "-").concat((expense.expenseDate.getMonth() + 1)
                    .toString()
                    .padStart(2, '0'));
                if (!result[monthKey]) {
                    result[monthKey] = 0;
                }
                result[monthKey] += Number(expense.amount);
            });
            return result;
        };
        ReportsService_1.prototype.calculateResponseTrends = function (responses) {
            var result = {};
            responses.forEach(function (response) {
                var monthKey = "".concat(response.submittedAt.getFullYear(), "-").concat((response.submittedAt.getMonth() + 1)
                    .toString()
                    .padStart(2, '0'));
                if (!result[monthKey]) {
                    result[monthKey] = 0;
                }
                result[monthKey]++;
            });
            return result;
        };
        ReportsService_1.prototype.calculateOverallAssessment = function (qReport, eReport) {
            var financialHealth = this.assessFinancialHealth(eReport.summary.totalAmount);
            var engagementLevel = this.assessEngagementLevel(qReport.averageScore, qReport.completionRate);
            return {
                financialHealth: financialHealth,
                engagementLevel: engagementLevel,
                overallScore: (financialHealth.score + engagementLevel.score) / 2,
                recommendations: __spreadArray(__spreadArray([], financialHealth.recommendations, true), engagementLevel.recommendations, true),
            };
        };
        ReportsService_1.prototype.calculateKPIs = function (qReport, eReport) {
            return {
                costPerResponse: qReport.totalResponses > 0
                    ? eReport.summary.totalAmount / qReport.totalResponses
                    : 0,
                responseRate: qReport.completionRate,
                expenseEfficiency: this.calculateExpenseEfficiency(qReport, eReport),
                roi: this.calculateROI(qReport, eReport),
            };
        };
        ReportsService_1.prototype.assessFinancialHealth = function (totalExpenses) {
            var score = 100;
            var level = 'сайн';
            var recommendations = [];
            if (totalExpenses > 10000000) {
                score -= 30;
                level = 'анхаарал шаардсан';
                recommendations.push('Зардлыг бууруулах арга хэмжээ авна уу');
            }
            else if (totalExpenses > 5000000) {
                score -= 15;
                level = 'хэвийн';
                recommendations.push('Зардлын мониторинг хийх');
            }
            return { score: score, level: level, recommendations: recommendations };
        };
        ReportsService_1.prototype.assessEngagementLevel = function (avgScore, completionRate) {
            var score = (avgScore * 10 + completionRate) / 2;
            var level = '';
            if (score >= 80) {
                level = 'өндөр';
            }
            else if (score >= 60) {
                level = 'дунд';
            }
            else {
                level = 'бага';
            }
            var recommendations = [];
            if (completionRate < 50) {
                recommendations.push('Асуулгын оролцоог нэмэгдүүлэх арга хэмжээ авна уу');
            }
            if (avgScore < 6) {
                recommendations.push('Асуулгын агуулга, бүтцийг сайжруулах');
            }
            return { score: score, level: level, recommendations: recommendations };
        };
        ReportsService_1.prototype.calculateExpenseEfficiency = function (qReport, eReport) {
            if (qReport.totalResponses === 0)
                return 0;
            return eReport.summary.totalAmount / qReport.totalResponses;
        };
        ReportsService_1.prototype.calculateROI = function (qReport, eReport) {
            if (eReport.summary.totalAmount === 0)
                return 0;
            return (qReport.averageScore * 10000) / eReport.summary.totalAmount;
        };
        return ReportsService_1;
    }());
    __setFunctionName(_classThis, "ReportsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ReportsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ReportsService = _classThis;
}();
exports.ReportsService = ReportsService;
