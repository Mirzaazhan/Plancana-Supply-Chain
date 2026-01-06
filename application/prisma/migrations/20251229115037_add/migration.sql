-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "distributor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
