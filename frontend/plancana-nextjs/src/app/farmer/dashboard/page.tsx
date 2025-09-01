import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';

export default function FarmerDashboardPage() {
  return (
    <ProtectedRoute roles={['FARMER']}>
      <Layout>
        <FarmerDashboard />
      </Layout>
    </ProtectedRoute>
  );
}