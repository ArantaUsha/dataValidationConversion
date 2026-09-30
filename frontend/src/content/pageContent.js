// All page copy lives here (from the approved page-content document). Components only render it.

export const REPO_URL = "https://github.com/ArantaUsha/dataValidationConversion";

export const hero = {
  eyebrow: "PROJECT",
  headline: ["Understanding business problems.", "Building reusable solutions."],
  copy:
    "A portfolio recreation inspired by a banking reporting solution I worked on, transforming large financial datasets into report-ready data through mapping, business rules and validation.",
  label: "Portfolio recreation \u00b7 Fictional demonstration data \u00b7 No client data used",
  cta: "Explore the solution ↓",
};

export const beforeAfter = {
  title: "Before vs after",
  subtitle: "A large reduction in preparation time and manual effort.",
  before: {
    label: "Before",
    figure: "20-25 days",
    caption: "Manual report preparation",
    points: ["Manual preparation", "Data interpretation and mapping", "Multiple transformation steps", "Rework when source data had errors"],
  },
  after: {
    label: "After",
    figure: "~1 day / file",
    caption: "Automated transformation workflow",
    points: [
      "Automated transformation",
      "Excel/reference-data mapping",
      "Quality checks before downstream reporting",
      "Faster reprocessing of corrected source files",
    ],
  },
  note: "Project-reported / remembered outcome, not a benchmark study.",
};

export const problem = {
  title: "The problem",
  subtitle: "Large, complex and time-consuming manual process",
  metrics: [
    { figure: "60K-70K", label: "records per XML file" },
    { figure: "25", label: "reporting datasets" },
    { figure: "3", label: "reporting cycles: monthly, quarterly and annual" },
    { figure: "Multiple", label: "business, operations and reporting stakeholders" },
  ],
  context:
    "Large financial reporting datasets had to be prepared from raw XML before they could be processed by the downstream reporting platform.",
};

export const solution = {
  title: "The solution",
  subtitle: "A reusable data transformation workflow",
  excelNote: "Excel + Business Rules",
  nodes: [
    { title: "Raw XML", text: "Large input files containing financial reporting data." },
    { title: "Parse & extract", text: "Read the XML structure and extract reporting records." },
    { title: "Transform", text: "Apply mappings and business rules using Python and reference data." },
    { title: "Quality checks", text: "Detect data-quality issues, such as duplicates and missing mappings, and prepare clear error information." },
    { title: "JSONL output", text: "Produce standardized report-ready records." },
    { title: "Reporting", text: "The downstream platform maps values to report rows and columns and validates the report." },
  ],
  conversionsTitle: "Three of the things the transformation does",
  conversions: [
    { label: "Excel mapping", source: "EBA_FIN_X01" },
    { label: "Number handling", source: "1250000.50" },
    { label: "Boolean handling", source: "FALSE" },
  ],
};

export const record = {
  title: "See one record transformed",
  subtitle: "Follow a single record through the process.",
  button: "Run example transformation",
  endLabel: "One source value → one report-ready value",
  note: "The displayed values are fictional and exist only to explain the transformation concept.",
  stages: [
    { title: "XML input", waiting: "The source record appears here." },
    { title: "Excel mapping", waiting: "The hierarchy lookup appears here." },
    { title: "Business rule", waiting: "The rule that applies appears here." },
    { title: "JSONL output", waiting: "The report-ready record appears here." },
  ],
  latestNote: "The latest dated hierarchy entry is used.",
};

export const excel = {
  title: "Excel mappings and business rules",
  subtitle: "Reference data and client-provided rules drive the transformation.",
  columns: ["Domain Code", "Member Code", "Structure"],
  rules: [
    { title: "Generic transformation", text: "Shared across reports" },
    { title: "Report-specific rules", text: "Additional rules for special requirements" },
    { title: "Type normalization", text: "Numbers and booleans, not strings" },
    { title: "Duplicate detection", text: "Same value, row and column" },
  ],
  note: "Business rules were originally provided by client teams. This recreation uses fictional data and representative rules.",
};

export const errors = {
  title: "When data is not ready",
  subtitle: "Make the issue clear, correct the source, and reprocess.",
  steps: [
    { title: "Duplicate or invalid record", text: "Highlighted with its exact location." },
    { title: "Correct source XML", text: "The business user fixes the input." },
    { title: "Reprocess", text: "The entire file is processed again." },
  ],
  copy:
    "The original workflow highlighted the relevant source issue, the business user corrected the XML, and the entire file was processed again.",
};

export const jsonlReport = {
  title: "JSONL to reporting",
  subtitle: "Standardized output consumed by downstream reporting.",
  copy:
    "Each transformed value is associated with a report row and column so the downstream reporting platform can place it in the appropriate report position.",
};

export const builtWith = {
  title: "Built with",
  items: [
    { name: "Python", text: "XML parsing, transformation and business rules." },
    { name: "Pandas", text: "Data processing and Excel-based reference data handling." },
    { name: "XML", text: "Source format containing reporting records." },
    { name: "Excel", text: "Reference mappings and business-rule support data." },
    { name: "JSONL", text: "Standardized line-by-line output for downstream processing." },
  ],
};

export const demonstrates = {
  title: "More than a data transformation exercise",
  items: [
    { name: "Business understanding", text: "Translating a real reporting problem into a practical workflow." },
    { name: "Data & Excel", text: "Working with large structured datasets and reference data." },
    { name: "Solution thinking", text: "Designing reusable transformations instead of one-off manual steps." },
    { name: "Delivery mindset", text: "Considering validation, errors, reprocessing and downstream consumption." },
  ],
};

export const explore = {
  title: "Explore the implementation",
  copy: "View the code, sample data and supporting documentation.",
  cta: "View on GitHub →",
};
