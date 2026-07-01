import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { SubmissionDraftProvider } from './context/SubmissionDraftContext.tsx';
import ProtectedRoute from './components/routing/ProtectedRoute.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ConnectingPage from './pages/ConnectingPage.tsx';
import WorkspacePage from './pages/WorkspacePage.tsx';
import BolPodWorkflow from './pages/BolPodWorkflow.tsx';
import ReceiptPage from './pages/ReceiptPage.tsx';
import SubmissionReviewPage from './pages/SubmissionReviewPage.tsx';
import SubmissionSuccessPage from './pages/SubmissionSuccessPage.tsx';

const App: React.FC = () => (
  <AuthProvider>
    <SubmissionDraftProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/connecting"
            element={
              <ProtectedRoute>
                <ConnectingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions/bol-pod"
            element={
              <ProtectedRoute>
                <BolPodWorkflow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions/receipt"
            element={
              <ProtectedRoute>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions/review"
            element={
              <ProtectedRoute>
                <SubmissionReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions/success"
            element={
              <ProtectedRoute>
                <SubmissionSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </SubmissionDraftProvider>
  </AuthProvider>
);

export default App;
