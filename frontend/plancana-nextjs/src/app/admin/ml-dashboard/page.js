import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import MLDashboard from '@/components/ml/MLDashboard';

export default function MLDashboardPage() {
  return (
    <ProtectedRoute roles={['ADMIN', 'REGULATOR']}>
      <Layout>
        <MLDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
