import QRVerificationPage from '@/components/verification/QRVerificationPage';

interface ScanPageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { batchId } = await params;
  return <QRVerificationPage batchId={batchId} />;
}