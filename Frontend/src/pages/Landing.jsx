import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import logoPng from "../assets/logo.png";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Code2,
  Database,
  FileText,
  Files,
  Image,
  //   Linkedin,
  Lock,
  MessageSquare,
  MoonStar,
  Play,
  Quote,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  X,
  Zap,
} from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";

const features = [
  {
    icon: Brain,
    title: "AI Assistant",
    description:
      "Ask questions in natural language and get context-aware answers from your documents.",
  },
  {
    icon: Files,
    title: "Multi-Document Analysis",
    description:
      "Compare and synthesize insight across PDFs, DOCX files, spreadsheets, text, and images.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Find the right passage instantly with retrieval that understands intent, not just keywords.",
  },
  {
    icon: BarChart3,
    title: "Spreadsheet Intelligence",
    description:
      "Work with CSV and XLSX data using intelligent table-aware analysis and summaries.",
  },
  {
    icon: Image,
    title: "OCR Image Understanding",
    description:
      "Extract and reason over text inside images, scanned pages, and visual documents.",
  },
  {
    icon: Scale,
    title: "Compare Documents",
    description:
      "Surface contradictions, overlaps, and changes across multiple files with clarity.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat",
    description:
      "A clean chat workspace designed for fast follow-up questions and structured research.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description:
      "Keep access controlled with the auth flow already built into the platform.",
  },
  {
    icon: MoonStar,
    title: "Dark Mode",
    description:
      "A polished light and dark theme that feels premium in every environment.",
  },
  {
    icon: Zap,
    title: "Fast Local AI with Ollama",
    description:
      "Use local LLM workflows for fast, private, low-friction document intelligence.",
  },
];

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Documents",
    description:
      "Drop in PDFs, DOCX, TXT, CSV, XLSX, or images and let the workspace ingest them.",
  },
  {
    number: "02",
    icon: Database,
    title: "AI Indexes Content",
    description:
      "The platform extracts, chunks, and prepares your content for retrieval and analysis.",
  },
  {
    number: "03",
    icon: Brain,
    title: "Ask Questions",
    description:
      "Use plain English to query single files or whole collections of documents at once.",
  },
  {
    number: "04",
    icon: MessageSquare,
    title: "Get Intelligent Answers",
    description:
      "Receive concise, cited, and actionable responses grounded in your source material.",
  },
];

const testimonials = [
  {
    name: "Ava Chen",
    role: "Product Lead, Atlas Studio",
    quote:
      "DocuMind AI replaced three separate tools in our workflow. The document comparison and summarization flow is excellent.",
  },
  {
    name: "Noah Patel",
    role: "Analyst, Northstar Ops",
    quote:
      "The semantic search feels genuinely intelligent. I can jump between files and still get grounded answers instantly.",
  },
  {
    name: "Mia Rodriguez",
    role: "Founder, SignalLayer",
    quote:
      "The UI feels like a premium AI product. Fast, focused, and polished across dark and light mode.",
  },
];

const faqItems = [
  {
    question: "What file formats are supported?",
    answer:
      "DocuMind AI supports PDF, DOCX, TXT, CSV, XLSX, and image uploads for OCR-powered analysis.",
  },
  {
    question: "Is my data secure?",
    answer:
      "The app uses authenticated access and is designed around your existing secure document workflow.",
  },
  {
    question: "Can I use local AI models?",
    answer:
      "Yes. The platform includes support for local LLM workflows via Ollama.",
  },
  {
    question: "Does it support multiple documents?",
    answer:
      "Yes. Multi-document RAG is one of the core capabilities of the product.",
  },
  {
    question: "Can I compare files?",
    answer:
      "Yes. You can compare documents to identify overlaps, changes, and contradictions quickly.",
  },
];

const comparisonRows = [
  ["AI understanding", true],
  ["Multi-file analysis", true],
  ["Natural language queries", true],
  ["Instant summaries", true],
  ["Document comparison", true],
  ["Local LLM support", true],
];

const featureVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

const SectionHeading = ({ eyebrow, title, description, center = false }) => (
  <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
      {eyebrow}
    </p>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
      {title}
    </h2>
    <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
      {description}
    </p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.article
    variants={featureVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    custom={delay}
    whileHover={{ y: -6, scale: 1.01 }}
    className="group rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-shadow hover:shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900/75"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition-transform group-hover:scale-105 dark:bg-white dark:text-slate-900">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
      {title}
    </h3>
    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
      {description}
    </p>
  </motion.article>
);

const PricingCard = ({ title, badge, items, featured = false, delay = 0 }) => (
  <motion.article
    variants={featureVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    custom={delay}
    whileHover={{ y: -4 }}
    className={`rounded-3xl border p-6 transition-transform ${
      featured
        ? "border-primary/30 bg-gradient-to-br from-primary/10 via-white to-cyan-100/60 shadow-[0_22px_60px_rgba(37,99,235,0.12)] dark:from-primary/20 dark:via-slate-900 dark:to-slate-900"
        : "border-slate-200 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/75"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {badge}
        </p>
      </div>
      <span className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Coming Soon
      </span>
    </div>

    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
        >
          <Check className="h-4 w-4 text-primary" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </motion.article>
);

const FaqItem = ({ item, isOpen, onToggle }) => (
  <motion.div
    layout
    className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/75"
  >
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 text-left"
      aria-expanded={isOpen}
    >
      <span className="text-base font-semibold text-slate-900 dark:text-white">
        {item.question}
      </span>
      <ChevronDown
        className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
      />
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <p className="pt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {item.answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const Landing = () => {
  const reduceMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState(0);
  const stars = [0, 1, 2, 3, 4];

  return (
    <div className="relative overflow-hidden bg-background text-slate-900 dark:text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-8rem] h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute right-[-10rem] top-[10rem] h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute bottom-[-8rem] left-[20%] h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/15" />
      </div>

      <Navbar />

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-primary" /> AI document
                intelligence, redesigned
              </span>

              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
                Chat with Documents.
                <span className="block bg-gradient-to-r from-primary via-cyan-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Think with AI.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                Upload files, analyze documents, compare information, generate
                code, and get intelligent answers powered by AI.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#showcase"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
                >
                  <Play className="h-4 w-4" /> Watch Demo
                </a>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["50+", "supported document flows"],
                  ["1 workspace", "for every data source"],
                  ["Local AI", "via Ollama"],
                ].map(([value, label]) => (
                  <div
                    key={value}
                    className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <p className="text-2xl font-semibold text-slate-950 dark:text-white">
                      {value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }
              }
              animate={
                reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
              }
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -left-8 top-6 hidden rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-xl backdrop-blur-xl lg:block dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  <FileText className="h-4 w-4 text-primary" /> PDF
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                  Contract brief.pdf
                </p>
              </div>

              <div className="absolute -right-6 top-24 hidden rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-xl backdrop-blur-xl lg:block dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  <Image className="h-4 w-4 text-primary" /> OCR
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                  Scanned receipt.png
                </p>
              </div>

              <div className="relative rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/70 sm:p-6">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-fuchsia-500/10" />

                <div className="relative grid gap-4 sm:grid-cols-[1fr_0.92fr]">
                  <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-lg dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                          AI workspace
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          DocuMind Dashboard
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Live
                      </span>
                    </div>

                    <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-900">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            Ask your documents anything
                          </p>
                          <p className="text-xs text-slate-400">
                            Semantic retrieval and grounded answers
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-300">
                        <p>
                          Which clauses changed between the latest PDF versions?
                        </p>
                        <p>Show the main risks and generate a summary.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ["Documents indexed", "128"],
                        ["Answers generated", "4.8k"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {label}
                          </p>
                          <p className="mt-2 text-xl font-semibold text-white">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-rows-[1fr_auto]">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <Bot className="h-4 w-4 text-primary" /> AI Response
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <p>
                          I found three documents that mention updated payment
                          terms.
                        </p>
                        <p>
                          The newest version shortens the approval window from
                          14 days to 7 days.
                        </p>
                        <div className="rounded-2xl bg-primary-light p-3 text-sm text-primary dark:bg-primary/20 dark:text-cyan-200">
                          Sources: PDF, DOCX, XLSX
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <Scale className="h-4 w-4 text-primary" /> Compare
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          Detect differences across files in seconds.
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <Search className="h-4 w-4 text-primary" /> Search
                        </div>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          Read and understand scanned documents and images.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -10, 0], rotate: [0, 1.2, 0] }
                  }
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-8 left-1/2 hidden -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-xl backdrop-blur-xl sm:block dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {["PDF", "DOCX", "XLSX", "TXT", "Images"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <SectionHeading
              eyebrow="Features"
              title="Everything you need to turn documents into answers"
              description="A focused set of AI workflows built for document intelligence, retrieval, comparison, and analysis."
            />
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.05}
              />
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
            >
              <SectionHeading
                eyebrow="How It Works"
                title="A simple flow with an intelligent engine behind it"
                description="The experience is intentionally minimal. The system does the hard work of parsing, indexing, and responding."
              />

              <div className="mt-8 space-y-4">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className="flex gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                          {step.number}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              className="relative"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Upload documents",
                    desc: "Drag and drop multiple file types at once.",
                    icon: Upload,
                  },
                  {
                    title: "Index and chunk",
                    desc: "Split content for retrieval and context-aware reasoning.",
                    icon: Database,
                  },
                  {
                    title: "Ask questions",
                    desc: "Use natural language to explore your knowledge base.",
                    icon: MessageSquare,
                  },
                  {
                    title: "Get grounded answers",
                    desc: "Receive concise responses with source awareness.",
                    icon: Brain,
                  },
                ].map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      whileHover={{ y: -5, scale: 1.01 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      className={`rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 ${index === 0 || index === 3 ? "sm:translate-y-6" : ""}`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary dark:bg-primary/20 dark:text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {card.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0 -z-10 hidden rounded-[2rem] bg-gradient-to-tr from-primary/10 via-transparent to-fuchsia-500/10 blur-3xl sm:block" />
            </motion.div>
          </div>
        </section>

        <section
          id="showcase"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <SectionHeading
              eyebrow="Product Showcase"
              title="A polished workspace that feels like a premium AI product"
              description="The dashboard, chat, compare, and upload experiences are designed to feel focused and powerful."
            />
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Chat Interface
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Responsive AI assistant with cited answers
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  Active
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[0.72fr_1.28fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Documents
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Q2_Strategy.pdf",
                      "Engineering_Notes.docx",
                      "Sales_Leads.xlsx",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 dark:bg-slate-900"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white dark:border-slate-800">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                    <MessageSquare className="h-4 w-4 text-primary" /> AI
                    Response
                  </div>
                  <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
                    <p className="text-sm leading-6 text-slate-200">
                      The latest strategy PDF and the spreadsheet show the same
                      launch date, but the DOCX contains updated budget
                      assumptions. I can summarize the differences or generate a
                      comparison table.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Sources", "3 files cited"],
                      ["Answer mode", "Grounded summary"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6">
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Scale className="h-4 w-4 text-primary" /> Document Comparison
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Track changes across versions",
                    "Highlight conflicting statements",
                    "Summarize delta across files",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-800"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="h-4 w-4 text-cyan-300" /> Local LLM Ready
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Designed to work with local models through Ollama when privacy
                  and speed matter.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {["Private", "Fast", "Flexible"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white/8 px-3 py-1"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <SectionHeading
              eyebrow="Why DocuMind AI"
              title="Built for deeper understanding, not just retrieval"
              description="Traditional search surfaces documents. DocuMind AI interprets them, compares them, and responds to your question in context."
            />
          </motion.div>

          <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <div>Capability</div>
              <div>Traditional Search</div>
              <div>DocuMind AI</div>
            </div>

            {comparisonRows.map(([label, traditional]) => (
              <div
                key={label}
                className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center border-b border-slate-100 px-6 py-4 last:border-b-0 dark:border-slate-800/80"
              >
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {label}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  {traditional ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-slate-400" />
                  )}
                  {traditional ? "Partial" : "No"}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                  <Check className="h-4 w-4 text-primary" /> Yes
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <SectionHeading
              eyebrow="Pricing"
              title="Flexible plans are on the way"
              description="Pricing is coming soon, but the platform is already designed to support individual users, power users, and teams."
            />
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <PricingCard
              title="Free"
              badge="For early exploration"
              items={[
                "Single workspace",
                "Document chat",
                "Basic upload and search",
              ]}
              delay={0}
            />
            <PricingCard
              title="Pro"
              badge="For serious daily use"
              items={[
                "Multi-document RAG",
                "OCR and comparison workflows",
                "Advanced summaries",
              ]}
              featured
              delay={0.05}
            />
            <PricingCard
              title="Team"
              badge="For shared knowledge work"
              items={[
                "Shared document libraries",
                "Local LLM support",
                "Authentication and workspace control",
              ]}
              delay={0.1}
            />
          </div>
        </section>

        <section
          id="testimonials"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <SectionHeading
              eyebrow="Testimonials"
              title="Loved by people who work with information all day"
              description="A calm, focused interface makes it easier to stay in flow while working with complex documents."
            />
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.article
                key={item.name}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                custom={index * 0.05}
                className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {stars.map((starIndex) => (
                    <Star key={starIndex} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <Quote className="mt-5 h-8 w-8 text-primary/60" />
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.quote}
                </p>
                <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.role}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <SectionHeading
              eyebrow="FAQ"
              title="Quick answers to the most common questions"
              description="If you need deeper detail, the app itself is designed for fast exploration once you sign in."
            />
          </motion.div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {faqItems.map((item, index) => (
              <FaqItem
                key={item.question}
                item={item}
                isOpen={openFaq === index}
                onToggle={() =>
                  setOpenFaq((current) => (current === index ? -1 : index))
                }
              />
            ))}
          </div>
        </section>

        <section
          id="about"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="rounded-[2.25rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-10 text-white shadow-[0_30px_100px_rgba(15,23,42,0.2)] sm:px-10 sm:py-12"
          >
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  About
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Built for teams that need one place to search, summarize, and
                  compare documents.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  DocuMind AI combines document intelligence and conversational
                  AI into a single premium workspace. It is designed for
                  privacy-aware, fast-moving teams that need more than keyword
                  search.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Fast", "Local-first workflows and smooth UX"],
                    ["Secure", "Authentication and controlled access"],
                    ["Flexible", "Works across docs, data, and images"],
                  ].map(([label, desc]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    >
                      <p className="text-sm font-semibold text-white">
                        {label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                  <ShieldCheck className="h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Private by design
                    </p>
                    <p className="text-sm text-slate-300">
                      Built to fit local AI and secured workflows.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                  <Code2 className="h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Developer-friendly
                    </p>
                    <p className="text-sm text-slate-300">
                      Clean architecture ready for real product use.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                  <MoonStar className="h-5 w-5 text-cyan-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Light and dark mode
                    </p>
                    <p className="text-sm text-slate-300">
                      A polished interface in every theme.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="rounded-[2.25rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-primary to-cyan-600 px-6 py-12 text-white shadow-[0_30px_90px_rgba(37,99,235,0.22)] sm:px-10"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
                  Final CTA
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Turn Your Documents Into Knowledge.
                </h2>
                <p className="mt-4 text-base leading-7 text-cyan-100/90">
                  Start exploring your files with AI, compare content, extract
                  answers, and unlock a more intelligent document workflow.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 px-4 py-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <img
                                src={logoPng}
                                alt="DocuMind AI"
                                className="h-9 w-9 rounded-2xl object-contain"
                              />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  DocuMind AI
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Document intelligence platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            {[
              ["Features", "#features"],
              ["Privacy", "#about"],
              ["Terms", "#faq"],
              ["Contact", "#about"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:text-primary"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900"
            >
              <Code2 className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900"
            >
              <Sparkles className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
