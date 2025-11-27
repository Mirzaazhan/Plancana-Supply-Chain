import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import DistributorDashboard from '@/components/dashboard/DistributorDashboard';

export default function DistributorDashboardPage() {
  return (
    <ProtectedRoute roles={['DISTRIBUTOR']}>
      <Layout>
        <DistributorDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
