import Hero from "./components/Hero.jsx";
import BeforeAfter from "./components/BeforeAfter.jsx";
import Problem from "./components/Problem.jsx";
import FocusBridge from "./components/FocusBridge.jsx";
import Pipeline from "./components/Pipeline.jsx";
import RecordTransform from "./components/RecordTransform.jsx";
import ExcelRules from "./components/ExcelRules.jsx";
import ErrorsReprocess from "./components/ErrorsReprocess.jsx";
import JsonlToReport from "./components/JsonlToReport.jsx";
import BuiltWith from "./components/BuiltWith.jsx";
import Demonstrates from "./components/Demonstrates.jsx";
import Explore from "./components/Explore.jsx";

// One continuous scroll; section order follows the approved build specification (kept outside this repository).
export default function App() {
  return (
    <main>
      <Hero />
      <BeforeAfter />
      <Problem />
      <FocusBridge />
      <Pipeline />
      <RecordTransform />
      <ExcelRules />
      <ErrorsReprocess />
      <JsonlToReport />
      <BuiltWith />
      <Demonstrates />
      <Explore />
    </main>
  );
}
