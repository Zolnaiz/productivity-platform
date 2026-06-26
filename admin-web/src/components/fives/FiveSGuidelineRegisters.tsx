import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { fiveSGuidelineService } from '../../services/fiveSGuideline.service';
import {
  FiveSAssessmentScore,
  FiveSChecklistProgress,
  FiveSGuidelineState,
  FiveSImplementationCard,
  FiveSImplementationReason,
  FiveSImplementationStatus,
  FiveSImprovementRecord,
  FiveSImprovementStatus,
} from '../../types/fiveS.types';

const fieldClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';

const textareaClass = `${fieldClass} min-h-[72px]`;

const improvementStatusOptions: Array<{ value: FiveSImprovementStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'management_review', label: 'Management review' },
  { value: 'closed', label: 'Closed' },
];

const reasonOptions: Array<{ value: FiveSImplementationReason; label: string }> = [
  { value: 'defective', label: 'Гэмтэлтэй' },
  { value: 'unused', label: 'Ашиглаагүй удсан' },
  { value: 'excess', label: 'Илүүдэлтэй' },
  { value: 'unnecessary', label: 'Шаардлагагүй' },
];

const implementationStatusOptions: Array<{ value: FiveSImplementationStatus; label: string }> = [
  { value: 'identified', label: 'Identified' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'removed', label: 'Removed' },
  { value: 'returned', label: 'Returned' },
];

const operatingCadence = [
  {
    title: 'Daily 5S',
    timing: 'Өдөр бүр 10-15 минут',
    detail: 'Ажилтан бүр өөрийн хариуцсан ажлын байр, нийтийн талбайг цэвэрлэж хэвшүүлнэ.',
  },
  {
    title: 'Monthly sort',
    timing: 'Сар бүрийн эхний долоо хоног',
    detail: 'Хэрэгцээтэй болон хэрэгцээгүй зүйлсийг ангилан ялгаж, шилжүүлэх эсвэл устгах шийдвэр гаргана.',
  },
  {
    title: 'Shared tools',
    timing: 'Байнгын стандарт',
    detail: 'Цэвэрлэгээний материал, багаж хэрэгслийг тогтсон байршилд хадгалж, эзэнтэй болгоно.',
  },
  {
    title: 'Audit handoff',
    timing: 'Сар бүрийн сүүлийн долоо хоног',
    detail: 'Setup дээр бүрдсэн талбай, хаяг, эзэн, стандартуудыг audit process руу шалгуулахаар шилжүүлнэ.',
  },
  {
    title: 'Recognition',
    timing: 'Жил бүрийн сүүлийн 10 ажлын өдөр',
    detail: 'Сарын үр дүнд үндэслэн шилдэг 5S хэрэгжүүлэгчийг тодруулна.',
  },
];

const labelStandards = [
  'Ажилтан бүр өөрийн хариуцсан ажлын байр, нийтийн эзэмшлийн талбайтай байна.',
  'Эд зүйлсийн нэршлийг тогтоож, байрлал бүрийг хаягжуулна.',
  'Баримт бичгийн хавтаснууд гүн ногоон, шар, цагаан өнгийн стандарттай байна.',
  'МБТ хавтас: кирилл үсгээр "МБТ-(хавтасны нэр)" гэж бичнэ.',
  'APO хавтас: латин үсгээр "APO-(folder name)" гэж бичнэ.',
  'Компьютерийн файл: латин үсгээр англи нэр + огноо гэсэн дарааллаар хадгална.',
  'Нийтийн шүүгээ, тавиур: саарал дэвсгэр, хар хүрээ, зүүн талд лого, баруун талд эд зүйлсийн нэршилтэй байна.',
];

const assessmentCriteria = [
  ['policy-1', '5С-ийн бодлого', '5С-ийн бодлого сайн боловсруулагдсан.'],
  ['policy-2', '5С-ийн бодлого', 'Бүх шатны ажилтнуудад ойлгомжтой.'],
  ['policy-3', '5С-ийн бодлого', 'Гүйцэтгэх захирлаар батлуулсан.'],
  ['policy-4', '5С-ийн бодлого', 'Цэвэр цэмцгэр, хэрэгцээтэй газруудад байрлуулсан.'],
  ['policy-5', '5С-ийн бодлого', '5С-ийн хэрэгжүүлэлтэд шаардлагатай мэдээллүүд багтсан.'],
  ['structure-6', '5С-ийн бүтцийн схем', 'Байгууллагын 5С-ийн булангаас харахад хялбар.'],
  ['structure-7', '5С-ийн бүтцийн схем', '5С-ийг үр дүнтэй хэрэгжүүлэхэд хялбар сайн бэлтгэсэн.'],
  ['corner-8', '5С-ийн булан', 'Стратегийн ач холбогдол бүхий газар байрлуулсан, байнга хэрэглэгддэг.'],
  ['corner-9', '5С-ийн булан', '5С-ийн булан дахь мэдээлэл шинэ, байнга сайжруулагддаг, сонирхол татам.'],
  ['team-10', '5С-ийн багуудын нэр, булан', '5С-ийн багууд нэртэй, фото зургууд нь 5С-ийн буланд тавигдсан.'],
  ['team-11', '5С-ийн багуудын нэр, булан', 'Багийн гишүүд өөр өөрийн үүрэг оролцоотой.'],
  ['team-12', '5С-ийн багуудын нэр, булан', 'Багууд 5С-ийн булангаа сайн ашигладаг.'],
  ['plan-13', '5С хэрэгжүүлэлтийн төлөвлөлт', 'Гантын хүснэгтийг удирдах зөвлөлөөс гаргаж 5С-ийн буланд байрлуулсан.'],
  ['plan-14', '5С хэрэгжүүлэлтийн төлөвлөлт', 'Гантын хүснэгтэд 5С-ыг хэрэгжүүлэх үйл ажиллагааг нарийвчлан тусгасан.'],
  ['plan-15', '5С хэрэгжүүлэлтийн төлөвлөлт', 'Удирдлага болон баг хуваарийн дагуу үйл ажиллагааг явуулдаг.'],
  ['plan-16', '5С хэрэгжүүлэлтийн төлөвлөлт', 'Уулзалт ярилцлагын хугацааг удирдах зөвлөлөөс тогтоосон.'],
  ['notes-17', '5С-ийн багийн ажлын тэмдэглэл', 'Багийн уулзалтын хугацааг тэмдэглэсэн.'],
  ['notes-18', '5С-ийн багийн ажлын тэмдэглэл', 'Багийн уулзалт, ярилцлагын хуваарийг 5С-ийн буланд байрлуулсан.'],
  ['notes-19', '5С-ийн багийн ажлын тэмдэглэл', 'Сайжруулалтын үр дүнг зураг, схем, баримтаар харуулж хуваалцдаг.'],
  ['discipline-20', 'Сахилга бат, ажилчдын хандлага', 'Ажилчид сайн сахилга баттай, зөв хандлагатай болсон илрэл байгаа.'],
  ['discipline-21', 'Сахилга бат, ажилчдын хандлага', 'Аюулгүй ажиллагааны мэдлэг, хамгаалах хувцас, багаж тоног төхөөрөмжийн хэрэглээ тогтсон.'],
  ['training-22', 'Ажилчдын сургалт, хөгжил', '5С-ийн сургалт, менежерийн сургалт, арга зүйн сургалт давтамжтай хийгддэг.'],
  ['activation-23', 'Идэвхжүүлэлт', 'Ярилцлага, оюуны довтолгоо, зурагт хуудас, их цэвэрлэгээ, 7 хоног/сарын цуглаан ашигладаг.'],
  ['reward-24', 'Шагнал урамшуулал', 'Захидал, хөнгөлөлтийн карт, урамшуулал, бонус эсвэл бусад хэлбэртэй.'],
  ['evaluation-25', 'Үр дүнтэй үнэлгээ', '5С-ийн дотоод аудитын давтамж тодорхой.'],
  ['evaluation-26', 'Үр дүнтэй үнэлгээ', 'Аудитын шалгуур хэрэглэхэд хялбар, бүрэн боловсруулсан.'],
  ['evaluation-27', 'Үр дүнтэй үнэлгээ', 'Аудитын үнэлгээг ажилтнуудын мэдлэг нэмэгдүүлэхээр дэлгэж харуулдаг.'],
  ['management-28', 'Удирдлагын хяналт', 'Удирдлагын хяналтын давтамж тодорхой.'],
  ['management-29', 'Удирдлагын хяналт', 'Сайжруулалтын төсөв төлөвлөгдсөн.'],
  ['customer-30', 'Хэрэглэгчийн үйлчилгээ', 'Хэрэглэгчид чиглэсэн үнэ цэнэ, бодлого, хөтөлбөрүүд байдаг.'],
  ['customer-31', 'Хэрэглэгчийн үйлчилгээ', 'Хэрэглэгчийн одоогийн болон ирээдүйн хүлээлтийг тодорхойлдог.'],
  ['customer-32', 'Хэрэглэгчийн үйлчилгээ', 'Хэрэглэгчийн процессыг тодорхойлсон.'],
  ['customer-33', 'Хэрэглэгчийн үйлчилгээ', 'Хэрэглэгчийн сэтгэл ханамжийг дээшлүүлэхэд ажилчид оролцдог.'],
  ['customer-34', 'Хэрэглэгчийн үйлчилгээ', 'Хэрэглэгчийн мэдээлэл цуглуулж, сэтгэл ханамжийн судалгаа авдаг.'],
  ['model-35', 'Шилдэг загвар', 'Шилдэг загварын тоо, жишээ бүртгэгдсэн.'],
].map(([id, category, criterion]) => ({ id, category, criterion }));

const publicChecklistGroups = [
  {
    code: 'seiri',
    title: '1. SEIRI / Ангилан ялгах',
    items: [
      'Ажлын байр хог хаягдал, бохир, хэрэгцээгүй зүйлгүй.',
      'Ажлын байр, тоног төхөөрөмж цэвэр.',
      'Машин механизм, тоног төхөөрөмж, багаж хэрэгсэл ашиглалттай, гэмтэлгүй.',
      'Цонх, хана, хаалга, шал, дээвэр эвдрэл гэмтэлгүй.',
      'Цэвэрлэгээний нарийвчилсан журам, график, 5С-ийн стандарт бий.',
    ],
  },
  {
    code: 'seiton',
    title: '2. SEITON / Зөв байрлуулах',
    items: [
      'Багаж хэрэгсэл, тоног төхөөрөмжүүд зөв байрлуулсан.',
      'Багаж хэрэгсэл, бараа материалыг тогтсон байртай, зөв хадгалдаг.',
      'Багаж хэрэгсэл, сэлбэг, тоног төхөөрөмж хариуцсан эзэнтэй.',
      'Хаягжилт, аюулгүй ажиллагааны плакат, санамж, таних тэмдэг ашиглагддаг.',
      'Ажлын талбайн хуваарь, аюулгүйн гарц, шат тавцангийн зураг зөв гарсан.',
      'Цэвэрлэгээний материал, багаж хэрэгсэл бэлэн.',
      'Тоног төхөөрөмжийн ашиглалт, эвдрэл саатлын зааварчилгаа байгаа.',
    ],
  },
  {
    code: 'seiso',
    title: '3. SEISO / Цэвэрлэх',
    items: [
      'Ажлын байрны өнцөг булан, шал цэвэрхэн.',
      'Тоног төхөөрөмж ан цав зэрэг аюултай гэмтэлгүй.',
      'Түүхий эд эсвэл хэрэглэгдэхгүй зүйл зориулалтын хайрцагт тэмдэглэгээтэй.',
      'Машин тоног төхөөрөмж, багаж хэрэгсэл цэвэр, аюулгүй.',
      'Цэвэрлэгээний хуваарь, журмын дагуу хяналт шалгалт хийдэг.',
      'Өдөр тутмын болон их цэвэрлэгээний журам хэвшсэн.',
    ],
  },
  {
    code: 'seiketsu',
    title: '4. SEIKETSU / Хэвшүүлэх',
    items: [
      'Стандарт мөрдөж хаягжуулдаг.',
      'Ажилтнууд 5С-ийн үүргээ сайн мэддэг.',
      '5С-ийн журам ил тод, ажилтнууд ойлголттой.',
      '5С сайжруулалтын баримтжуулалт хийгддэг.',
      'Эрүүл ахуй, аюулгүй байдал, ажлын байрны стандартын мэдээлэл сурталчилгаа хийгддэг.',
      'Нөөцийг байршуулах стандарт мөрддөг.',
    ],
  },
  {
    code: 'shitsuke',
    title: '5. SHITSUKE / Сахилга бат',
    items: [
      'Шаардлагатай мэдээллийг гаргах самбар байгаа, ашиглагддаг.',
      '5С-ийн мэдээлэл ажилтнуудад хийгддэг.',
      '5С-ийн талаар нэгжийн хурлаар тогтмол хэлэлцдэг.',
      'Бүх ажилчид цэвэрлэгээний журам, стандартыг мэдэж мөрддөг.',
      '5С-ийн үйл ажиллагааг сайн баримтжуулж хэвшсэн.',
      '5С сайжруулалтын ажилд үнэлэлт дүгнэлт хийдэг.',
    ],
  },
];

const guidelineMaxScore = 170;

const escapeCsvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number | undefined>>) => {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const FiveSGuidelineRegisters: React.FC = () => {
  const [state, setState] = useState<FiveSGuidelineState>(() => fiveSGuidelineService.getState());
  const [actionMessage, setActionMessage] = useState('');

  const scoreById = useMemo(
    () => new Map(state.assessmentScores.map((score) => [score.id, score])),
    [state.assessmentScores],
  );

  const checklistById = useMemo(
    () => new Map(state.checklistProgress.map((item) => [item.id, item])),
    [state.checklistProgress],
  );

  const assessmentTotal = useMemo(
    () => state.assessmentScores.reduce((total, item) => total + Number(item.score || 0), 0),
    [state.assessmentScores],
  );

  const assessmentPercent = Math.min(100, Math.round((assessmentTotal / guidelineMaxScore) * 100));

  const checklistItems = publicChecklistGroups.flatMap((group) =>
    group.items.map((item, index) => ({ id: `${group.code}-${index + 1}`, group: group.title, item })),
  );

  const checklistDone = checklistItems.filter((item) => checklistById.get(item.id)?.done).length;
  const checklistPercent = checklistItems.length ? Math.round((checklistDone / checklistItems.length) * 100) : 0;

  const updateState = (build: (current: FiveSGuidelineState) => FiveSGuidelineState) => {
    setState((current) => fiveSGuidelineService.saveState(build(current)));
  };

  const addImprovement = () => {
    updateState((current) => ({
      ...current,
      improvements: [...current.improvements, fiveSGuidelineService.createImprovementRecord()],
    }));
    setActionMessage('5S improvement row added.');
  };

  const updateImprovement = (id: string, patch: Partial<FiveSImprovementRecord>) => {
    updateState((current) => ({
      ...current,
      improvements: current.improvements.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const removeImprovement = (id: string) => {
    updateState((current) => ({
      ...current,
      improvements: current.improvements.filter((item) => item.id !== id),
    }));
  };

  const addImplementationCard = () => {
    updateState((current) => ({
      ...current,
      implementationCards: [...current.implementationCards, fiveSGuidelineService.createImplementationCard()],
    }));
    setActionMessage('1C/2C/3C implementation card added.');
  };

  const updateImplementationCard = (id: string, patch: Partial<FiveSImplementationCard>) => {
    updateState((current) => ({
      ...current,
      implementationCards: current.implementationCards.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const removeImplementationCard = (id: string) => {
    updateState((current) => ({
      ...current,
      implementationCards: current.implementationCards.filter((item) => item.id !== id),
    }));
  };

  const updateAssessmentScore = (id: string, patch: Partial<FiveSAssessmentScore>) => {
    updateState((current) => {
      const existing = current.assessmentScores.find((item) => item.id === id);
      const nextScore: FiveSAssessmentScore = {
        id,
        score: 0,
        note: '',
        ...existing,
        ...patch,
      };

      return {
        ...current,
        assessmentScores: existing
          ? current.assessmentScores.map((item) => (item.id === id ? nextScore : item))
          : [...current.assessmentScores, nextScore],
      };
    });
  };

  const updateChecklistProgress = (id: string, patch: Partial<FiveSChecklistProgress>) => {
    updateState((current) => {
      const existing = current.checklistProgress.find((item) => item.id === id);
      const nextItem: FiveSChecklistProgress = {
        id,
        done: false,
        note: '',
        ...existing,
        ...patch,
      };

      return {
        ...current,
        checklistProgress: existing
          ? current.checklistProgress.map((item) => (item.id === id ? nextItem : item))
          : [...current.checklistProgress, nextItem],
      };
    });
  };

  const exportImprovements = () => {
    downloadCsv(
      '5s-improvement-register.csv',
      [
        'Area / Responsible',
        'Date',
        'When',
        'Duration',
        'Symptom / loss',
        'Root cause',
        'Team decision',
        'Action plan',
        'Management decision',
        'Status',
      ],
      state.improvements.map((item) => [
        `${item.area} / ${item.responsible}`,
        item.recordDate,
        item.whenObserved,
        item.duration,
        item.symptomLoss,
        item.rootCause,
        item.teamDecision,
        item.actionPlan,
        item.managementDecision,
        item.status,
      ]),
    );
    setActionMessage('5S improvement register exported.');
  };

  const exportImplementationCards = () => {
    downloadCsv(
      '5s-implementation-cards.csv',
      ['Tag', 'No.', 'Quantity', 'Item', 'Reason', 'Department', 'Date', 'Owner', 'Decision', 'Status'],
      state.implementationCards.map((item) => [
        item.tagType,
        item.itemNumber,
        item.quantity,
        item.itemName,
        reasonOptions.find((option) => option.value === item.reason)?.label,
        item.department,
        item.date,
        item.owner,
        item.decision,
        item.status,
      ]),
    );
    setActionMessage('1C/2C/3C implementation cards exported.');
  };

  const exportAssessment = () => {
    downloadCsv(
      '5s-organization-baseline-assessment.csv',
      ['Category', 'Criterion', 'Score', 'Note'],
      assessmentCriteria.map((criterion) => {
        const score = scoreById.get(criterion.id);
        return [criterion.category, criterion.criterion, score?.score ?? 0, score?.note ?? ''];
      }),
    );
    setActionMessage('Organization baseline assessment exported.');
  };

  const exportChecklist = () => {
    downloadCsv(
      '5s-public-area-checklist.csv',
      ['Group', 'Checklist item', 'Done', 'Note'],
      checklistItems.map((item) => {
        const progress = checklistById.get(item.id);
        return [item.group, item.item, progress?.done ? 'yes' : 'no', progress?.note ?? ''];
      }),
    );
    setActionMessage('Public area checklist exported.');
  };

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
          {actionMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Guideline operating cadence" subtitle="Word зааварт туссан өдөр тутам, 7 хоног, сар, жилийн хөтлөлт.">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {operatingCadence.map((item) => (
              <div key={item.title} className="grid gap-3 py-3 md:grid-cols-[180px_160px_1fr]">
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                  {item.title}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.timing}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Labeling standards" subtitle="Хавтас, файл, шүүгээ, тавиурын хаягжуулалтын шаардлага.">
          <div className="space-y-3">
            {labelStandards.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  {index + 1}
                </div>
                <div className="text-gray-700 dark:text-gray-300">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="5S improvement register"
        subtitle="Хавсралт дахь '5С Сайжруулалтын бүртгэл': алдагдал, суурь шалтгаан, багийн шийдэл, удирдлагын шийдвэр."
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download} onClick={exportImprovements} type="button">
              CSV
            </Button>
            <Button size="sm" icon={Plus} onClick={addImprovement} type="button">
              Add row
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3">Area / owner</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">When</th>
                <th className="px-3 py-3">Duration</th>
                <th className="px-3 py-3">Symptom / loss</th>
                <th className="px-3 py-3">Root cause</th>
                <th className="px-3 py-3">Team decision</th>
                <th className="px-3 py-3">Action plan</th>
                <th className="px-3 py-3">Management</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {state.improvements.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 align-top">
                    <div className="space-y-2">
                      <input className={fieldClass} value={item.area} placeholder="A01 - Reception" onChange={(event) => updateImprovement(item.id, { area: event.target.value })} />
                      <input className={fieldClass} value={item.responsible} placeholder="Responsible owner" onChange={(event) => updateImprovement(item.id, { responsible: event.target.value })} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} type="date" value={item.recordDate} onChange={(event) => updateImprovement(item.id, { recordDate: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.whenObserved} onChange={(event) => updateImprovement(item.id, { whenObserved: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.duration} onChange={(event) => updateImprovement(item.id, { duration: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.symptomLoss} onChange={(event) => updateImprovement(item.id, { symptomLoss: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.rootCause} onChange={(event) => updateImprovement(item.id, { rootCause: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.teamDecision} onChange={(event) => updateImprovement(item.id, { teamDecision: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.actionPlan} onChange={(event) => updateImprovement(item.id, { actionPlan: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.managementDecision} onChange={(event) => updateImprovement(item.id, { managementDecision: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.status} onChange={(event) => updateImprovement(item.id, { status: event.target.value as FiveSImprovementStatus })}>
                      {improvementStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => removeImprovement(item.id)} aria-label="Delete improvement row" type="button" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="1C / 2C / 3C implementation cards"
        subtitle="Хэрэгцээгүй, гэмтэлтэй, илүүдэлтэй, удаан ашиглаагүй эд зүйлийг тэмдэглэж шийдвэрлэнэ."
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download} onClick={exportImplementationCards} type="button">
              CSV
            </Button>
            <Button size="sm" icon={Tag} onClick={addImplementationCard} type="button">
              Add card
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1040px] divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3">Tag</th>
                <th className="px-3 py-3">No. / qty</th>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Reason</th>
                <th className="px-3 py-3">Department</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Decision</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {state.implementationCards.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.tagType} onChange={(event) => updateImplementationCard(item.id, { tagType: event.target.value as FiveSImplementationCard['tagType'] })}>
                      <option value="1C">1C</option>
                      <option value="2C">2C</option>
                      <option value="3C">3C</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="space-y-2">
                      <input className={fieldClass} value={item.itemNumber} placeholder="No." onChange={(event) => updateImplementationCard(item.id, { itemNumber: event.target.value })} />
                      <input className={fieldClass} value={item.quantity} placeholder="Qty" onChange={(event) => updateImplementationCard(item.id, { quantity: event.target.value })} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.itemName} onChange={(event) => updateImplementationCard(item.id, { itemName: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.reason} onChange={(event) => updateImplementationCard(item.id, { reason: event.target.value as FiveSImplementationReason })}>
                      {reasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.department} onChange={(event) => updateImplementationCard(item.id, { department: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} type="date" value={item.date} onChange={(event) => updateImplementationCard(item.id, { date: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.owner} onChange={(event) => updateImplementationCard(item.id, { owner: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.decision} onChange={(event) => updateImplementationCard(item.id, { decision: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.status} onChange={(event) => updateImplementationCard(item.id, { status: event.target.value as FiveSImplementationStatus })}>
                      {implementationStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => removeImplementationCard(item.id)} aria-label="Delete implementation card" type="button" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Organization baseline assessment"
        subtitle="Хавсралт дахь байгууллагын одоогийн түвшний үнэлгээ. Нийт онооны зорилт: 170."
        actions={
          <Button variant="outline" size="sm" icon={Download} onClick={exportAssessment} type="button">
            CSV
          </Button>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Current score</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{assessmentTotal}/{guidelineMaxScore}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Readiness</div>
            <div className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-300">{assessmentPercent}%</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">Criteria</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{assessmentCriteria.length}</div>
          </div>
        </div>
        <div className="max-h-[520px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Criterion</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assessmentCriteria.map((criterion) => {
                const score = scoreById.get(criterion.id);
                return (
                  <tr key={criterion.id}>
                    <td className="w-52 px-3 py-3 text-gray-600 dark:text-gray-300">{criterion.category}</td>
                    <td className="px-3 py-3 text-gray-800 dark:text-gray-100">{criterion.criterion}</td>
                    <td className="w-28 px-3 py-3">
                      <select className={fieldClass} value={score?.score ?? 0} onChange={(event) => updateAssessmentScore(criterion.id, { score: Number(event.target.value) })}>
                        {[0, 1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="w-72 px-3 py-3">
                      <input className={fieldClass} value={score?.note ?? ''} onChange={(event) => updateAssessmentScore(criterion.id, { note: event.target.value })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Public area setup checklist"
        subtitle="Олон нийтийн ажлын байрны 5С шалгах хуудсыг audit биш, setup стандарт бүрдүүлэлтийн checklist хэлбэрээр хөтөлнө."
        actions={
          <Button variant="outline" size="sm" icon={Download} onClick={exportChecklist} type="button">
            CSV
          </Button>
        }
      >
        <div className="mb-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              Setup standard completion
            </div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {checklistDone}/{checklistItems.length} ({checklistPercent}%)
            </div>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {publicChecklistGroups.map((group) => (
            <section key={group.code} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <BookOpen className="h-4 w-4 text-blue-500" />
                {group.title}
              </div>
              <div className="space-y-3">
                {group.items.map((item, index) => {
                  const id = `${group.code}-${index + 1}`;
                  const progress = checklistById.get(id);
                  return (
                    <div key={id} className="grid gap-2 rounded-lg border border-gray-100 p-3 dark:border-gray-700 md:grid-cols-[1fr_220px]">
                      <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                          type="checkbox"
                          checked={progress?.done ?? false}
                          onChange={(event) => updateChecklistProgress(id, { done: event.target.checked })}
                        />
                        <span>{item}</span>
                      </label>
                      <input
                        className={fieldClass}
                        value={progress?.note ?? ''}
                        placeholder="Note"
                        onChange={(event) => updateChecklistProgress(id, { note: event.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Card>

      <Card title="Required records from guideline" subtitle="Зааварт дурдсан бүртгэл, баримт бичгийн холбоосыг 5S setup дээр сануулж харуулна.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['5С-ийн үнэлгээний хуудас', 'Audit Templates хэсэгт оноо, checklist хэлбэрээр хөтөлнө.'],
            ['5С-ийн аудитын бүртгэл', 'Audit process дээр хийсэн шалгалтын түүхээр бүртгэнэ.'],
            ['5С сайжруулалтын бүртгэл', 'Энэ setup хуудсан дээр алдагдал, root cause, action plan-аар хөтөлнө.'],
            ['5С мэдээллийн самбар', 'Baseline score, checklist progress, owner coverage-ийг самбарын мэдээлэл болгож ашиглана.'],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <FileText className="h-4 w-4 text-blue-500" />
                {title}
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FiveSGuidelineRegisters;
