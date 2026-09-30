import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { snapshot } from "../data/selectors.js";

const SECTION_ORDER = [
  "Before vs after",
  "The problem",
  "The solution",
  "See one record transformed",
  "Excel mappings and business rules",
  "When data is not ready",
  "JSONL to reporting",
  "Built with",
  "More than a data transformation exercise",
];

describe("landing page", () => {
  it("tells the story in one continuous page, in the approved order, with no tabs", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Understanding business problems.");
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, SECTION_ORDER.length)).toEqual(SECTION_ORDER);
    expect(headings.at(-1)).toBe("Explore the implementation");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText(/upload/i)).not.toBeInTheDocument();
  });

  it("puts Before vs After straight after the hero", () => {
    render(<App />);
    const sections = document.querySelectorAll("main > *");
    expect(sections[1]).toHaveAttribute("id", "before-after");
  });

  it("shows the recreation label once, as a small label rather than a repeated disclaimer", () => {
    render(<App />);
    const label = "Portfolio recreation \u00b7 Fictional demonstration data \u00b7 No client data used";
    expect(screen.getAllByText(label)).toHaveLength(1);
    expect(screen.queryByText(/does not use client data/i)).not.toBeInTheDocument();
  });

  it("calls the pipeline stage 'Quality checks' and leaves report validation to the Reporting stage", () => {
    render(<App />);
    const pipeline = document.querySelector("#solution .pipeline");
    const titles = [...pipeline.querySelectorAll("strong")].map((n) => n.textContent);
    expect(titles).toEqual(["Raw XML", "Parse & extract", "Transform", "Quality checks", "JSONL output", "Reporting"]);
    expect(within(pipeline).getByText(/validates the report/i)).toBeInTheDocument();
    expect(within(pipeline).queryByText("Validate")).not.toBeInTheDocument();
  });

  it("does not repeat the 20-25 days figure in the Problem section", () => {
    render(<App />);
    const problem = document.querySelector("#problem");
    expect(within(problem).queryByText(/20-25/)).not.toBeInTheDocument();
    expect(within(problem).getByText(/monthly, quarterly and annual/i)).toBeInTheDocument();
    expect(screen.getAllByText("20-25 days")).toHaveLength(1); // only in Before vs After
  });

  it("offers exactly one interactive control besides links", () => {
    render(<App />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("bridge between the problem and the solution", () => {
  it("is a compact three-item line placed between The problem and The solution", () => {
    render(<App />);
    const bridge = screen.getByRole("group", { name: "What I focused on" });
    expect(screen.getByText("What I focused on")).toBeInTheDocument();
    const items = within(bridge).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Understand the data", "Translate the rules", "Design for reuse"]);
    const order = [...document.querySelectorAll("main > *")].map((n) => n.id || n.getAttribute("aria-label") || n.className);
    const p = order.indexOf("problem");
    expect(order[p + 1]).toBe("What I focused on");
    expect(order[p + 2]).toBe("solution");
  });

  it("adds no heading and no control", () => {
    render(<App />);
    expect(screen.queryByRole("heading", { name: "What I focused on" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("signature interaction: Run example transformation", () => {
  const stage = (n) => screen.getByTestId(`stage-${n}`);

  it("is understandable before clicking: source shown, later stages waiting", () => {
    render(<App />);
    expect(within(stage(1)).getByText(snapshot.example.stages.xml_input)).toBeInTheDocument();
    expect(within(stage(2)).getByText(/appears here/i)).toBeInTheDocument();
    expect(within(stage(4)).queryByText(snapshot.example.stages.jsonl_output)).not.toBeInTheDocument();
  });

  it("reveals XML input, Excel mapping, business rule and JSONL output from the processor snapshot", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Run example transformation" }));

    const s = snapshot.example.stages;
    expect(within(stage(1)).getByText(s.xml_input)).toBeInTheDocument();
    expect(within(stage(2)).getByText("Corporate Lending")).toBeInTheDocument();
    expect(within(stage(2)).getByText("FIN")).toBeInTheDocument();
    expect(within(stage(3)).getByText(s.business_rule)).toBeInTheDocument();
    expect(within(stage(4)).getByText(s.jsonl_output)).toBeInTheDocument();
    expect(screen.getByText("One source value → one report-ready value")).toBeInTheDocument();
  });

  it("works from the keyboard and can be replayed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab(); // hero CTA link
    const button = screen.getByRole("button", { name: "Run example transformation" });
    button.focus();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(within(stage(4)).getByText(snapshot.example.stages.jsonl_output)).toBeInTheDocument();
    await user.keyboard(" "); // replay with Space
    expect(within(stage(4)).getByText(snapshot.example.stages.jsonl_output)).toBeInTheDocument();
  });
});

describe("data quality storytelling", () => {
  it("shows the duplicate with its exact row and column, and the mapping miss as a warning", () => {
    render(<App />);
    expect(screen.getByText("Duplicate detected · Row 0040 · Column 0010")).toBeInTheDocument();
    expect(screen.getByText(/Mapping missing · Row 0050 · Column 0010/)).toBeInTheDocument();
  });

  it("renders the Excel rows and report grid from processor output, not hard-coded copy", () => {
    render(<App />);
    expect(screen.getAllByText("Retail Deposits").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Simplified report view")).toHaveTextContent("1,250,000.5");
  });
});

describe("processing summary from the representative demo run", () => {
  it("is generated from the processor's run statistics, including rijnr groups", () => {
    render(<App />);
    const run = snapshot.files.DEMO_CB77;
    // Numbers asserted against the raw snapshot so the sentence cannot be hand-written copy.
    expect(run.summary).toMatchObject({ records_read: 10, records_emitted: 9, duplicates: 1, hierarchy_misses: 1 });
    expect(run.groups["1"]).toHaveLength(6);
    expect(run.groups["2"]).toHaveLength(3);
    expect(
      screen.getByText("Demo run DEMO_CB77 \u00b7 10 records read \u00b7 9 written \u00b7 1 duplicate \u00b7 1 mapping miss \u00b7 2 rijnr groups (rijnr 1: 6 \u00b7 rijnr 2: 3)")
    ).toBeInTheDocument();
  });

  it("does not add new controls or sections", () => {
    render(<App />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(document.querySelectorAll("main > *")).toHaveLength(12); // 11 sections + the compact bridge
  });
});
