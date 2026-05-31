import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, ImageRun, PageBreak,
} from "docx";
import { writeFileSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Design tokens — AI Posture brand (indigo, from docs/favicon.svg #4f46e5)
// ---------------------------------------------------------------------------
const D = {
  primary: "312E81",   // indigo-900 — headings, header bar
  accent: "4F46E5",    // brand indigo — callout borders, subtitle
  accentBg: "EEF2FF",  // indigo-50 — callout / CTA fill
  dark: "1F2933",      // near-black body
  gray: "6B7280",      // captions, disclaimer
  light: "F1F5F9",     // table header wash
  white: "FFFFFF",
  border: "CBD5E1",
  amber: "FFF8E1",     // author-review wash

  titleSize: 48,
  subtitleSize: 28,
  h1Size: 30,
  h2Size: 24,
  bodySize: 22,
  captionSize: 18,
  headerSize: 16,

  font: "Arial",

  sectionGap: 400,
  paraAfter: 160,
  lineSpacing: 300,

  pageWidth: 12240,
  pageHeight: 15840,
  margin: 1440,
  contentWidth: 9360,
};

// ---------------------------------------------------------------------------
// Component library
// ---------------------------------------------------------------------------
function heading1(text, breakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    pageBreakBefore: breakBefore,
    spacing: { before: D.sectionGap, after: 200 },
    children: [new TextRun({ text, font: D.font, size: D.h1Size, bold: true, color: D.primary })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, font: D.font, size: D.h2Size, bold: true, color: D.primary })],
  });
}

function para(runs, opts = {}) {
  if (runs === null || runs === undefined) {
    return new Paragraph({ spacing: { after: D.paraAfter }, children: [] });
  }
  const children = typeof runs === "string"
    ? [new TextRun({ text: runs, font: D.font, size: D.bodySize, color: D.dark })]
    : Array.isArray(runs) ? runs : [];
  return new Paragraph({
    spacing: { after: D.paraAfter, line: D.lineSpacing },
    ...opts,
    children,
  });
}

function bold(text) { return new TextRun({ text, font: D.font, size: D.bodySize, bold: true, color: D.dark }); }
function italic(text) { return new TextRun({ text, font: D.font, size: D.bodySize, italics: true, color: D.dark }); }
function txt(text) { return new TextRun({ text, font: D.font, size: D.bodySize, color: D.dark }); }
function spacer() { return new Paragraph({ spacing: { after: 120 }, children: [] }); }

function caption(text) {
  return new Paragraph({
    spacing: { before: 120, after: D.paraAfter },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: D.font, size: D.captionSize, color: D.gray, italics: true })],
  });
}

function calloutBox(text) {
  const thinAccent = { style: BorderStyle.SINGLE, size: 1, color: D.accent };
  return new Table({
    width: { size: D.contentWidth, type: WidthType.DXA },
    columnWidths: [D.contentWidth],
    borders: {
      top: thinAccent, bottom: thinAccent, right: thinAccent,
      left: { style: BorderStyle.SINGLE, size: 6, color: D.accent },
    },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: D.contentWidth, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: D.accentBg },
      margins: { top: 200, bottom: 200, left: 240, right: 240 },
      children: [new Paragraph({
        spacing: { after: 0 },
        children: [new TextRun({ text, font: D.font, size: D.bodySize, color: D.accent, italics: true })],
      })],
    })] })],
  });
}

// Generic table builders -----------------------------------------------------
function cell(content, { header = false, labelCol = false, width } = {}) {
  const runs = Array.isArray(content) ? content : [
    new TextRun({
      text: content,
      font: D.font,
      size: header ? D.bodySize : D.bodySize,
      bold: header || labelCol,
      color: header ? D.white : D.dark,
    }),
  ];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: {
      type: ShadingType.CLEAR,
      fill: header ? D.primary : labelCol ? D.light : D.white,
    },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({ spacing: { after: 0, line: 276 }, children: runs })],
  });
}

function table(colWidths, headerCells, bodyRows) {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: headerCells.map((c, i) => cell(c, { header: true, width: colWidths[i] })),
    }),
    ...bodyRows.map((r) =>
      new TableRow({
        children: r.map((c, i) => cell(c, { labelCol: i === 0, width: colWidths[i] })),
      })
    ),
  ];
  return new Table({
    width: { size: D.contentWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: D.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: D.border },
      left: { style: BorderStyle.SINGLE, size: 1, color: D.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: D.border },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: D.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: D.border },
    },
    rows,
  });
}

// ---------------------------------------------------------------------------
// Title page
// ---------------------------------------------------------------------------
const ogData = readFileSync(resolve(__dirname, "../imgs/og.png"));

const titlePage = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 500 },
    children: [new ImageRun({
      data: ogData,
      transformation: { width: 460, height: 243 },
      type: "png",
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [new TextRun({ text: "One Number You Can Defend", font: D.font, size: D.titleSize, bold: true, color: D.primary })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({
      text: "Aggregated Intelligence Posture for governance, risk, and compliance leaders",
      font: D.font, size: D.subtitleSize, color: D.accent, italics: true,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "A white paper", font: D.font, size: D.bodySize, bold: true, color: D.dark })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Stewarded by PAICE.work PBC", font: D.font, size: D.bodySize, color: D.dark })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "aiposture.org", font: D.font, size: D.bodySize, color: D.accent })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "May 2026  •  Beta release for public review", font: D.font, size: D.captionSize, color: D.gray })],
  }),
];

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------
const body = [];
const P = (...a) => body.push(para(...a));
const H1 = (...a) => body.push(heading1(...a));
const H2 = (...a) => body.push(heading2(...a));
const RAW = (el) => body.push(el);

// --- Executive summary ---
H1("Executive summary");
P("Every organization adopting AI now runs at least three governance efforts at once. One tracks whether people use AI well. One tracks whether digital systems are ready for agents and partners. One tracks whether the organization meets its AI-specific legal obligations. Each produces its own dashboard. None of them produces the single answer a board, a regulator, a partner, or a customer actually asks for: how ready are you, on the whole, and can you prove it?");
P("AI Posture answers that question with one level, bounded by the weakest of its in-scope vectors. It is an output measure: it scores verified behavior, not policies, intentions, or tool purchases. It is orthogonal to NIST AI RMF, ISO/IEC 42001, and EU AI Act conformance, which govern program design and remediation. An organization can complete any of those programs and still hold a low AI Posture if the program has not yet produced behavior a third party can inspect. The reverse is also true.");
P("This paper sets out the five design choices that make AI Posture defensible: a single readiness number across three independent vectors, an externally verifiable evidence standard, aggregation by the weakest link rather than a flattering average, treatment of the score as a time-stamped signal that decays rather than a certificate that persists, and a clear boundary around what the framework does not claim to do. The recommended action for a GRC leader is concrete: stop reconciling three dashboards by hand, and start reporting one posture whose constraining vector names your next investment for you.");

// --- Section 1 ---
H1("The readiness question no dashboard answers");
P("Ask a chief information security officer, a chief AI officer, and a head of compliance the same question on the same day: are we ready for AI? You will get three confident answers that do not combine. The security lead points to agent-readiness scans and integration hardening. The AI lead points to training completion and adoption telemetry. The compliance lead points to an obligation register mapped against the jurisdictions that bind the organization. Each answer is true within its frame. None of them is the answer the board needs, because readiness is not the sum of three frames. It is the weakest of them.");
P("The gap is structural, not a tooling failure. The three efforts measure different actor classes: humans, digital systems, and regulators. They mature on different clocks and they constrain each other in ways a side-by-side dashboard cannot express. A board reading three green dashboards has no way to see that mature human practice is sitting on top of an unmet legal obligation, or that an agent-ready infrastructure is amplifying poor human judgment. The dashboards are not wrong. They are disconnected, and the disconnection is exactly where risk lives.");
P("What leaders need is a single readiness level they can state out loud, defend under inspection, and act on. That level has to do three things the dashboards cannot. It has to combine the vectors without averaging away a weak one. It has to rest on evidence rather than assertion. And it has to come with an expiry, because readiness is a moving target. The rest of this paper builds that level one design choice at a time.");

// --- Section 2 ---
H1("Why program frameworks leave the question open");
P("The reflexive response to an AI readiness question is to name a framework. We follow NIST AI RMF. We are pursuing ISO/IEC 42001 certification. We have an EU AI Act conformance program. These are serious commitments and they matter. But they answer a different question than the one the board asked. They measure whether the organization has designed a governance program, staffed it, and run its remediation discipline. They measure program inputs.");
P("AI Posture measures the output. It asks whether the work has become visible enough to be checked from outside. This distinction is not academic. An organization can hold an ISO/IEC 42001 certificate and still score Perceiving on AI Posture, because certification confirms a management system exists, not that the system has yet produced externally observable behavioral change across people, infrastructure, and regulation. Conversely, an organization can score Calibrating on AI Posture without formally adopting any named framework, provided the behavioral evidence is there to inspect.");
RAW(calloutBox("You can pass ISO/IEC 42001 and still be Perceiving. The certificate proves a program exists. AI Posture asks whether the program has changed observable behavior yet."));
P("Because the two kinds of measurement are orthogonal, they do not compete. A governance management system organizes the work; AI Posture reports whether the work has produced defensible behavior. A risk framework identifies what must be managed; AI Posture reports the maturity of the observable management output. A compliance program feeds one vector; AI Posture prevents compliance maturity from being mistaken for whole-organization readiness. Where these frameworks are required, they remain required. AI Posture does not replace them and does not substitute for them. It sits downstream of all of them and reports what they have actually moved.");

// --- Section 3 ---
H1("Intent is signal. Only behavior scores.");
P("If readiness is an output measure, the evidence standard has to be strict, because AI governance claims are already easy to overstate. A framework that accepted internal sentiment, policy aspiration, or vendor adoption as maturity would reward presentation over operating reality. AI Posture takes the opposite position. Every claim under the framework must resolve to an artifact a third party can inspect. Surveys and self-reported confidence do not qualify. Intent is signal. Only behavior scores.");
P("This is why the artifact classes are specific to each vector. People maturity rests on behavioral assessment with verifiable telemetry, measured in a privacy-preserving way, not on a training-completion percentage or an engagement survey. Infrastructure maturity rests on agent-readiness scans, machine-readable declarations, and structured identifiers across the full stack, from internal systems to partner integrations to public surfaces. Regulation maturity rests on an obligation register with verifiable coverage and recorded interpretations tied to authorities, not on a statement that the organization takes compliance seriously.");
P("The evidence standard has a sharp consequence for misrepresentation. A claim that exceeds reality is not a separate offense to be tracked; it is a signal of immaturity inside whichever vector the claim falsifies. An organization that asserts a People maturity it cannot evidence has, by that act, reduced its People score. The framework folds honesty into the measurement rather than policing it on the side. The strongest version of this rule applies to scope itself: an organization that declares a vector out of scope, then is shown to have material activity there, has not earned a low score. It has produced a claim that cannot be trusted, and that invalidates the entire posture assertion for that stamping.");

// --- Section 4 ---
H1("Three vectors, one number");
P("AI Posture v1.0 ships three vectors, each measuring a distinct actor class that can independently constrain the whole. People measures, inside-out, how effectively humans in the organization collaborate with AI. Infrastructure measures, bottom-up through the outer surface, how ready the organization's digital systems are for agent interaction. Regulation measures, top-down, how completely the organization has met its AI-specific obligations across the jurisdictions that bind it. The outer surface, how the organization presents to humans and agents, is not a fourth vector; it is the edge of the same infrastructure.");
RAW(table(
  [1900, 1900, 3760, 1800],
  ["Vector", "Span", "What it measures", "Artifact class"],
  [
    ["People", "Inside-out", "How effectively humans collaborate with AI", "Behavioral assessment with verifiable telemetry"],
    ["Infrastructure", "Bottom-up to edge", "Readiness of digital systems for agent interaction", "Agent-readiness scans, machine-readable declarations"],
    ["Regulation", "Top-down", "Completeness of AI-specific obligations met across jurisdictions", "Obligation register with verifiable coverage"],
  ],
));
RAW(caption("Table 1: The three v1.0 vectors of Aggregated Intelligence Posture"));
P("Each vector is scored on one shared five-level scale, so a single level name carries equivalent weight wherever it appears. The scale runs from awareness to systematized frontier practice, with a distinct level reserved for vectors that genuinely do not apply.");
RAW(table(
  [1500, 2400, 5460],
  ["Level", "Name", "Meaning"],
  [
    ["0", "N/A", "The vector does not apply at this time. Defines the scope boundary; excluded from the aggregate. Itself a falsifiable claim."],
    ["1", "Perceiving", "Aware the domain exists but has not acted."],
    ["2", "Assessing", "Has begun inventorying its state but has no deliberate practice."],
    ["3", "Integrating", "Deliberate practice is in place; evidence is starting to accumulate."],
    ["4", "Calibrating", "Practice is measured, tuned, and defensible to outside inspection."],
    ["5", "Engineering", "Practice is systematized; the organization advances the frontier rather than catching up."],
  ],
));
RAW(caption("Table 2: The five-level maturity model, shared across all vectors"));
P("Each vector reaches each level independently. An organization may be Engineering on Infrastructure while Assessing on People. Defensibility at Calibrating is not audience-specific: a Calibrating score must hold up to auditors, regulators, boards, partners, and customers alike, the way a healthy immune system defends against threats it has not catalogued in advance. The question that remains is how three independent vector levels become one number a board can act on. The answer is the most consequential design choice in the framework.");

// --- Section 5 ---
H1("Bounded by the weakest link");
P("AI Posture equals the minimum of its in-scope vector levels. Vectors marked N/A are excluded from the minimum. The rule is normative, not a scoring convenience, and it is deliberately not an average. Domains depend on each other in practice, and the minimum captures the true operating ceiling of a cross-domain claim: the posture is only as strong as the weakest link that supports it.");
P("An average launders an immature vector behind mature ones. Consider an organization that is Engineering on People and Calibrating on Infrastructure but Perceiving on Regulation. An average reads near Integrating and implies a cross-domain posture the Regulation vector cannot support. The minimum reads Perceiving, which is the truth: the organization cannot make a defensible compliance narrative, no matter how strong its human practice is. The same logic runs in every direction. A Calibrating Regulation score does not prove people collaborate with AI responsibly. Agent-ready infrastructure can amplify poor human practice rather than redeem it. Strength in one vector is a capability, never a substitute for aggregate maturity.");
RAW(calloutBox("The minimum prevents a mature vector from laundering an immature one. A board that sees Perceiving knows exactly which domain bounds the organization, and therefore exactly where the next dollar goes."));
P("Stress-testing the rule against realistic profiles confirms it holds where an average would mislead. A team strong on people but weak on regulation, a compliance function strong on obligations but weak on adoption, a single business unit scoring high while the enterprise scores lower: in each case the minimum names a constraining vector, and the constraining vector is both the honest ceiling and the investment case. This is the rule's quiet advantage. It does not only score the organization. It tells the practitioner what to fix next, because the vector that bounds the aggregate is the vector that, once advanced, raises the whole posture.");

// --- Section 6 ---
H1("A posture decays. A certificate pretends it does not.");
P("A certificate is a statement about a moment, printed as if it were permanent. AI readiness does not behave that way. Regulation can shift in a fortnight when a new jurisdiction begins to apply. Infrastructure changes with every deployment. Human behavior drifts as tools, tasks, policies, and incentives change. A readiness measure that ignored time would be lying within weeks of being issued.");
P("AI Posture is therefore a time-stamped assertion, not a guarantee of future state. Every report stamps the scope it covers, the date it was instantiated, and a next-review date reflecting the assessor's belief about how long the assertion is likely to hold. Each vector also carries an at-this-level-since date, because duration at a level is itself a trust signal: two organizations at the same level with different tenures are publishing truthfully different signals, and a careful reader weights them accordingly. Level 5 goes further and requires a declared review cadence plus a review artifact produced within the prior window. The organization sets the cadence; the artifact proves adherence.");
P("Freshness, then, is the reader's job, not a gate the framework enforces. A score three months past its next-review date is not invalid. It is a weaker signal, and it should be treated as one. This is also why externally imposed change does not retroactively erase maturity. A new regulation does not reduce the People practice an organization has already evidenced; it reveals where the next assertion must extend its coverage. The posture is progressive. New exposure changes what must be covered next. It does not delete the behavior already proven.");

// --- Section 7 ---
H1("What AI Posture is not");
P("A framework earns trust as much by what it refuses to claim as by what it asserts. AI Posture is not a certification, and it issues no seal. It is not an audit and collects no independent evidence on the organization's behalf; the organization self-assesses and self-asserts against a defined evidence standard, and the framework defines that standard rather than grading the work. It is not legal advice. It does not replace the named program frameworks, and where those are required they stay required.");
P("The framework is also honest about what remains open. The shared level names are intended to carry equal weight across vectors, but whether a reader interprets Calibrating the same way for people, systems, and regulation is a question still under validation. The minimum-vector rule may be correct yet under-explained, since dashboard conventions condition readers to expect averages; the framework treats persistent confusion as a reason to improve the explanation, with a spec issue reserved for the case where the rule misleads even when understood. The current three-vector set is sufficient for early adoption but deliberately open: new vectors are admitted only when they have an observable artifact, a distinct actor class, independent variation, and the ability to constrain the whole. Stating these openly is not a weakness in the framework. It is the same evidence standard turned inward.");

// --- Conclusion ---
H1("The one number you can defend");
P("The case for AI Posture reduces to a single proposition: a board, a regulator, a partner, and a customer all deserve one readiness level that is true, defensible, and current, and three disconnected dashboards cannot produce it. AI Posture produces it by measuring output behavior rather than program inputs, by holding every claim to an externally verifiable evidence standard, by aggregating to the weakest in-scope vector rather than a flattering average, and by stamping the result as a signal that decays rather than a certificate that pretends not to.");
P("For a GRC leader, the next step is concrete. Stop reconciling three readiness stories by hand. Establish the three vectors as named, independently measured inputs, then report a single Aggregated Intelligence Posture whose constraining vector names your next investment without further argument. A fast self-assessment at aiposture.org/assess produces an estimated posture as a starting point; verified per-vector measurement follows. The specification is open under CC BY 4.0, the reference code is MIT, and the framework favors no particular implementation. The number you can defend is available now. The only question is whether your organization is reporting it yet.");

// CTA
RAW(new Table({
  width: { size: D.contentWidth, type: WidthType.DXA },
  columnWidths: [D.contentWidth],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: D.accent },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: D.accent },
    left: { style: BorderStyle.SINGLE, size: 6, color: D.accent },
    right: { style: BorderStyle.SINGLE, size: 6, color: D.accent },
  },
  rows: [new TableRow({ children: [new TableCell({
    width: { size: D.contentWidth, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: D.accentBg },
    margins: { top: 240, bottom: 240, left: 280, right: 280 },
    children: [
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "About AI Posture", font: D.font, size: D.h2Size, bold: true, color: D.primary })] }),
      new Paragraph({ spacing: { after: 120, line: D.lineSpacing }, children: [new TextRun({
        text: "AI Posture is the unified governance framework for aggregated intelligence readiness, stewarded by PAICE.work PBC, a US public benefit corporation, with a planned transition to an independent steward. The specification, question bank, and rubric are published under CC BY 4.0; reference code is MIT.",
        font: D.font, size: D.bodySize, color: D.dark })] }),
      new Paragraph({ spacing: { after: 0, line: D.lineSpacing }, children: [
        bold("Read the spec and self-assess:  "),
        new TextRun({ text: "https://aiposture.org/", font: D.font, size: D.bodySize, color: D.accent }),
      ] }),
    ],
  })] })],
}));

// Disclaimer
RAW(new Paragraph({
  spacing: { before: 300, after: 100, line: 260 },
  children: [new TextRun({
    text: "This white paper is provided for informational purposes only and does not constitute legal, compliance, or professional advice. AI Posture is a maturity-assertion framework, not a certification, audit, or compliance guarantee. Organizations self-assess and self-assert; the framework defines an evidence standard, not a grader. Framework terms are in beta and may change before general availability; the specification at https://aiposture.org/ is authoritative. © 2026 PAICE.work PBC. Specification licensed CC BY 4.0; reference code MIT.",
    font: D.font, size: D.captionSize, color: D.gray,
  })],
}));

// --- Appendix ---
H1("Appendix A: Adjacent-framework crosswalk", true);
P("AI Posture is positioned as an output maturity assertion. It does not replace governance frameworks, risk frameworks, compliance programs, certifications, audits, or legal advice. The table below summarizes how it relates to each adjacent class without claiming to substitute for it.");
RAW(table(
  [2600, 3380, 3380],
  ["Adjacent class", "How AI Posture differs", "Useful relationship"],
  [
    ["Governance management systems (e.g. ISO/IEC 42001)", "Measures externally inspectable output behavior, not the existence of a program.", "The program organizes the work; AI Posture reports whether the work produced defensible behavior."],
    ["Risk frameworks (e.g. NIST AI RMF)", "Progressive maturity, not exposure scoring. New risk reveals bounded scope; it does not erase evidenced behavior.", "Risk frameworks identify what must be managed; AI Posture reports the maturity of observable output."],
    ["Compliance and legal conformance (e.g. EU AI Act)", "Regulation is one vector, not the whole. Strong compliance does not prove mature People or Infrastructure.", "Compliance programs feed the Regulation vector; AI Posture prevents that from being read as whole-org readiness."],
    ["Capability maturity models", "Applies one shared level shape across actor classes and aggregates by the minimum, not a process average.", "Maturity language aids understanding; AI Posture adds cross-vector constraint logic and time-stamps."],
    ["Behavior-change / adoption models", "People is one vector; sentiment alone is rejected as evidence in favor of inspectable, privacy-preserving behavior.", "Adoption work improves the People vector; AI Posture keeps it tied to infrastructure and regulatory constraints."],
  ],
));
RAW(caption("Table 3: How AI Posture relates to adjacent frameworks without replacing them"));

H1("Appendix B: A sample posture report", true);
P("An AI Posture report states the aggregate level, the declared scope, the stamping and next-review dates, each in-scope vector's level and tenure, the constraining vector, and the recommended next action. Vectors marked N/A are listed explicitly so the scope is legible. The illustrative report below shows the format; it is not a real assessment.");
RAW(new Table({
  width: { size: D.contentWidth, type: WidthType.DXA },
  columnWidths: [D.contentWidth],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 1, color: D.border },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: D.border },
    left: { style: BorderStyle.SINGLE, size: 1, color: D.border },
    right: { style: BorderStyle.SINGLE, size: 1, color: D.border },
  },
  rows: [new TableRow({ children: [new TableCell({
    width: { size: D.contentWidth, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: D.light },
    margins: { top: 200, bottom: 200, left: 240, right: 240 },
    children: [
      "Aggregated Intelligence Posture: Assessing",
      "Scope: Acme Corp, organizational",
      "Stamped: 2026-04-20      Next review: 2026-10-20",
      "",
      "  People:          Calibrating    since 2025-09-01",
      "  Infrastructure:  Integrating    since 2026-02-14",
      "  Regulation:      Assessing      since 2026-04-20",
      "",
      "  Constraining vector: Regulation",
      "  Recommended next action: Advance Regulation to Integrating",
    ].map((line, i) => new Paragraph({
      spacing: { after: 0, line: 264 },
      children: [new TextRun({ text: line || " ", font: "Courier New", size: 20, color: D.dark })],
    })),
  })] })],
}));
RAW(caption("Figure 1: Illustrative AI Posture report (sample data, not a real assessment)"));

// ---------------------------------------------------------------------------
// Author Validation Checklist (stripped before publication)
// ---------------------------------------------------------------------------
const checklist = [];
checklist.push(new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: "F59E0B" },
  spacing: { before: 0, after: 200 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "AUTHOR REVIEW — DO NOT DISTRIBUTE", font: D.font, size: 28, bold: true, color: "7C2D12" })],
}));
checklist.push(para("Remove this section before publication. Verify each item below."));
const checkItems = [
  "Title \"One Number You Can Defend\" approved by steward.",
  "All five argument threads present: weakest-link, output-vs-program, evidence standard, time-stamped decay, three-vector model.",
  "Vector names, spans, and artifact classes match SPEC.md Table.",
  "Five-level model wording matches SPEC.md (Perceiving/Assessing/Integrating/Calibrating/Engineering + N/A).",
  "Constraint rule stated as minimum of in-scope vectors; N/A excluded.",
  "Orthogonality claim accurate: NIST AI RMF, ISO/IEC 42001, EU AI Act govern inputs; AI Posture governs output behavior.",
  "\"Pass ISO 42001 and still Perceiving\" claim is defensible and not overstated.",
  "Misrepresentation-as-immaturity and falsified-N/A-invalidates-stamping rules match SPEC.md.",
  "Sample report is labeled illustrative / not a real assessment.",
  "Licensing stated correctly: spec CC BY 4.0, code MIT; steward PAICE.work PBC.",
  "Canonical URL https://aiposture.org/ used throughout; no www, no http.",
  "Beta status disclosed; terms may change.",
];
checkItems.forEach((it) => checklist.push(new Paragraph({
  spacing: { after: 100, line: 276 },
  children: [new TextRun({ text: "☐  " + it, font: D.font, size: D.bodySize, color: D.dark })],
})));

// ---------------------------------------------------------------------------
// Assemble document
// ---------------------------------------------------------------------------
const bodyHeader = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "AI Posture  •  One Number You Can Defend", font: D.font, size: D.headerSize, color: D.gray })],
  })],
});
const bodyFooter = new Footer({
  children: [new Paragraph({
    style: "FooterStyle",
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "© 2026 PAICE.work PBC  •  Page ", font: D.font, size: D.headerSize, color: D.gray }),
      new TextRun({ children: [PageNumber.CURRENT], font: D.font, size: D.headerSize, color: D.gray }),
    ],
  })],
});

const doc = new Document({
  styles: {
    paragraphStyles: [
      { id: "FooterStyle", name: "Footer Style", basedOn: "Normal", run: { font: D.font, size: D.headerSize, color: D.gray }, paragraph: {} },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: D.pageWidth, height: D.pageHeight }, margin: { top: D.margin, bottom: D.margin, left: D.margin, right: D.margin } } },
      children: titlePage,
    },
    {
      properties: { page: { size: { width: D.pageWidth, height: D.pageHeight }, margin: { top: D.margin, bottom: D.margin, left: D.margin, right: D.margin } } },
      headers: { default: bodyHeader },
      footers: { default: bodyFooter },
      children: body,
    },
    {
      properties: {
        page: {
          size: { width: D.pageWidth, height: D.pageHeight },
          margin: { top: D.margin, bottom: D.margin, left: D.margin, right: D.margin },
          borders: undefined,
        },
      },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "AUTHOR REVIEW — DO NOT DISTRIBUTE", font: D.font, size: D.headerSize, bold: true, color: "7C2D12" })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Author tool — strip before publishing", font: D.font, size: D.headerSize, color: "7C2D12" })] })] }) },
      children: [new Paragraph({ pageBreakBefore: true, children: [] }), ...checklist],
    },
  ],
});

const out = resolve(__dirname, "ai-posture-whitepaper.docx");
Packer.toBuffer(doc).then((buf) => {
  writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes");
});
