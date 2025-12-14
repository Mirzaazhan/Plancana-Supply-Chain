"use client";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import FarmerDashboard from "@/components/dashboard/FarmerDashboard";
import dynamic from "next/dynamic";

import React from "react";
import Head from "next/head";

const ArcGISMap = dynamic(() => import("@/components/gis-map/testMap"), {
  ssr: false, // Disable server-side rendering
  // loading: () => <div className='text-2xl flex justify-center text-center px-80 py-80'>Loading map...</div>  // Loading state
});

const page = () => {
  return (
    <>
<<<<<<< Updated upstream
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
      webMapId={"0684120dd13147bba92ca897ddd65dc4"}
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
=======
      <div className="h-full">
        <ProtectedRoute roles={["FARMER"]}>
          <Layout>
            <div className="h-full">
              {" "}
              {/* Use flex-col to manage vertical space */}
              {/* Remove pt-10 to eliminate the top gap if one remains */}
              <div className="h-full">
                {" "}
                {/* flex-1 makes this div grow to fill all remaining space */}
                <ArcGISMap
                  zoom={7}
                  height="100%"
                  webMapId={process.env.NEXT_PUBLIC_ARCGIS_TOKEN_ID_WEBMAP}
                  dragable={false}
                />
              </div>
            </div>
          </Layout>
        </ProtectedRoute>
      </div>
>>>>>>> Stashed changes
    </>
  );
};

export default page;
