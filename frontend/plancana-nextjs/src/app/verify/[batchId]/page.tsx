import QRVerificationPage from '@/components/verification/QRVerificationPage';

interface VerifyPageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { batchId } = await params;
  return <QRVerificationPage batchId={batchId} />;
}