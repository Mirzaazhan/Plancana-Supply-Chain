import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import ProfileManagement from '@/components/profile/ProfileManagement';

export default function FarmerProfilePage() {
  return (
    <ProtectedRoute roles={['FARMER']}>
      <Layout>
        <ProfileManagement />
      </Layout>
    </ProtectedRoute>
  );
}