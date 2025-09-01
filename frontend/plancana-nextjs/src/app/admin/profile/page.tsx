import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import ProfileManagement from '@/components/profile/ProfileManagement';

export default function AdminProfilePage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <Layout>
        <ProfileManagement />
      </Layout>
    </ProtectedRoute>
  );
}