'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';
import dynamic from 'next/dynamic';

import React from 'react'
import Head from 'next/head';

const ArcGISMap = dynamic(() => import('@/components/gis-map/testMap'), {
  ssr: false,  // Disable server-side rendering
  // loading: () => <div className='text-2xl flex justify-center text-center px-80 py-80'>Loading map...</div>  // Loading state
});


const page = () => {
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://js.arcgis.com/4.29/esri/themes/light/main.css"
        />
      </Head>
    <div className='h-screen w-full overflow-hidden'>
    <ProtectedRoute roles={['FARMER']}>
      <Layout>
        
        <div className='w-full h-full pb-10'>
      <ArcGISMap
      webMapId={process.env.NEXT_PUBLIC_ARCGIS_TOKEN_ID_WEBMAP || "a24b5bc059d2478e843f4c1968e47860"}
      dragable={false}
        // apiKey={process.env.NEXT_PUBLIC_ARCGIS_API_KEY || ''}
        // center = {[101.9758, 4.2105]}
        // zoom = {12}
        // basemap = "arcgis/navigation"
      />
        </div>
      </Layout>
    </ProtectedRoute>
    </div>
    </>
  )
}

export default page