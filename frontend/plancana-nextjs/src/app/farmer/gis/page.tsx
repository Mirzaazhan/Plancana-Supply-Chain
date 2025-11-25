'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';
import dynamic from 'next/dynamic';

import React from 'react'

const ArcGISMap = dynamic(() => import('@/components/gis-map/map'), {
  ssr: false,  // Disable server-side rendering
  loading: () => <div className='text-2xl flex justify-center text-center px-80 py-80'>Loading map...</div>  // Loading state
});

const page = () => {
  return (
    <>
        <ProtectedRoute roles={['FARMER']}>
      <Layout>
        <div className='w-dvw h-dvh'>
      <ArcGISMap
        apiKey={process.env.NEXT_PUBLIC_ARCGIS_API_KEY || ''}
        center = {[101.9758, 4.2105]}
        zoom = {12}
        basemap = "arcgis/navigation"
      />
    </div>
      </Layout>
    </ProtectedRoute>
    </>
  )
}

export default page