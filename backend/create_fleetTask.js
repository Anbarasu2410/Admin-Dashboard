import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?retryWrites=true&w=majority&appName=erp';

// Function to rename collections to camelCase only
const renameToCamelCase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for renaming collections');
    
    const db = mongoose.connection.db;
    
    console.log('Starting collection renaming to camelCase...');
    
    // Rename collections to camelCase (no backup suffix)
    await db.collection('employeepassports').rename('employeePassports');
    console.log('✅ employeepassports renamed to employeePassports');
    
    await db.collection('employeeworkpasses').rename('employeeWorkPasses');
    console.log('✅ employeeworkpasses renamed to employeeWorkPasses');
    
    await db.collection('employeequalifications').rename('employeeQualifications');
    console.log('✅ employeequalifications renamed to employeeQualifications');
    
    await db.collection('employeecertifications').rename('employeeCertifications');
    console.log('✅ employeecertifications renamed to employeeCertifications');
    
    await db.collection('employeedocuments').rename('employeeDocuments');
    console.log('✅ employeedocuments renamed to employeeDocuments');
    
    await db.collection('employeeauditlogs').rename('employeeAuditLogs');
    console.log('✅ employeeauditlogs renamed to employeeAuditLogs');
    
    console.log('🎉 All collections renamed to camelCase successfully!');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error renaming collections:', error);
  }
};

// Run only the renaming function
renameToCamelCase();