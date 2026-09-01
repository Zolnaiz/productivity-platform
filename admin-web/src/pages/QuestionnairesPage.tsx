import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Textarea from "../components/common/Textarea";
import { assessmentService } from "../services/assessment.service";
import {
  AssessmentQuestion,
  AssessmentTemplate,
} from "../types/assessment.types";

type DraftQuestion = AssessmentQuestion;

const templatePresets: Array<{
  title: string;
  type: AssessmentTemplate["type"];
  industry: string;
  description: string;
  questions: DraftQuestion[];
}> = [
  {
    title: "5S workplace assessment",
    type: "inspection",
    industry: "Manufacturing",
    description:
      "Sort, set in order, shine, standardize, and sustain checks for daily workplace discipline.",
    questions: [
      {
        id: "q-sort",
        text: "Unneeded items are removed from the work area.",
        type: "score",
        maxScore: 5,
      },
      {
        id: "q-order",
        text: "Tools and materials have clear labeled locations.",
        type: "score",
        maxScore: 5,
      },
      { id: "q-action", text: "Improvement action or blocker", type: "text" },
    ],
  },
  {
    title: "Safety walk checklist",
    type: "safety",
    industry: "Construction",
    description:
      "Quick supervisor checklist for hazards, PPE, access routes, and corrective actions.",
    questions: [
      { id: "q-ppe", text: "Required PPE is worn correctly.", type: "yes_no" },
      {
        id: "q-hazards",
        text: "Visible hazards are controlled or marked.",
        type: "score",
        maxScore: 5,
      },
      { id: "q-note", text: "Safety note or corrective action", type: "text" },
    ],
  },
  {
    title: "Service quality review",
    type: "quality",
    industry: "Hospitality",
    description:
      "Frontline service quality review for cleanliness, handover, and guest/customer experience.",
    questions: [
      {
        id: "q-clean",
        text: "Area cleanliness meets the agreed standard.",
        type: "score",
        maxScore: 5,
      },
      {
        id: "q-handover",
        text: "Shift handover information is complete.",
        type: "yes_no",
      },
      { id: "q-feedback", text: "Customer or employee feedback", type: "text" },
    ],
  },
];

const emptyQuestion = (): DraftQuestion => ({
  id: `q-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  text: "",
  type: "score",
  maxScore: 5,
});

const QuestionnairesPage: React.FC = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    type: "inspection" as AssessmentTemplate["type"],
    industry: "Operations",
    questions: [emptyQuestion()],
  });

  useEffect(() => {
    assessmentService
      .getTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const filteredTemplates = useMemo(
    () =>
      filter === "all"
        ? templates
        : templates.filter(
            (template) =>
              template.status === filter || template.type === filter,
          ),
    [filter, templates],
  );

  const createTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;

    const questions = draft.questions
      .filter((question) => question.text.trim())
      .map((question) => ({
        ...question,
        text: question.text.trim(),
        maxScore:
          question.type === "score" ? question.maxScore || 5 : undefined,
      }));

    if (!questions.length) return;

    const template = await assessmentService.createTemplate({
      title: draft.title,
      description: draft.description,
      type: draft.type,
      industry: draft.industry,
      status: "draft",
      questions,
    });

    setTemplates((current) => [template, ...current]);
    setDraft({
      title: "",
      description: "",
      type: "inspection",
      industry: "Operations",
      questions: [emptyQuestion()],
    });
  };

  const updateStatus = async (
    template: AssessmentTemplate,
    status: AssessmentTemplate["status"],
  ) => {
    const updated = await assessmentService.updateTemplate(template.id, {
      status,
    });
    setTemplates((current) =>
      current.map((item) => (item.id === template.id ? updated : item)),
    );
  };

  const applyPreset = (preset: (typeof templatePresets)[number]) => {
    setDraft({
      title: preset.title,
      description: preset.description,
      type: preset.type,
      industry: preset.industry,
      questions: preset.questions.map((question) => ({ ...question })),
    });
  };

  const updateQuestion = (id: string, patch: Partial<DraftQuestion>) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === id
          ? {
              ...question,
              ...patch,
              maxScore:
                patch.type && patch.type !== "score"
                  ? undefined
                  : (patch.maxScore ?? question.maxScore),
            }
          : question,
      ),
    }));
  };

  const removeQuestion = (id: string) => {
    setDraft((current) => ({
      ...current,
      questions:
        current.questions.length === 1
          ? current.questions
          : current.questions.filter((question) => question.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("assessments.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("assessments.subtitle")}
          </p>
        </div>
        <Select
          className="sm:w-56"
          aria-label={t("assessments.filterTemplates")}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">{t("assessments.allTemplates")}</option>
          <option value="draft">{t("assessments.draft")}</option>
          <option value="published">{t("assessments.published")}</option>
          <option value="inspection">{t("assessments.inspection")}</option>
          <option value="quality">{t("assessments.quality")}</option>
          <option value="safety">{t("assessments.safety")}</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">{t("assessments.templates")}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {templates.length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t("assessments.published")}</div>
          <div className="mt-2 text-2xl font-semibold text-green-600">
            {
              templates.filter((template) => template.status === "published")
                .length
            }
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t("assessments.draft")}</div>
          <div className="mt-2 text-2xl font-semibold text-yellow-600">
            {templates.filter((template) => template.status === "draft").length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t("assessments.questions")}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {templates.reduce(
              (sum, template) => sum + template.questions.length,
              0,
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card
          title={t("assessments.builder")}
          subtitle={t("assessments.builderSubtitle")}
        >
          <form onSubmit={createTemplate} className="space-y-4">
            <div className="grid items-end gap-3 lg:grid-cols-4">
              <Input
                className="lg:col-span-2"
                label={t("assessments.templateTitle")}
                placeholder={t("assessments.templateTitle")}
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
              <Input
                label={t("assessments.industry")}
                placeholder={t("assessments.industry")}
                value={draft.industry}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    industry: event.target.value,
                  }))
                }
              />
              <Select
                label={t("assessments.type")}
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    type: event.target.value as AssessmentTemplate["type"],
                  }))
                }
              >
                <option value="inspection">Inspection</option>
                <option value="quality">Quality</option>
                <option value="safety">Safety</option>
                <option value="feedback">{t("assessments.feedback")}</option>
                <option value="survey">{t("assessments.survey")}</option>
              </Select>
            </div>
            <Textarea
              label={t("assessments.description")}
              placeholder={t("assessments.description")}
              rows={2}
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            <div className="space-y-3">
              {draft.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="grid gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 lg:grid-cols-[1fr_150px_96px_40px]"
                >
                  <Input
                    aria-label={t("assessments.question", { index: index + 1 })}
                    placeholder={t("assessments.question", { index: index + 1 })}
                    value={question.text}
                    onChange={(event) =>
                      updateQuestion(question.id, { text: event.target.value })
                    }
                  />
                  <Select
                    aria-label={t("assessments.questionType", { index: index + 1 })}
                    value={question.type}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        type: event.target.value as DraftQuestion["type"],
                      })
                    }
                  >
                    <option value="score">{t("assessments.score")}</option>
                    <option value="yes_no">{t("assessments.yesNo")}</option>
                    <option value="text">{t("assessments.text")}</option>
                  </Select>
                  <Input
                    aria-label={t("assessments.questionMaxScore", { index: index + 1 })}
                    disabled={question.type !== "score"}
                    min="1"
                    max="10"
                    type="number"
                    value={question.maxScore || 5}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        maxScore: Number(event.target.value),
                      })
                    }
                  />
                  <Button
                    aria-label={t("assessments.removeQuestion")}
                    className="h-10 w-10 px-0"
                    variant="outline"
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                icon={Plus}
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    questions: [...current.questions, emptyQuestion()],
                  }))
                }
              >
                {t("assessments.addQuestion")}
              </Button>
              <Button type="submit">{t("assessments.createTemplate")}</Button>
            </div>
          </form>
        </Card>

        <Card
          title={t("assessments.quickStarts")}
          subtitle={t("assessments.quickStartsSubtitle")}
        >
          <div className="space-y-3">
            {templatePresets.map((preset) => (
              <button
                key={preset.title}
                className="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-700 dark:hover:bg-blue-950/20"
                type="button"
                onClick={() => applyPreset(preset)}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {preset.title}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {preset.industry} - {preset.questions.length} questions
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title={`Template library (${filteredTemplates.length})`}
        loading={loading}
      >
        {filteredTemplates.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {template.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {template.description}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    {template.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {template.type}
                  </span>
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                    {template.industry}
                  </span>
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                    {template.questions.length} questions
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.status !== "published" && (
                    <button
                      className="text-sm font-medium text-green-600"
                      onClick={() => updateStatus(template, "published")}
                      type="button"
                    >
                      {t("assessments.publish")}
                    </button>
                  )}
                  {template.status !== "archived" && (
                    <button
                      className="text-sm font-medium text-gray-600"
                      onClick={() => updateStatus(template, "archived")}
                      type="button"
                    >
                      {t("assessments.archive")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={
              templates.length
                ? "No templates match this filter"
                : "No assessment templates yet"
            }
            description={
              templates.length
                ? "Change the filter to review other checklist templates."
                : "Create templates for inspections, quality feedback, safety checks, and operational audits."
            }
          />
        )}
      </Card>
    </div>
  );
};

export default QuestionnairesPage;
