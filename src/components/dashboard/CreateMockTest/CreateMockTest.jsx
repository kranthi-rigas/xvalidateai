import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Step1Form from "./Step1Form";
import Step2Questions from "./Step2Questions";
import ListView from "./ListView";
import PageLoader from "../../common/PageLoader";
import usePageLoader from "@/data/usePageLoader";
import useToast from "../../../hooks/useToast";

import {
  fetchAllExams,
  createExam as createExamAPI,
  fetchQuestionsByExamId,
  fetchFilteredQuestions,
  saveQuestion,
  deleteQuestion,
  saveDraftQuestions,
  publishExam,
} from "../../../apiIntegration/mockTests";

// 🔹 Used ONLY for initial page load
const loadExams = async (showPageLoader = false) => {
  if (showPageLoader) setLoadingExams(true);

  try {
    const data = await fetchAllExams();
    setAllExams(data.exams || []);
  } catch (err) {
    console.error(err);
  } finally {
    if (showPageLoader) setLoadingExams(false);
  }
};

// 🔹 Used ONLY for table refresh button
const refreshTableOnly = async () => {
  const data = await fetchAllExams();
  setAllExams(data.exams || []);
};

export default function CreateMockTest() {
  const navigate = useNavigate();

  /* ---------------- Mode ---------------- */
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [step, setStep] = useState(1);

  /* ---------------- Step-1 fields ---------------- */
  const [quizTitle, setQuizTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("");
  const [duration, setDuration] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [examDate, setExamDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  /* ---------------- Step-2 fields ---------------- */
  const [createdExamId, setCreatedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filter, setFilter] = useState({
    examType: "",
    subject: "",
    category: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);

  const show = useToast();

  /* ---------------- Question Helper ---------------- */
  const makeEmptyQuestion = () => ({
    subject: "",
    topic: "",
    type: "radio-button",
    marks: 1,
    negative: 0,
    difficulty: "Medium",
    question: "",
    options: ["", "", "", ""],
    correct: "",
    solution: "",
  });

  const [newQ, setNewQ] = useState(makeEmptyQuestion());

  const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  /* ---------------- Load Exams ---------------- */
  const [allExams, setAllExams] = useState(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const pageLoading = usePageLoader([allExams]);

  const loadExams = async () => {
    setLoadingExams(true);
    try {
      const data = await fetchAllExams();
      setAllExams(data.exams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const didFetch = useRef(false);
  useEffect(() => {
    loadExams(true); // ✅ show FULL PAGE spinner ONLY on first load
  }, []);

  /* ---------------- Load Questions ---------------- */
  const loadQuestions = async (examId) => {
    setIsFetchingQuestions(true);
    try {
      const data = await fetchQuestionsByExamId(examId);
      setQuestions(data.questions || []);
    } finally {
      setIsFetchingQuestions(false);
    }
  };

  /* ---------------- Create Exam ---------------- */
  const handleCreateExam = async () => {
    setSubmitted(true);

    const newErrors = {};
    if (!quizTitle) newErrors.quizTitle = "Required";
    if (!description) newErrors.description = "Required";
    if (!examType) newErrors.examType = "Required";
    if (!duration) newErrors.duration = "Required";
    if (!questionCount) newErrors.questionCount = "Required";
    if (!examDate) newErrors.examDate = "Required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsCreating(true);

    try {
      const payload = {
        exam: examType,
        title: quizTitle,
        description,
        duration: String(duration),
        year: String(examDate.getFullYear()),
        total_questions: String(questionCount),
        metadata: {},
      };

      const data = await createExamAPI(payload);

      if (data?.exam_id) {
        setCreatedExamId(data.exam_id);
        await loadQuestions(data.exam_id);
        setStep(2);
      } else {
        show("Failed to create exam", { type: "error" });
      }
    } catch (err) {
      console.error(err);
      show("Failed to create exam", { type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  /* ---------------- Filter Questions ---------------- */
  const handleFetchFilteredQuestions = async (newFilter) => {
    const filters = {};
    if (newFilter.examType) filters.exam = newFilter.examType;
    if (newFilter.subject) filters.subject = newFilter.subject;
    if (newFilter.category) filters.category = newFilter.category;

    const data = await fetchFilteredQuestions(filters);
    setQuestions(data.questions || []);
  };

  /* ---------------- Save Question ---------------- */
  const saveNewQuestion = async () => {
    if (!newQ.subject || !newQ.question || !newQ.correct) {
      alert("Please fill required fields");
      return;
    }

    const formattedOptions = newQ.options.map((opt, i) => ({
      name: ["1", "2", "3", "4"][i],
      value: opt,
    }));

    const correctIndex = newQ.options.indexOf(newQ.correct);

    await saveQuestion({
      examId: createdExamId,
      questionId: editingQuestion,
      isEdit: !!editingQuestion,
      payload: {
        question_id: editingQuestion || generateUUID(),
        exam_id: createdExamId,
        qno: questions.length + 1,
        subject: newQ.subject,
        topic: newQ.topic,
        question: newQ.question,
        type: newQ.type,
        marks: newQ.marks,
        negative_marks: newQ.negative,
        difficulty: newQ.difficulty,
        options: formattedOptions,
        correct_option: ["1", "2", "3", "4"][correctIndex],
        solution: newQ.solution,
        metadata: {},
      },
    });

    await loadQuestions(createdExamId);
    setShowModal(false);
    setEditingQuestion(null);
    setNewQ(makeEmptyQuestion());
    show("Saved", { type: "success" });
  };

  /* ---------------- Delete Question ---------------- */
  const handleDelete = async (qid) => {
    if (!window.confirm("Delete question?")) return;
    await deleteQuestion(qid);
    await loadQuestions(createdExamId);
    show("Deleted", { type: "success" });
  };

  /* ---------------- Edit Question ---------------- */
  const handleEdit = (q) => {
    setEditingQuestion(q.question_id);
    setNewQ({
      subject: q.subject,
      topic: q.topic,
      type: q.type,
      marks: q.marks,
      negative: q.negative_marks,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options?.map((o) => o.value) || ["", "", "", ""],
      correct: q.options?.find((o) => o.name === q.correct_option)?.value || "",
      solution: q.solution,
    });
    setShowModal(true);
  };

  /* ---------------- Save Draft ---------------- */
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await saveDraftQuestions(createdExamId, selectedQuestions);
      show("Saved Draft", { type: "success" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  /* ---------------- Publish ---------------- */
  const finalizeMock = async () => {
    await publishExam(createdExamId);
    show("Published Successfully", { type: "success" });
    setShowCreateForm(false);
    setStep(1);
    loadExams();
  };

  if (pageLoading) {
    return <PageLoader loading={true} />;
  }

  return (
    <div className="dashboard__content">
      <div className="dashboard-body">
        {!showCreateForm ? (
          <ListView
            allExams={allExams}
            fetchAllExams={refreshTableOnly}
            setShowCreateForm={setShowCreateForm}
            setStep={setStep}
            setQuizTitle={setQuizTitle}
            setDescription={setDescription}
            setExamType={setExamType}
            setDuration={setDuration}
            setQuestionCount={setQuestionCount}
            setExamDate={setExamDate}
            setCreatedExamId={setCreatedExamId}
            setQuestions={setQuestions}
            setErrors={setErrors}
            setSubmitted={setSubmitted}
          />
        ) : step === 1 ? (
          <Step1Form
            quizTitle={quizTitle}
            setQuizTitle={setQuizTitle}
            description={description}
            setDescription={setDescription}
            examType={examType}
            setExamType={setExamType}
            duration={duration}
            setDuration={setDuration}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            examDate={examDate}
            setExamDate={setExamDate}
            errors={errors}
            setErrors={setErrors}
            createExam={handleCreateExam}
            setShowCreateForm={setShowCreateForm}
            isCreating={isCreating}
            submitted={submitted}
            setSubmitted={setSubmitted}
          />
        ) : (
          <Step2Questions
            questions={questions}
            filter={filter}
            setFilter={setFilter}
            fetchFilteredQuestions={handleFetchFilteredQuestions}
            saveNewQuestion={saveNewQuestion}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            finalizeMock={finalizeMock}
            showModal={showModal}
            setShowModal={setShowModal}
            newQ={newQ}
            setNewQ={setNewQ}
            editingQuestion={editingQuestion}
            setEditingQuestion={setEditingQuestion}
            isFetchingQuestions={isFetchingQuestions}
            saveDraftQuestions={handleSaveDraft}
            selectedQuestions={selectedQuestions}
            setSelectedQuestions={setSelectedQuestions}
            isSavingDraft={isSavingDraft}
          />
        )}
      </div>
    </div>
  );
}
