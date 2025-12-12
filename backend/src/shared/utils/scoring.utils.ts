import { Questionnaire } from '../entities/questionnaire.entity';
import { Response } from '../entities/response.entity';

export class ScoringUtils {
  /**
   * Асуулгын хариултыг оноо өгөх
   */
  static calculateScore(questionnaire: Questionnaire, answers: any[]): {
    score: number;
    maxScore: number;
    percentage: number;
    detailedScores: Array<{ questionId: string; score: number; maxScore: number }>;
  } {
    if (!questionnaire.scoring) {
      return {
        score: 0,
        maxScore: 0,
        percentage: 0,
        detailedScores: [],
      };
    }

    const { scoring } = questionnaire;
    let totalScore = 0;
    let totalMaxScore = scoring.maxScore || 0;
    const detailedScores: Array<{ questionId: string; score: number; maxScore: number }> = [];

    // Хэрэв критери тодорхойлогдоогүй бол өгөх боломжгүй
    if (!scoring.criteria || scoring.criteria.length === 0) {
      return {
        score: 0,
        maxScore: totalMaxScore,
        percentage: 0,
        detailedScores: [],
      };
    }

    // Асуулт бүрийн хариултыг шалгах
    for (const criterion of scoring.criteria) {
      const answer = answers.find(a => a.questionId === criterion.questionId);
      const questionScore = this.evaluateAnswer(criterion, answer);
      
      totalScore += questionScore;
      detailedScores.push({
        questionId: criterion.questionId,
        score: questionScore,
        maxScore: criterion.weight || 1,
      });
    }

    const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    return {
      score: totalScore,
      maxScore: totalMaxScore,
      percentage,
      detailedScores,
    };
  }

  /**
   * Хариултыг үнэлэх
   */
  private static evaluateAnswer(criterion: any, answer: any): number {
    if (!answer) return 0;

    const { weight = 1, correctAnswers } = criterion;

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
        const numAnswer = answer.answer;
        if (correctAnswers.length === 1) {
          // Яг ижил тоо
          return correctAnswers[0] === numAnswer ? weight : 0;
        } else if (correctAnswers.length === 2) {
          // Хугацааны интервал
          const [min, max] = correctAnswers;
          return numAnswer >= min && numAnswer <= max ? weight : 0;
        }
        return 0;
      
      case 'boolean':
        // Boolean хариулт
        const boolAnswer = answer.answer;
        return correctAnswers.includes(boolAnswer.toString()) ? weight : 0;
      
      default:
        // Массив эсвэл бусад
        if (Array.isArray(answer.answer)) {
          // Массив хариулт
          const userAnswers = answer.answer;
          const allCorrect = correctAnswers.every((correct: any) => 
            userAnswers.includes(correct)
          );
          return allCorrect ? weight : 0;
        }
        return 0;
    }
  }

  /**
   * Асуулгын хариултын статистик шинжилгээ
   */
  static analyzeQuestionnaireResponses(questionnaire: Questionnaire, responses: Response[]): {
    totalResponses: number;
    averageScore: number;
    completionRate: number;
    scoreDistribution: Record<string, number>;
    detailedAnalysis: Array<{
      questionId: string;
      questionText: string;
      averageScore: number;
      responseCount: number;
      answerDistribution: Record<string, number>;
    }>;
    recommendations: string[];
  } {
    const totalResponses = responses.length;
    const submittedResponses = responses.filter(r => r.status === 'submitted');
    
    // Нийт дүн
    const scores = submittedResponses.map(r => r.score || 0);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    // Дуусах хувь
    const completionRate = totalResponses > 0 
      ? (submittedResponses.length / totalResponses) * 100 
      : 0;

    // Онооны тархалт
    const scoreDistribution: Record<string, number> = {};
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    submittedResponses.forEach(response => {
      const percentage = response.percentage || 0;
      for (const range of scoreRanges) {
        if (percentage >= range.min && percentage <= range.max) {
          scoreDistribution[range.range] = (scoreDistribution[range.range] || 0) + 1;
          break;
        }
      }
    });

    // Асуулт бүрийн дэлгэрэнгүй шинжилгээ
    const detailedAnalysis: Array<{
      questionId: string;
      questionText: string;
      averageScore: number;
      responseCount: number;
      answerDistribution: Record<string, number>;
    }> = [];

    if (questionnaire.questions && questionnaire.questions.length > 0) {
      for (const question of questionnaire.questions) {
        const questionResponses = submittedResponses
          .map(r => r.answers.find(a => a.questionId === question.id))
          .filter(Boolean);

        const questionScores = questionResponses
          .map(r => r?.score || 0)
          .filter(score => score !== undefined);

        const questionAverageScore = questionScores.length > 0
          ? questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length
          : 0;

        // Хариултын тархалт
        const answerDistribution: Record<string, number> = {};
        questionResponses.forEach(response => {
          const answer = response?.answer;
          if (answer !== undefined) {
            const key = Array.isArray(answer) 
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
          answerDistribution,
        });
      }
    }

    // Зөвлөмжүүд
    const recommendations: string[] = [];
    
    if (averageScore < 50) {
      recommendations.push('Асуулгын хэлбэр, агуулгыг сайжруулах шаардлагатай');
    }
    
    if (completionRate < 60) {
      recommendations.push('Хэрэглэгчдийн оролцоог нэмэгдүүлэх арга хэмжээ авах');
    }
    
    const difficultQuestions = detailedAnalysis.filter(q => q.averageScore < 50);
    if (difficultQuestions.length > 0) {
      recommendations.push(`Хэцүү асуултуудыг дахин боловсруулах: ${difficultQuestions.length} ширхэг`);
    }

    return {
      totalResponses,
      averageScore,
      completionRate,
      scoreDistribution,
      detailedAnalysis,
      recommendations,
    };
  }

  /**
   * Зардлын шинжилгээ
   */
  static analyzeExpenses(expenses: any[]): {
    totalAmount: number;
    averageExpense: number;
    categoryBreakdown: Record<string, { count: number; amount: number; percentage: number }>;
    monthlyTrend: Record<string, number>;
    topExpenses: any[];
    recommendations: string[];
  } {
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

    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const averageExpense = totalAmount / expenses.length;

    // Ангилалаар нь бүлэглэх
    const categoryBreakdown: Record<string, { count: number; amount: number; percentage: number }> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'other';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, amount: 0, percentage: 0 };
      }
      categoryBreakdown[category].count++;
      categoryBreakdown[category].amount += expense.amount || 0;
    });

    // Хувь тооцох
    Object.keys(categoryBreakdown).forEach(category => {
      categoryBreakdown[category].percentage = (categoryBreakdown[category].amount / totalAmount) * 100;
    });

    // Сар бүрийн зардлын чиг хандлага
    const monthlyTrend: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.expenseDate) {
        const date = new Date(expense.expenseDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + (expense.amount || 0);
      }
    });

    // Хамгийн өндөр зардлууд
    const topExpenses = [...expenses]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 10);

    // Зөвлөмжүүд
    const recommendations: string[] = [];
    
    // Хэт өндөр зардлын ангилалуудыг шалгах
    Object.entries(categoryBreakdown).forEach(([category, data]) => {
      if (data.percentage > 50) {
        recommendations.push(`${category} зардлын хувь хэмжээ хэт өндөр байна (${data.percentage.toFixed(1)}%)`);
      }
    });

    // Сүүлийн 3 сарын зардлын хандлагыг шинжлэх
    const monthlyKeys = Object.keys(monthlyTrend).sort();
    if (monthlyKeys.length >= 3) {
      const last3Months = monthlyKeys.slice(-3);
      const last3Amounts = last3Months.map(month => monthlyTrend[month]);
      
      let increasing = true;
      for (let i = 1; i < last3Amounts.length; i++) {
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
      totalAmount,
      averageExpense,
      categoryBreakdown,
      monthlyTrend,
      topExpenses,
      recommendations,
    };
  }

  /**
   * Нийт үнэлгээ (KPI)
   */
  static calculateKPIs(
    questionnaireStats: any,
    expenseStats: any,
    responseStats: any
  ): {
    costPerResponse: number;
    engagementScore: number;
    efficiencyScore: number;
    overallScore: number;
    kpiStatus: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const totalResponses = responseStats?.totalResponses || 0;
    const totalExpense = expenseStats?.totalAmount || 0;
    const averageScore = questionnaireStats?.averageScore || 0;
    const completionRate = questionnaireStats?.completionRate || 0;

    // Хариулт тутамд зарцуулсан дүн
    const costPerResponse = totalResponses > 0 ? totalExpense / totalResponses : 0;

    // Оролцооны оноо (0-100)
    const engagementScore = (averageScore * 10 + completionRate) / 2;

    // Үр ашигтай байдлын оноо
    let efficiencyScore = 100;
    if (costPerResponse > 10000) efficiencyScore -= 40;
    else if (costPerResponse > 5000) efficiencyScore -= 20;
    else if (costPerResponse > 1000) efficiencyScore -= 10;

    if (completionRate < 30) efficiencyScore -= 30;
    else if (completionRate < 60) efficiencyScore -= 15;

    // Нийт оноо
    const overallScore = (engagementScore + efficiencyScore) / 2;

    // KPI статус
    let kpiStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (overallScore >= 80) kpiStatus = 'excellent';
    else if (overallScore >= 65) kpiStatus = 'good';
    else if (overallScore >= 50) kpiStatus = 'fair';
    else kpiStatus = 'poor';

    return {
      costPerResponse,
      engagementScore,
      efficiencyScore,
      overallScore,
      kpiStatus,
    };
  }

  /**
   * Тайланд зориулсан онооны тайлбар
   */
  static getScoreInterpretation(score: number, type: 'overall' | 'engagement' | 'efficiency' = 'overall'): {
    level: string;
    description: string;
    color: string;
  } {
    let level: string;
    let description: string;
    let color: string;

    if (score >= 90) {
      level = 'Маш сайн';
      description = 'Гайхалтай гүйцэтгэл, жишигт үйл ажиллагаа';
      color = '#10B981'; // ногоон
    } else if (score >= 75) {
      level = 'Сайн';
      description = 'Өндөр түвшний гүйцэтгэл, тасралтгүй сайжруулах шаардлагатай';
      color = '#3B82F6'; // цэнхэр
    } else if (score >= 60) {
      level = 'Дунд';
      description = 'Хүлээн зөвшөөрөгдөхүйц түвшин, сайжруулах боломжтой';
      color = '#F59E0B'; // шар
    } else if (score >= 40) {
      level = 'Дундаас доош';
      description = 'Анхаарал шаардсан түвшин, нэн даруй арга хэмжээ авах шаардлагатай';
      color = '#EF4444'; // улаан
    } else {
      level = 'Муу';
      description = 'Ноцтой асуудал, яаралтай арга хэмжээ шаардлагатай';
      color = '#DC2626'; // гүн улаан
    }

    return { level, description, color };
  }
}