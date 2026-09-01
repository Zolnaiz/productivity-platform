import React, { useEffect, useMemo, useState } from "react";
import { FileCheck2 } from "lucide-react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import EmptyState from "../components/common/EmptyState";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Textarea from "../components/common/Textarea";
import { assessmentService } from "../services/assessment.service";
import { operationsService } from "../services/operations.service";
import {
  AssessmentResponse,
  AssessmentTemplate,
} from "../types/assessment.types";

type AnswerDraft = Record<string, string>;

const statusClasses = {
  in_progress:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  submitted:
    "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  reviewed: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ResponsesPage: React.FC = () => {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [answers, setAnswers] = useState<AnswerDraft>({});
  const [respondent, setRespondent] = useState("Employee User");
  const [department, setDepartment] = useState("Operations");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      assessmentService.getResponses(),
      assessmentService.getTemplates(),
    ])
      .then(([responseItems, templateItems]) => {
        setResponses(responseItems);
        setTemplates(templateItems);
        setSelectedTemplateId(
          templateItems.find((template) => template.status === "published")
            ?.id ||
            templateItems[0]?.id ||
            "",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const templateById = useMemo(
    () =>
      Object.fromEntries(templates.map((template) => [template.id, template])),
    [templates],
  );

  const selectedTemplate = templates.find(
    (template) => template.id === selectedTemplateId,
  );
  const filteredResponses = useMemo(
    () =>
      filter === "all"
        ? responses
        : responses.filter(
            (response) =>
              response.status === filter || response.department === filter,
          ),
    [filter, responses],
  );

  const departments = Array.from(
    new Set(responses.map((response) => response.department).filter(Boolean)),
  );
  const averageScore = responses.length
    ? Math.round(
        responses.reduce((sum, response) => sum + response.score, 0) /
          responses.length,
      )
    : 0;

  const draftScore = useMemo(() => {
    if (!selectedTemplate) return 0;

    let earned = 0;
    let possible = 0;

    selectedTemplate.questions.forEach((question) => {
      if (question.type === "score") {
        possible += question.maxScore || 5;
        earned += Number(answers[question.id] || 0);
      }

      if (question.type === "yes_no") {
        possible += 1;
        earned += answers[question.id] === "yes" ? 1 : 0;
      }
    });

    return possible ? Math.round((earned / possible) * 100) : 100;
  }, [answers, selectedTemplate]);

  const submitResponse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTemplate) return;

    const response = await assessmentService.createResponse({
      templateId: selectedTemplate.id,
      respondent: respondent.trim() || "Employee User",
      department:
        department.trim() || selectedTemplate.industry || "Operations",
      status: "submitted",
      score: draftScore,
      submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      answers: selectedTemplate.questions.map((question) => ({
        questionId: question.id,
        value:
          question.type === "score"
            ? Number(answers[question.id] || 0)
            : question.type === "yes_no"
              ? answers[question.id] === "yes"
              : answers[question.id] || "",
      })),
    });

    setResponses((current) => [response, ...current]);
    setAnswers({});
    setMessage(`Response submitted with ${draftScore}% score.`);
  };

  const reviewResponse = async (
    response: AssessmentResponse,
    status: AssessmentResponse["status"],
  ) => {
    const updated = await assessmentService.reviewResponse(response.id, status);
    setResponses((current) =>
      current.map((item) => (item.id === response.id ? updated : item)),
    );
  };

  const createActionTask = async (response: AssessmentResponse) => {
    const template = templateById[response.templateId];
    await operationsService.createTask({
      title: `Improve response score: ${template?.title || "Assessment"}`,
      description: `${response.respondent} submitted ${response.score}%. Review answers and assign improvement work.`,
      status: "todo",
      priority: response.score < 75 ? "high" : "medium",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      estimatedHours: 2,
      actualHours: 0,
    });
    setMessage("Improvement task created from response.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Assessment Responses
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Submit checklist responses, review scores, and turn weak results
            into improvement tasks.
          </p>
        </div>
        <Select
          className="sm:w-56"
          aria-label="Filter responses"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All responses</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="rejected">Rejected</option>
          {departments.map((departmentName) => (
            <option key={departmentName} value={departmentName}>
              {departmentName}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Responses</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {responses.length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Submitted</div>
          <div className="mt-2 text-2xl font-semibold text-green-600">
            {
              responses.filter((response) => response.status === "submitted")
                .length
            }
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Reviewed</div>
          <div className="mt-2 text-2xl font-semibold text-blue-600">
            {
              responses.filter((response) => response.status === "reviewed")
                .length
            }
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Average score</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {averageScore}%
          </div>
        </Card>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card
          title="Submit response"
          subtitle={
            selectedTemplate?.description ||
            "Choose a published template and fill the checklist."
          }
        >
          <form onSubmit={submitResponse} className="space-y-4">
            <Select
              label="Template"
              value={selectedTemplateId}
              onChange={(event) => {
                setSelectedTemplateId(event.target.value);
                setAnswers({});
              }}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </Select>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Respondent"
                placeholder="Respondent"
                value={respondent}
                onChange={(event) => setRespondent(event.target.value)}
              />
              <Input
                label="Department"
                placeholder="Department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              />
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Current score
              </div>
              <div className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">
                {draftScore}%
              </div>
            </div>

            <div className="space-y-3">
              {selectedTemplate?.questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {question.text}
                  </div>
                  {question.type === "score" && (
                    <div className="mt-3">
                      <input
                        className="w-full"
                        max={question.maxScore || 5}
                        min="0"
                        type="range"
                        value={answers[question.id] || 0}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: event.target.value,
                          }))
                        }
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        Score: {answers[question.id] || 0}/
                        {question.maxScore || 5}
                      </div>
                    </div>
                  )}
                  {question.type === "yes_no" && (
                    <Select
                      className="mt-3"
                      aria-label={question.text}
                      value={answers[question.id] || "no"}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </Select>
                  )}
                  {question.type === "text" && (
                    <Textarea
                      className="mt-3"
                      aria-label={question.text}
                      rows={2}
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <Button fullWidth disabled={!selectedTemplate || loading} type="submit">
              Submit response
            </Button>
          </form>
        </Card>

        <Card
          title={`Response queue (${filteredResponses.length})`}
          loading={loading}
        >
          <Table
            rows={filteredResponses}
            rowKey={(response) => response.id}
            columns={[
              {
                key: "respondent",
                header: "Respondent",
                render: (response) => (
                  <>
                    <div className="font-medium text-gray-900 dark:text-white">{response.respondent}</div>
                    <div className="text-xs text-gray-500">{response.submittedAt}</div>
                  </>
                ),
              },
              {
                key: "template",
                header: "Template",
                render: (response) => templateById[response.templateId]?.title || "Unknown template",
              },
              { key: "department", header: "Department" },
              {
                key: "score",
                header: "Score",
                render: (response) => (
                  <span
                    className={
                      response.score < 80 ? "font-semibold text-yellow-600" : "font-semibold text-green-600"
                    }
                  >
                    {response.score}%
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (response) => (
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[response.status]}`}>
                    {response.status}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (response) => (
                  <div className="flex flex-wrap gap-2">
                    {response.status !== "reviewed" && (
                      <button
                        className="text-xs font-medium text-blue-600"
                        onClick={() => reviewResponse(response, "reviewed")}
                        type="button"
                      >
                        Mark reviewed
                      </button>
                    )}
                    {response.score < 85 && (
                      <button
                        className="text-xs font-medium text-green-600"
                        onClick={() => createActionTask(response)}
                        type="button"
                      >
                        Create task
                      </button>
                    )}
                    {response.status !== "rejected" && (
                      <button
                        className="text-xs font-medium text-red-600"
                        onClick={() => reviewResponse(response, "rejected")}
                        type="button"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            empty={
              <EmptyState
                icon={FileCheck2}
                title={responses.length ? "No responses match this filter" : "No responses submitted yet"}
                description={
                  responses.length
                    ? "Change the filter to review other submissions."
                    : "Submitted checklist and questionnaire responses will appear here for review and action creation."
                }
              />
            }
          />
        </Card>
      </div>
    </div>
  );
};

export default ResponsesPage;
