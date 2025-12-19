import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Checkbox,
  Upload,
  Button,
  Collapse,
  message,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs"; // REPLACE moment import



const { Option } = Select;
const { Panel } = Collapse;


const EmployeeForm = ({ employeeId }) => {
  const [form] = Form.useForm();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "true"; // true if View clicked

  const [qualifications, setQualifications] = useState([{ id: Date.now() }]);
  const [certifications, setCertifications] = useState([{ id: Date.now() }]);
  const [documents, setDocuments] = useState([{ id: Date.now() }]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Then useEffect after state declarations
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_API_URL;

        const response = await axios.get(API_URL);

        setCompanies(response.data.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        message.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
  console.log('Viewing employee with ID:', paramId);
  if (!paramId) return;

  const fetchEmployee = async () => {
    try {
      const APP_URL = process.env.REACT_APP_URL;
      console.log(APP_URL);
      const res = await axios.get(`http://localhost:5000/api/employees/${paramId}`);
      const employeeData = res.data.employee || res.data.data || res.data;
      if (!employeeData) return;

      // Convert date fields
      ["dob", "joinDate", "leftDate"].forEach(field => {
        if (employeeData[field]) employeeData[field] = dayjs(employeeData[field]);
      });

      if (employeeData.passport) {
        ["issueDate", "expiryDate"].forEach(field => {
          if (employeeData.passport[field]) employeeData.passport[field] = dayjs(employeeData.passport[field]);
        });

        // Upload fileList for passport
        if (employeeData.passport.documentPath) {
          employeeData.passport.documentPath = {
            fileList: [
              {
                uid: "-1",
                name: employeeData.passport.documentPath.split("/").pop(),
                status: "done",
                url: employeeData.passport.documentPath,
              },
            ],
          };
        }
      }

      if (employeeData.workPass) {
        ["applicationDate", "issuanceDate", "expiryDate", "medicalDate"].forEach(field => {
          if (employeeData.workPass[field]) employeeData.workPass[field] = dayjs(employeeData.workPass[field]);
        });

        // Uploads for workPass
        ["applicationDoc", "medicalDoc", "issuanceDoc", "momDoc"].forEach(fileField => {
          if (employeeData.workPass[fileField]) {
            employeeData.workPass[fileField] = {
              fileList: [
                {
                  uid: "-1",
                  name: employeeData.workPass[fileField].split("/").pop(),
                  status: "done",
                  url: employeeData.workPass[fileField],
                },
              ],
            };
          }
        });
      }

      // ========== FIX FOR QUALIFICATIONS ==========
      if (employeeData.qualifications?.length) {
        const transformedQualifications = employeeData.qualifications.map(q => {
          const qualification = { ...q, id: Date.now() + Math.random() };
          
          // Transform documentPath for qualifications (SAME AS PASSPORT)
          if (qualification.documentPath) {
            qualification.documentPath = {
              fileList: [
                {
                  uid: "-1",
                  name: qualification.documentPath.split("/").pop(),
                  status: "done",
                  url: qualification.documentPath,
                },
              ],
            };
          }
          
          return qualification;
        });
        setQualifications(transformedQualifications);
        // IMPORTANT: Update the employeeData too
        employeeData.qualifications = transformedQualifications;
      }

      // ========== FIX FOR CERTIFICATIONS ==========
      if (employeeData.certifications?.length) {
        const transformedCertifications = employeeData.certifications.map(c => {
          const certification = { 
            ...c,
            issueDate: c.issueDate ? dayjs(c.issueDate) : null,
            expiryDate: c.expiryDate ? dayjs(c.expiryDate) : null,
            id: Date.now() + Math.random(),
          };
          
          // Transform documentPath for certifications (SAME AS PASSPORT)
          if (certification.documentPath) {
            certification.documentPath = {
              fileList: [
                {
                  uid: "-1",
                  name: certification.documentPath.split("/").pop(),
                  status: "done",
                  url: certification.documentPath,
                },
              ],
            };
          }
          
          return certification;
        });
        setCertifications(transformedCertifications);
        // IMPORTANT: Update the employeeData too
        employeeData.certifications = transformedCertifications;
      }

      // ========== FIX FOR DOCUMENTS ==========
      if (employeeData.documents?.length) {
        const transformedDocuments = employeeData.documents.map(d => {
          const document = { ...d, id: Date.now() + Math.random() };
          
          // Transform filePath for documents (NOTE: field name is 'filePath' not 'documentPath')
          if (document.filePath) {
            document.filePath = {
              fileList: [
                {
                  uid: "-1",
                  name: document.filePath.split("/").pop(),
                  status: "done",
                  url: document.filePath,
                },
              ],
            };
          }
          
          return document;
        });
        setDocuments(transformedDocuments);
        // IMPORTANT: Update the employeeData too
        employeeData.documents = transformedDocuments;
      }

      // Populate form
      form.setFieldsValue(employeeData);

    } catch (error) {
      console.error("Error fetching employee data:", error);
      message.error("Failed to load employee data");
    }
  };

  fetchEmployee();
}, [paramId, form]);



  const addQualification = () => setQualifications([...qualifications, { id: Date.now() }]);
  const addCertification = () => setCertifications([...certifications, { id: Date.now() }]);
  const addDocument = () => setDocuments([...documents, { id: Date.now() }]);

  const handleSubmit = async (values) => {
    try {
      // Prepare payload
      const payload = {
        ...values,
        salaryDetails: values.salaryDetails || {},
        passport: values.passport || {},
        workPass: values.workPass || {},
        qualifications: values.qualifications || [],
        certifications: values.certifications || [],
        documents: values.documents || [],
      };

      let response;

      if (paramId) {
        response = await axios.put(`${process.env.REACT_APP_URL}/employees/${paramId}`, payload);
      } else {
        response = await axios.post(`${process.env.REACT_APP_URL}/employees`, payload);
      }


      message.success(`Employee ${paramId ? "updated" : "created"} successfully!`);

      console.log("API Response:", response.data);
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Failed to submit employee form.");
    }
  };

  const handleDelete = async () => {
    if (!employeeId) return;
    try {
      await axios.delete(`/api/employees/${employeeId}`);
      message.success("Employee deleted successfully!");
      form.resetFields();
    } catch (error) {
      console.error("Error deleting employee:", error);
      message.error("Failed to delete employee.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Employee Form</h1>
      <Form layout="vertical" form={form} onFinish={handleSubmit} disabled={viewMode}>


        <Collapse accordion defaultActiveKey={["1"]}>

          {/* Section 1: Employee Information */}
          <Panel header="Employee Information" key="1">
            <Form.Item label="Company" name="companyId" rules={[{ required: true }]}>
              <Select placeholder="Select company" loading={loading}>
                {companies.map(company => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {/* <Form.Item label="User" name="userId" rules={[{ required: true }]}>
              <Select placeholder="Select user">
                <Option value={10}>Alice</Option>
                <Option value={11}>Bob</Option>
              </Select>
            </Form.Item> */}
            <Form.Item label="Employee Code" name="employeeCode">
              <Input />
            </Form.Item>
            <Form.Item label="Full Name" name="fullName">
              <Input />
            </Form.Item>
            <Form.Item label="Date of Birth" name="dob">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Gender" name="gender">
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Nationality" name="nationality">
              <Input />
            </Form.Item>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter phone number" },
                {
                  pattern: /^\d{10}$/,
                  message: "Phone number must be exactly 10 digits",
                },
              ]}
            >
              <Input maxLength={10} />
            </Form.Item>

            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Emergency Contact Name" name="emergencyContactName">
              <Input />
            </Form.Item>
            <Form.Item label="Emergency Phone" name="emergencyPhone">
              <Input />
            </Form.Item>
            <Form.Item label="Job Title" name="jobTitle">
              <Input />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Select>
                <Option value="ACTIVE">ACTIVE</Option>
                <Option value="INACTIVE">INACTIVE</Option>
                <Option value="LEFT">LEFT</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Join Date" name="joinDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Left Date" name="leftDate">
              <DatePicker className="w-full" />
            </Form.Item>
          </Panel>

          {/* Section 2: Salary Details */}
          <Panel header="Salary Details" key="2">
            <div className="grid grid-cols-2 gap-4">
              {[
                "basicSalary",
                "otCharges",
                "housingAllowance",
                "transportAllowance",
                "otherAllowance",
                "housingDeduction",
                "transportDeduction",
                "otherDeduction",
                "annualLeaveDays",
                "medicalLeaveDays",
              ].map((field) => (
                <Form.Item
                  label={field.replace(/([A-Z])/g, " $1")}
                  key={field}
                  name={["salaryDetails", field]}
                >
                  <InputNumber className="w-full" />
                </Form.Item>
              ))}
              <Form.Item name={["salaryDetails", "bonusEligibility"]} valuePropName="checked">
                <Checkbox>Bonus Eligibility</Checkbox>
              </Form.Item>
            </div>
          </Panel>

          {/* Section 3: Passport */}
          <Panel header="Passport Details" key="3">
            <Form.Item label="Passport Number" name={["passport", "passportNo"]}>
              <Input />
            </Form.Item>
            <Form.Item label="Issue Date" name={["passport", "issueDate"]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Expiry Date" name={["passport", "expiryDate"]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Issuing Country" name={["passport", "issuingCountry"]}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Passport Document"
              name={["passport", "documentPath"]}
              getValueProps={(value) => ({
                file: value?.file || null,
                fileName: value?.fileList?.[0]?.name || null,
                fileList: Array.isArray(value?.fileList) ? value.fileList : [],
              })}

              getValueFromEvent={(e) => {
                // AntD Upload onChange event
                if (Array.isArray(e)) return e;
                return {
                  file: e.file,
                  fileList: e.fileList,
                  fileName: e.file?.name,
                };
              }}
            >
              <Upload beforeUpload={() => false} listType="text" multiple={false}>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Form.Item>




          </Panel>

          {/* Section 4: Work Pass */}
          {/* Section 4: Work Pass */}
          <Panel header="Work Pass Details" key="4">
            <Form.Item label="Status" name={["workPass", "status"]}>
              <Select>
                <Option value="PENDING">PENDING</Option>
                <Option value="ACTIVE">ACTIVE</Option>
                <Option value="EXPIRED">EXPIRED</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Work Permit Number" name={["workPass", "workPermitNo"]}>
              <Input />
            </Form.Item>

            <Form.Item label="FIN Number" name={["workPass", "finNumber"]}>
              <Input />
            </Form.Item>

            <Form.Item label="Application Date" name={["workPass", "applicationDate"]}>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Issuance Date" name={["workPass", "issuanceDate"]}>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Expiry Date" name={["workPass", "expiryDate"]}>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Medical Date" name={["workPass", "medicalDate"]}>
              <DatePicker className="w-full" />
            </Form.Item>

            {["applicationDoc", "medicalDoc", "issuanceDoc", "momDoc"].map((fileField) => (
              <Form.Item
                key={fileField}
                label={fileField.replace(/([A-Z])/g, " $1")}
                name={["workPass", fileField]}
                getValueProps={(value) => ({
                  file: value?.file || null,
                  fileName: value?.fileList?.[0]?.name || null,
                  fileList: Array.isArray(value?.fileList) ? value.fileList : [],
                })}
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) return e;
                  return {
                    file: e.file,
                    fileList: e.fileList,
                    fileName: e.file?.name,
                  };
                }}
              >
                <Upload beforeUpload={() => false} listType="text">
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              </Form.Item>
            ))}

          </Panel>


          {/* Section 5: Qualifications */}
          <Panel header="Qualifications" key="5">
            {qualifications.map((q, index) => (
              <div key={q.id} className="border p-2 mb-2 rounded">
                <Form.Item label="Name" name={["qualifications", index, "name"]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Type" name={["qualifications", index, "type"]}>
                  <Select>
                    <Option value="degree">Degree</Option>
                    <Option value="diploma">Diploma</Option>
                    <Option value="certificate">Certificate</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Institution" name={["qualifications", index, "institution"]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Country" name={["qualifications", index, "country"]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Year" name={["qualifications", index, "year"]}>
                  <InputNumber className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Document"
                  name={["qualifications", index, "documentPath"]}
                  getValueProps={(value) => ({
                    file: value?.file || null,
                    fileName: value?.fileList?.[0]?.name || null,
                    fileList: Array.isArray(value?.fileList) ? value.fileList : [],
                  })}
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) return e;
                    return {
                      file: e.file,
                      fileList: e.fileList,
                      fileName: e.file?.name,
                    };
                  }}
                >
                  <Upload beforeUpload={() => false} listType="text">
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Form.Item>

              </div>
            ))}
            <Button type="dashed" onClick={addQualification} block icon={<PlusOutlined />}>
              Add Qualification
            </Button>
          </Panel>

          {/* Section 6: Certifications */}
          <Panel header="Certifications" key="6">
            {certifications.map((c, index) => (
              <div key={c.id} className="border p-2 mb-2 rounded">
                <Form.Item label="Name" name={["certifications", index, "name"]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Type" name={["certifications", index, "type"]}>
                  <Select>
                    <Option value="training">Training</Option>
                    <Option value="professional cert">Professional Cert</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Ownership" name={["certifications", index, "ownership"]}>
                  <Select>
                    <Option value="employee">Employee</Option>
                    <Option value="company">Company</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Issue Date" name={["certifications", index, "issueDate"]}>
                  <DatePicker className="w-full" />
                </Form.Item>
                <Form.Item label="Expiry Date" name={["certifications", index, "expiryDate"]}>
                  <DatePicker className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Document"
                  name={["certifications", index, "documentPath"]}
                  getValueProps={(value) => ({
                    file: value?.file || null,
                    fileName: value?.fileList?.[0]?.name || null,
                    fileList: Array.isArray(value?.fileList) ? value.fileList : [],
                  })}
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) return e;
                    return {
                      file: e.file,
                      fileList: e.fileList,
                      fileName: e.file?.name,
                    };
                  }}
                >
                  <Upload beforeUpload={() => false} listType="text">
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Form.Item>

              </div>
            ))}
            <Button type="dashed" onClick={addCertification} block icon={<PlusOutlined />}>
              Add Certification
            </Button>
          </Panel>

          {/* Section 7: Other Documents */}
          <Panel header="Other Documents" key="7">
            {documents.map((d, index) => (
              <div key={d.id} className="border p-2 mb-2 rounded">
                <Form.Item label="Document Type" name={["documents", index, "documentType"]}>
                  <Select>
                    <Option value="passport">Passport</Option>
                    <Option value="work pass">Work Pass</Option>
                    <Option value="certification">Certification</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="File"
                  name={["documents", index, "filePath"]}
                  getValueProps={(value) => ({
                    file: value?.file || null,
                    fileName: value?.fileList?.[0]?.name || null,
                    fileList: Array.isArray(value?.fileList) ? value.fileList : [],
                  })}
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) return e;
                    return {
                      file: e.file,
                      fileList: e.fileList,
                      fileName: e.file?.name,
                    };
                  }}
                >
                  <Upload beforeUpload={() => false} listType="text">
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Form.Item>

                <Form.Item label="Version" name={["documents", index, "version"]}>
                  <InputNumber className="w-full" />
                </Form.Item>
                <Form.Item label="Uploaded By" name={["documents", index, "uploadedBy"]}>
                  <Select>
                    <Option value={10}>Alice</Option>
                    <Option value={11}>Bob</Option>
                  </Select>
                </Form.Item>
              </div>
            ))}
            <Button type="dashed" onClick={addDocument} block icon={<PlusOutlined />}>
              Add Document
            </Button>
          </Panel>
        </Collapse>

        <div className="mt-6 flex justify-end gap-4">
          {!viewMode && employeeId && (
            <Button danger onClick={handleDelete}>Delete</Button>
          )}
          <Button type="default" onClick={() => form.resetFields()}>
            {viewMode ? "Close" : "Cancel"}
          </Button>
          {!viewMode && (
            <Button type="primary" htmlType="submit">
              {paramId ? "Update" : "Submit"}
            </Button>

          )}
        </div>

      </Form>
    </div>
  );
};

export default EmployeeForm;
