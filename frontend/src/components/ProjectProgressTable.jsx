import { Table, Collapse } from "antd";

const { Panel } = Collapse;

const ProjectProgressTable = ({ data = [] }) => {
  const projectColumns = [
    { title: "Project Name", dataIndex: "projectName", key: "projectName" },
    { title: "Supervisor", dataIndex: "supervisorName", key: "supervisorName" },
    {
      title: "Overall Progress %",
      dataIndex: "overallProgress",
      key: "overallProgress",
    },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  const workerColumns = [
    { title: "Worker", dataIndex: "employeeName", key: "employeeName" },
    { title: "Task", dataIndex: "taskName", key: "taskName" },
    {
      title: "Progress %",
      dataIndex: "progressPercent",
      key: "progressPercent",
    },
    { title: "Notes", dataIndex: "notes", key: "notes" },
  ];

  return (
    <div className="overflow-x-auto">
      <Collapse accordion>
        {data.map((project) => (
          <Panel header={project.projectName} key={project.id}>
            <Table
              columns={projectColumns}
              dataSource={[project]}
              pagination={false}
              rowKey="id"
              className="mb-4"
            />

            <Table
              columns={workerColumns}
              dataSource={project.workerProgress || []}
              pagination={false}
              rowKey="employeeId"
            />
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default ProjectProgressTable;
