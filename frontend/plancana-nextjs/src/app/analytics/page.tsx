import ProtectedRoute from "@/components/common/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import AnalyticDashboard from "@/components/dashboard/AnalyticDashboard";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute roles={["FARMER", "PROCESSOR"]}>
      <Layout>
        <AnalyticDashboard />
      </Layout>
    </ProtectedRoute>
  );
}
