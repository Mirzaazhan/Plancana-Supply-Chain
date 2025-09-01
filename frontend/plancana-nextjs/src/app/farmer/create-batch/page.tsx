import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import BatchRegistration from '@/components/batch/BatchRegistration';

export default function CreateBatchPage() {
  return (
    <ProtectedRoute roles={['FARMER']}>
      <Layout>
        <BatchRegistration />
      </Layout>
    </ProtectedRoute>
  );
}