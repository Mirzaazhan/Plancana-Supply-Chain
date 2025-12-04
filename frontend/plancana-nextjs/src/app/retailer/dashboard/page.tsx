import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import RetailerDashboard from '@/components/dashboard/RetailerDashboard';

export default function RetailerDashboardPage() {
  return (
    <ProtectedRoute roles={['RETAILER']}>
      <Layout>
        <RetailerDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
