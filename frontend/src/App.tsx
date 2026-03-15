import { Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import FoundryLanding from './pages/Landing';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import NewIdea from './pages/NewIdea';
import IdeaReview from './pages/IdeaReview';
import ValidationDashboard from './pages/ValidationDashboard';
import CompetitorAnalysisDashboard from './pages/CompetitorAnalysisDashboard';
import QualityEvaluationDashboard from './pages/QualityEvaluationDashboard';
import RefinementDashboard from './pages/RefinementDashboard';
import CrossQuestioning from './features/idea-collection/components/CrossQuestioning';
import FinancialProjectionsDashboard from './pages/FinancialProjectionsDashboard';
import HiringPlanDashboard from './pages/HiringPlanDashboard';
import ContentMarketingDashboard from './pages/ContentMarketingDashboard';
import LandingPageGenerator from './pages/LandingPageGenerator';
import Navbar from './components/Navbar';

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up'];

function AppLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const isPublic = PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <>
      {!isPublic && (
        <SignedIn>
          <Navbar ideaId={ideaId} />
        </SignedIn>
      )}
      <Routes>
        <Route path="/" element={<FoundryLanding />} />
        <Route path="/sign-in/*" element={<><SignedIn><Dashboard /></SignedIn><SignedOut><SignInPage /></SignedOut></>} />
        <Route path="/sign-up/*" element={<><SignedIn><Dashboard /></SignedIn><SignedOut><SignUpPage /></SignedOut></>} />
        <Route path="/dashboard"             element={<><SignedIn><Dashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/new-idea"              element={<><SignedIn><NewIdea /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/cross-questioning"     element={<><SignedIn><CrossQuestioning /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/idea-review"           element={<><SignedIn><IdeaReview /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/validation"            element={<><SignedIn><ValidationDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/competitor-analysis"   element={<><SignedIn><CompetitorAnalysisDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/quality-check"         element={<><SignedIn><QualityEvaluationDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/refine"                element={<><SignedIn><RefinementDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/financial-projections" element={<><SignedIn><FinancialProjectionsDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/hiring-plan"           element={<><SignedIn><HiringPlanDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/content-marketing"     element={<><SignedIn><ContentMarketingDashboard /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
        <Route path="/landing-page"          element={<><SignedIn><LandingPageGenerator /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppLayout />;
}