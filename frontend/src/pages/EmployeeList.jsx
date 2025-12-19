import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, message, Space, Card, Modal, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import { EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined, MoreOutlined } from "@ant-design/icons";
import { EyeOutlined } from "@ant-design/icons"; 
const { confirm } = Modal;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_URL || "http://localhost:5000/api";

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/employees`);
      console.log("Employees API Response:", res.data);
      
      const employeesData = res.data.employees || res.data.data || res.data;
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      message.error("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showDeleteConfirm = (employee) => {
    confirm({
      title: 'Are you sure you want to delete this employee?',
      icon: <ExclamationCircleOutlined />,
      content: `This will delete ${employee.fullName} permanently.`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDelete(employee.id || employee.id);
      }
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/employees/${id}`);
      message.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      message.error("Failed to delete employee");
    }
  };

  const handleCreate = () => {
    navigate("/employees/create");
  };

  const columns = [
    { 
      title: "Full Name", 
      dataIndex: "fullName",
      key: "fullName",
      width: "25%",
      ellipsis: true,
      sorter: (a, b) => a.fullName?.localeCompare(b.fullName),
    },
    { 
      title: "Email", 
      dataIndex: "email",
      key: "email",
      width: "30%",
      ellipsis: true,
      render: (email) => (
        <span className="truncate block">{email}</span>
      )
    },
    { 
      title: "Phone", 
      dataIndex: "phone",
      key: "phone",
      width: "20%",
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: "25%",
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/employees/${record.id}?view=true`)}
            className="hidden sm:inline-block"
            title="View"
          >
            View
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/employees/${record.id}`)}
            className="hidden sm:inline-block"
            title="Edit"
          >
            Edit
          </Button>
          <Button 
            danger 
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record)}
            className="hidden sm:inline-block"
            title="Delete"
          >
            Delete
          </Button>
          
          {/* Mobile dropdown menu */}
          <Dropdown
            menu={{
              items: [
                {
                  key: '1',
                  label: 'View',
                  icon: <EyeOutlined />,
                  onClick: () => navigate(`/employees/${record.id}?view=true`)
                },
                {
                  key: '2',
                  label: 'Edit',
                  icon: <EditOutlined />,
                  onClick: () => navigate(`/employees/${record.id}`)
                },
                {
                  key: '3',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => showDeleteConfirm(record)
                }
              ]
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button 
              size="small"
              icon={<MoreOutlined />}
              className="sm:hidden"
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <Card className="shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Employee Management</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Add New Employee</span>
            <span className="sm:hidden">Add Employee</span>
          </Button>
        </div>

        <Table 
          dataSource={employees} 
          columns={columns} 
          rowKey={record => record.id || record.id}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} employees`,
          }}
          className="w-full"
          size="middle"
          bordered={false}
        />
      </Card>
    </div>
  );
};

export default EmployeeList;