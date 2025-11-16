import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReviewApplication from './pages/ReviewApplication';
import AllPipelines from './pages/AllPipelines';
import PipelineEditor from './pages/PipelineEditor';
import EvaluationDetail from './pages/EvaluationDetail';
import Evaluations from './pages/Evaluations';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/review-application" element={<ReviewApplication />} />
        <Route path="/all-pipelines" element={<AllPipelines />} />
        <Route path="/pipeline-editor" element={<PipelineEditor />} />
        <Route path="/evaluations" element={<Evaluations />} />
        <Route path="/evaluations/:evaluationId" element={<EvaluationDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
