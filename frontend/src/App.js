import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import HomePage from './pages/HomePage';
import CompaniesPage from './pages/CompaniesPage';
import FleetTasksPage from './pages/FleetTasksPage';
import DriversPage from './pages/DriversPage';
import VehiclesPage from './pages/VehiclesPage';
import TaskPage from './pages/TaskPage'; // Import the TaskPage
import TopHeader from './components/TopHeader';
import SideNav from './components/SideNav';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeList from './pages/EmployeeList';
import ProjectMaster from "./pages/ProjectMaster/ProjectMaster.jsx";
import ProjectList from './pages/ProjectMaster/ProjectList.jsx';
import DailyManpowerDeployment from './pages/execution/taskManagement/DailyManpowerDeployment';
import DriverProfile from './pages/DriverProfile';
import DailyManpowerStatus from './pages/execution/taskManagement/DailyManpowerStatus';
import ProjectProgressDashboard from './pages/ProjectProgressDashboard';
import ProgressReportDashboard from "./pages/ProgressReportDashboard";


 

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebar = () => {
    setSidebarCollapsed(true);
  };

  // Layout wrapper component
  const AppLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
      <div className={`${sidebarCollapsed ? '' : 'opacity-70 bg-gray-800 bg-opacity-20'}`}>
        <TopHeader onToggleSidebar={toggleSidebar} />
      </div>
      
      <div className="p-4">
        <div className="flex">
          <SideNav collapsed={sidebarCollapsed} onClose={closeSidebar} />

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Public route - no layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Home route with layout */}
        <Route path="/" element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        } />
        
        {/* Other protected routes with layout */}
        <Route path="/companies" element={
          <AppLayout>
            <CompaniesPage />
          </AppLayout>
        } />
               

{/* Employee routes */}
<Route path="/employees" element={
  <AppLayout>
    <EmployeeList />
  </AppLayout>
} />

<Route path="/employees/create" element={
  <AppLayout>
    <EmployeesPage />
  </AppLayout>
} />

<Route path="/employees/:id" element={
  <AppLayout>
    <EmployeesPage />
  </AppLayout>
} />


        
        <Route path="/fleet-tasks" element={
          <AppLayout>
            <FleetTasksPage />
          </AppLayout>
        } />
        
        <Route path="/drivers" element={
          <AppLayout>
            <DriversPage />
          </AppLayout>
        } />

         <Route path="/tasks" element={
          <AppLayout>
            <TaskPage />
          </AppLayout>
        } />
        
        <Route path="/vehicles" element={
          <AppLayout>
            <VehiclesPage />
          </AppLayout>
        } />
        
        {/* Add the new Tasks route */}
        <Route path="/tasks" element={
          <AppLayout>
            <TaskPage />
          </AppLayout>
        } />

         <Route 
            path="/profile" 
            element={
           
                <AppLayout >
                  <DriverProfile />
                </AppLayout>
           
            } 
          />
        
        <Route
  path="/project-master"
  element={
    <AppLayout>
      <ProjectMaster />
    </AppLayout>
  }
/> 
 <Route
  path="/project"
  element={
    <AppLayout>
      <ProjectList />
    </AppLayout>
  }
/>
<Route
  path="/execution/task-management/daily-worker-deployment"
  element={
    <AppLayout>
      <DailyManpowerDeployment />
    </AppLayout>
  }
/>
<Route
  path="/execution/task-management/daily-manpower-status"
  element={
    <AppLayout>
      <DailyManpowerStatus />
    </AppLayout>
  }
/>

 <Route path="/progress-dashboard" element={<AppLayout><ProjectProgressDashboard /></AppLayout>} />
 <Route
  path="/progress-report"
  element={
    <AppLayout>
      <ProgressReportDashboard />
    </AppLayout>
  }
/>



        
        {/* Default route - redirect to home instead of login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;