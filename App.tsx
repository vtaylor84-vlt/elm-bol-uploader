import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ShowcaseProvider } from './context/ShowcaseContext.tsx';
import { SubmissionDraftProvider } from './context/SubmissionDraftContext.tsx';
import ProtectedRoute from './components/routing/ProtectedRoute.tsx';
import ShowcaseProtectedRoute from './components/routing/ShowcaseProtectedRoute.tsx';
import ProductionExperienceLayout from './components/routing/ProductionExperienceLayout.tsx';
import ShowcaseExperienceLayout from './components/showcase/ShowcaseExperienceLayout.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ConnectingPage from './pages/ConnectingPage.tsx';
import TodayPage from './pages/TodayPage.tsx';
import WorkspacePage from './pages/WorkspacePage.tsx';
import BolPodWorkflow from './pages/BolPodWorkflow.tsx';
import ReceiptPage from './pages/ReceiptPage.tsx';
import SubmissionReviewPage from './pages/SubmissionReviewPage.tsx';
import SubmissionSuccessPage from './pages/SubmissionSuccessPage.tsx';
import { LoadsPage, MorePage, PayPage } from './pages/MissionPlaceholders.tsx';
import ShowcaseHubPage from './pages/showcase/ShowcaseHubPage.tsx';
import ShowcaseFutureModulePage from './pages/showcase/ShowcaseFutureModulePage.tsx';
import MessagesPage from './pages/driver/MessagesPage.tsx';
import EquipmentPage from './pages/driver/EquipmentPage.tsx';
import SafetyPage from './pages/driver/SafetyPage.tsx';
import NotificationsPage from './pages/driver/NotificationsPage.tsx';
import SearchPage from './pages/driver/SearchPage.tsx';
import AssistantPage from './pages/driver/AssistantPage.tsx';

const App: React.FC = () => (
  <AuthProvider>
    <ShowcaseProvider>
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

            {/* Production Driver Experience — shared pages + production data source */}
            <Route
              element={
                <ProtectedRoute>
                  <ProductionExperienceLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/today" element={<TodayPage />} />
              <Route path="/loads" element={<LoadsPage />} />
              <Route path="/pay" element={<PayPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/capture" element={<WorkspacePage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/truck" element={<EquipmentPage />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
            </Route>

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

            {/* Admin Showcase — same shared pages, Showcase adapters */}
            <Route
              path="/showcase"
              element={
                <ShowcaseProtectedRoute>
                  <ShowcaseExperienceLayout />
                </ShowcaseProtectedRoute>
              }
            >
              <Route index element={<ShowcaseHubPage />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="loads" element={<LoadsPage />} />
              <Route path="capture" element={<WorkspacePage />} />
              <Route path="pay" element={<PayPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="equipment" element={<EquipmentPage />} />
              <Route path="truck" element={<EquipmentPage />} />
              <Route path="safety" element={<SafetyPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="home-time" element={<ShowcaseFutureModulePage module="home-time" />} />
              <Route path="benefits" element={<ShowcaseFutureModulePage module="benefits" />} />
              <Route path="documents" element={<ShowcaseFutureModulePage module="documents" />} />
              <Route
                path="performance"
                element={<ShowcaseFutureModulePage module="performance" />}
              />
              <Route path="timeline" element={<ShowcaseFutureModulePage module="timeline" />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SubmissionDraftProvider>
    </ShowcaseProvider>
  </AuthProvider>
);

export default App;
