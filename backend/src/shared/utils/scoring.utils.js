"use strict";
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
exports.ScoringUtils = void 0;
var ScoringUtils = /** @class */ (function () {
    function ScoringUtils() {
    }
    /**
     * Асуулгын хариултыг оноо өгөх
     */
    ScoringUtils.calculateScore = function (questionnaire, answers) {
        if (!questionnaire.scoring) {
            return {
                score: 0,
                maxScore: 0,
                percentage: 0,
                detailedScores: [],
            };
        }
        var scoring = questionnaire.scoring;
        var totalScore = 0;
        var totalMaxScore = scoring.maxScore || 0;
        var detailedScores = [];
        // Хэрэв критери тодорхойлогдоогүй бол өгөх боломжгүй
        if (!scoring.criteria || scoring.criteria.length === 0) {
            return {
                score: 0,
                maxScore: totalMaxScore,
                percentage: 0,
                detailedScores: [],
            };
        }
        var _loop_1 = function (criterion) {
            var answer = answers.find(function (a) { return a.questionId === criterion.questionId; });
            var questionScore = this_1.evaluateAnswer(criterion, answer);
            totalScore += questionScore;
            detailedScores.push({
                questionId: criterion.questionId,
                score: questionScore,
                maxScore: criterion.weight || 1,
            });
        };
        var this_1 = this;
        // Асуулт бүрийн хариултыг шалгах
        for (var _i = 0, _a = scoring.criteria; _i < _a.length; _i++) {
            var criterion = _a[_i];
            _loop_1(criterion);
        }
        var percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
        return {
            score: totalScore,
            maxScore: totalMaxScore,
            percentage: percentage,
            detailedScores: detailedScores,
        };
    };
    /**
     * Хариултыг үнэлэх
     */
    ScoringUtils.evaluateAnswer = function (criterion, answer) {
        if (!answer)
            return 0;
        var _a = criterion.weight, weight = _a === void 0 ? 1 : _a, correctAnswers = criterion.correctAnswers;
        // Хэрэв зөв хариултууд тодорхойлогдоогүй бол дээд оноо өгөх
        if (!correctAnswers || correctAnswers.length === 0) {
            return weight;
        }
        // Төрөл бүрийн шалгуур
        switch (typeof answer.answer) {
            case 'string':
                // Текстэн хариулт
                return correctAnswers.includes(answer.answer) ? weight : 0;
            case 'number':
                // Тоон хариулт
                var numAnswer = answer.answer;
                if (correctAnswers.length === 1) {
                    // Яг ижил тоо
                    return correctAnswers[0] === numAnswer ? weight : 0;
                }
                else if (correctAnswers.length === 2) {
                    // Хугацааны интервал
                    var min = correctAnswers[0], max = correctAnswers[1];
                    return numAnswer >= min && numAnswer <= max ? weight : 0;
                }
                return 0;
            case 'boolean':
                // Boolean хариулт
                var boolAnswer = answer.answer;
                return correctAnswers.includes(boolAnswer.toString()) ? weight : 0;
            default:
                // Массив эсвэл бусад
                if (Array.isArray(answer.answer)) {
                    // Массив хариулт
                    var userAnswers_1 = answer.answer;
                    var allCorrect = correctAnswers.every(function (correct) {
                        return userAnswers_1.includes(correct);
                    });
                    return allCorrect ? weight : 0;
                }
                return 0;
        }
    };
    /**
     * Асуулгын хариултын статистик шинжилгээ
     */
    ScoringUtils.analyzeQuestionnaireResponses = function (questionnaire, responses) {
        var totalResponses = responses.length;
        var submittedResponses = responses.filter(function (r) { return r.status === 'submitted'; });
        // Нийт дүн
        var scores = submittedResponses.map(function (r) { return r.score || 0; });
        var averageScore = scores.length > 0
            ? scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length
            : 0;
        // Дуусах хувь
        var completionRate = totalResponses > 0
            ? (submittedResponses.length / totalResponses) * 100
            : 0;
        // Онооны тархалт
        var scoreDistribution = {};
        var scoreRanges = [
            { range: '0-20', min: 0, max: 20 },
            { range: '21-40', min: 21, max: 40 },
            { range: '41-60', min: 41, max: 60 },
            { range: '61-80', min: 61, max: 80 },
            { range: '81-100', min: 81, max: 100 },
        ];
        submittedResponses.forEach(function (response) {
            var percentage = response.percentage || 0;
            for (var _i = 0, scoreRanges_1 = scoreRanges; _i < scoreRanges_1.length; _i++) {
                var range = scoreRanges_1[_i];
                if (percentage >= range.min && percentage <= range.max) {
                    scoreDistribution[range.range] = (scoreDistribution[range.range] || 0) + 1;
                    break;
                }
            }
        });
        // Асуулт бүрийн дэлгэрэнгүй шинжилгээ
        var detailedAnalysis = [];
        if (questionnaire.questions && questionnaire.questions.length > 0) {
            var _loop_2 = function (question) {
                var questionResponses = submittedResponses
                    .map(function (r) { return r.answers.find(function (a) { return a.questionId === question.id; }); })
                    .filter(Boolean);
                var questionScores = questionResponses
                    .map(function (r) { return (r === null || r === void 0 ? void 0 : r.score) || 0; })
                    .filter(function (score) { return score !== undefined; });
                var questionAverageScore = questionScores.length > 0
                    ? questionScores.reduce(function (sum, score) { return sum + score; }, 0) / questionScores.length
                    : 0;
                // Хариултын тархалт
                var answerDistribution = {};
                questionResponses.forEach(function (response) {
                    var answer = response === null || response === void 0 ? void 0 : response.answer;
                    if (answer !== undefined) {
                        var key = Array.isArray(answer)
                            ? answer.sort().join(', ')
                            : String(answer);
                        answerDistribution[key] = (answerDistribution[key] || 0) + 1;
                    }
                });
                detailedAnalysis.push({
                    questionId: question.id,
                    questionText: question.text,
                    averageScore: questionAverageScore,
                    responseCount: questionResponses.length,
                    answerDistribution: answerDistribution,
                });
            };
            for (var _i = 0, _a = questionnaire.questions; _i < _a.length; _i++) {
                var question = _a[_i];
                _loop_2(question);
            }
        }
        // Зөвлөмжүүд
        var recommendations = [];
        if (averageScore < 50) {
            recommendations.push('Асуулгын хэлбэр, агуулгыг сайжруулах шаардлагатай');
        }
        if (completionRate < 60) {
            recommendations.push('Хэрэглэгчдийн оролцоог нэмэгдүүлэх арга хэмжээ авах');
        }
        var difficultQuestions = detailedAnalysis.filter(function (q) { return q.averageScore < 50; });
        if (difficultQuestions.length > 0) {
            recommendations.push("\u0425\u044D\u0446\u04AF\u04AF \u0430\u0441\u0443\u0443\u043B\u0442\u0443\u0443\u0434\u044B\u0433 \u0434\u0430\u0445\u0438\u043D \u0431\u043E\u043B\u043E\u0432\u0441\u0440\u0443\u0443\u043B\u0430\u0445: ".concat(difficultQuestions.length, " \u0448\u0438\u0440\u0445\u044D\u0433"));
        }
        return {
            totalResponses: totalResponses,
            averageScore: averageScore,
            completionRate: completionRate,
            scoreDistribution: scoreDistribution,
            detailedAnalysis: detailedAnalysis,
            recommendations: recommendations,
        };
    };
    /**
     * Зардлын шинжилгээ
     */
    ScoringUtils.analyzeExpenses = function (expenses) {
        if (expenses.length === 0) {
            return {
                totalAmount: 0,
                averageExpense: 0,
                categoryBreakdown: {},
                monthlyTrend: {},
                topExpenses: [],
                recommendations: ['Зардлын мэдээлэл байхгүй'],
            };
        }
        var totalAmount = expenses.reduce(function (sum, expense) { return sum + (expense.amount || 0); }, 0);
        var averageExpense = totalAmount / expenses.length;
        // Ангилалаар нь бүлэглэх
        var categoryBreakdown = {};
        expenses.forEach(function (expense) {
            var category = expense.category || 'other';
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = { count: 0, amount: 0, percentage: 0 };
            }
            categoryBreakdown[category].count++;
            categoryBreakdown[category].amount += expense.amount || 0;
        });
        // Хувь тооцох
        Object.keys(categoryBreakdown).forEach(function (category) {
            categoryBreakdown[category].percentage = (categoryBreakdown[category].amount / totalAmount) * 100;
        });
        // Сар бүрийн зардлын чиг хандлага
        var monthlyTrend = {};
        expenses.forEach(function (expense) {
            if (expense.expenseDate) {
                var date = new Date(expense.expenseDate);
                var monthKey = "".concat(date.getFullYear(), "-").concat(String(date.getMonth() + 1).padStart(2, '0'));
                monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + (expense.amount || 0);
            }
        });
        // Хамгийн өндөр зардлууд
        var topExpenses = __spreadArray([], expenses, true).sort(function (a, b) { return (b.amount || 0) - (a.amount || 0); })
            .slice(0, 10);
        // Зөвлөмжүүд
        var recommendations = [];
        // Хэт өндөр зардлын ангилалуудыг шалгах
        Object.entries(categoryBreakdown).forEach(function (_a) {
            var category = _a[0], data = _a[1];
            if (data.percentage > 50) {
                recommendations.push("".concat(category, " \u0437\u0430\u0440\u0434\u043B\u044B\u043D \u0445\u0443\u0432\u044C \u0445\u044D\u043C\u0436\u044D\u044D \u0445\u044D\u0442 \u04E9\u043D\u0434\u04E9\u0440 \u0431\u0430\u0439\u043D\u0430 (").concat(data.percentage.toFixed(1), "%)"));
            }
        });
        // Сүүлийн 3 сарын зардлын хандлагыг шинжлэх
        var monthlyKeys = Object.keys(monthlyTrend).sort();
        if (monthlyKeys.length >= 3) {
            var last3Months = monthlyKeys.slice(-3);
            var last3Amounts = last3Months.map(function (month) { return monthlyTrend[month]; });
            var increasing = true;
            for (var i = 1; i < last3Amounts.length; i++) {
                if (last3Amounts[i] <= last3Amounts[i - 1]) {
                    increasing = false;
                    break;
                }
            }
            if (increasing) {
                recommendations.push('Сүүлийн 3 сард зардал тасралтгүй өсч байна');
            }
        }
        if (recommendations.length === 0) {
            recommendations.push('Зардлын удирдлага сайн байна');
        }
        return {
            totalAmount: totalAmount,
            averageExpense: averageExpense,
            categoryBreakdown: categoryBreakdown,
            monthlyTrend: monthlyTrend,
            topExpenses: topExpenses,
            recommendations: recommendations,
        };
    };
    /**
     * Нийт үнэлгээ (KPI)
     */
    ScoringUtils.calculateKPIs = function (questionnaireStats, expenseStats, responseStats) {
        var totalResponses = (responseStats === null || responseStats === void 0 ? void 0 : responseStats.totalResponses) || 0;
        var totalExpense = (expenseStats === null || expenseStats === void 0 ? void 0 : expenseStats.totalAmount) || 0;
        var averageScore = (questionnaireStats === null || questionnaireStats === void 0 ? void 0 : questionnaireStats.averageScore) || 0;
        var completionRate = (questionnaireStats === null || questionnaireStats === void 0 ? void 0 : questionnaireStats.completionRate) || 0;
        // Хариулт тутамд зарцуулсан дүн
        var costPerResponse = totalResponses > 0 ? totalExpense / totalResponses : 0;
        // Оролцооны оноо (0-100)
        var engagementScore = (averageScore * 10 + completionRate) / 2;
        // Үр ашигтай байдлын оноо
        var efficiencyScore = 100;
        if (costPerResponse > 10000)
            efficiencyScore -= 40;
        else if (costPerResponse > 5000)
            efficiencyScore -= 20;
        else if (costPerResponse > 1000)
            efficiencyScore -= 10;
        if (completionRate < 30)
            efficiencyScore -= 30;
        else if (completionRate < 60)
            efficiencyScore -= 15;
        // Нийт оноо
        var overallScore = (engagementScore + efficiencyScore) / 2;
        // KPI статус
        var kpiStatus = 'fair';
        if (overallScore >= 80)
            kpiStatus = 'excellent';
        else if (overallScore >= 65)
            kpiStatus = 'good';
        else if (overallScore >= 50)
            kpiStatus = 'fair';
        else
            kpiStatus = 'poor';
        return {
            costPerResponse: costPerResponse,
            engagementScore: engagementScore,
            efficiencyScore: efficiencyScore,
            overallScore: overallScore,
            kpiStatus: kpiStatus,
        };
    };
    /**
     * Тайланд зориулсан онооны тайлбар
     */
    ScoringUtils.getScoreInterpretation = function (score, type) {
        if (type === void 0) { type = 'overall'; }
        var level;
        var description;
        var color;
        if (score >= 90) {
            level = 'Маш сайн';
            description = 'Гайхалтай гүйцэтгэл, жишигт үйл ажиллагаа';
            color = '#10B981'; // ногоон
        }
        else if (score >= 75) {
            level = 'Сайн';
            description = 'Өндөр түвшний гүйцэтгэл, тасралтгүй сайжруулах шаардлагатай';
            color = '#3B82F6'; // цэнхэр
        }
        else if (score >= 60) {
            level = 'Дунд';
            description = 'Хүлээн зөвшөөрөгдөхүйц түвшин, сайжруулах боломжтой';
            color = '#F59E0B'; // шар
        }
        else if (score >= 40) {
            level = 'Дундаас доош';
            description = 'Анхаарал шаардсан түвшин, нэн даруй арга хэмжээ авах шаардлагатай';
            color = '#EF4444'; // улаан
        }
        else {
            level = 'Муу';
            description = 'Ноцтой асуудал, яаралтай арга хэмжээ шаардлагатай';
            color = '#DC2626'; // гүн улаан
        }
        return { level: level, description: description, color: color };
    };
    return ScoringUtils;
}());
exports.ScoringUtils = ScoringUtils;
