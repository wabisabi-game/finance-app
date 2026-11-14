import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dictionary from './pages/Dictionary'
import Drill from './pages/Drill'
import Home from './pages/Home'
import JournalEdit from './pages/JournalEdit'
import JournalList from './pages/JournalList'
import Practice from './pages/Practice'
import Progress from './pages/Progress'
import Quiz from './pages/Quiz'
import Settings from './pages/Settings'
import TermDetail from './pages/TermDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="quiz/practice" element={<Practice />} />
        <Route path="quiz/drill" element={<Drill />} />
        <Route path="dictionary" element={<Dictionary />} />
        <Route path="dictionary/:id" element={<TermDetail />} />
        <Route path="journal" element={<JournalList />} />
        <Route path="journal/:date" element={<JournalEdit />} />
        <Route path="progress" element={<Progress />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
