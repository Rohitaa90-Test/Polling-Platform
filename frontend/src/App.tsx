import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PollProvider } from './context/PollContext';
import LandingPage from './pages/LandingPage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';

function App() {
  return (
    <BrowserRouter>
      <PollProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#7765DA', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PollProvider>
    </BrowserRouter>
  );
}

export default App;
