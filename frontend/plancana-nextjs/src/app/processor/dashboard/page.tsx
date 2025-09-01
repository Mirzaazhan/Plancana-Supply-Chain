import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import ProcessorDashboard from '@/components/dashboard/ProcessorDashboard';

export default function ProcessorDashboardPage() {
  return (
    <ProtectedRoute roles={['PROCESSOR']}>
      <Layout>
        <ProcessorDashboard />
      </Layout>
    </ProtectedRoute>
  );
}