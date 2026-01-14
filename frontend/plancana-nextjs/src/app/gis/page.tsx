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
      <div className="h-full">
        <ProtectedRoute roles={["FARMER", "PROCESSOR", "DISTRIBUTOR"]}>
          <Layout>
            <div className="h-full">
              {" "}
              {/* Use flex-col to manage vertical space */}
              {/* Remove pt-10 to eliminate the top gap if one remains */}
              <div className="h-full">
                {" "}
                {/* flex-1 makes this div grow to fill all remaining space */}
                <ArcGISMap
                  height="100%"
                  webMapId={process.env.NEXT_PUBLIC_ARCGIS_TOKEN_ID_WEBMAP}
                  dragable={false}
                  weatherwidget={true}
                />
              </div>
            </div>
          </Layout>
        </ProtectedRoute>
      </div>
    </>
  );
};

export default page;
