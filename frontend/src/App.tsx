import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import NewProject from './pages/NewProject'
import ECMLibrary from './pages/ECMLibrary'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/ecm-library" element={<ECMLibrary />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App