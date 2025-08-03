import { Helmet } from 'react-helmet-async';
import DocumentManagement from '@/components/documents/document-management';

export default function DocumentsPage() {
  return (
    <>
      <Helmet>
        <title>Document Management | Peergos</title>
        <meta 
          name="description" 
          content="Upload, manage, and organize your UAE tax compliance documents including TRN certificates, invoices, audit reports, and more."
        />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <DocumentManagement />
        </div>
      </div>
    </>
  );
}