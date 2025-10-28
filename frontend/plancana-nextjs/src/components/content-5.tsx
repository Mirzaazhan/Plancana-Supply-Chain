import { CircleCheckBig, DiamondPlus, MapPlus, Sparkles } from 'lucide-react'

export default function ContentSection() {
    return (
        <section id='content' className="bg-gradient-to-br from-[#00531e] to-[#318026] py-10 md:py-16">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
                <div className="mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-semibold text-white ">Why Choose Plancana</h2>
                </div>
                <img className="rounded-(--radius)" src='/agri-pic.jpeg' alt="team image" height="" width="" loading="lazy" />

                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-white" />
                            <h3 className="text-sm font-medium text-white">Enhance Efficiency</h3>
                        </div>
                        <p className=" text-sm text-gray-300">Streamline operations and reduce manual processes.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CircleCheckBig className="size-4 text-white" />
                            <h3 className="text-sm font-medium text-white">Ensure Compliance</h3>
                        </div>
                        <p className="text-gray-300 text-sm">Meet regulatory requirements with automated documentation.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DiamondPlus className="size-4 text-white" />
                            <h3 className="text-sm font-medium text-white">Increase Transparency</h3>
                        </div>
                        <p className="text-gray-300 text-sm">Track every stage of the agricultural supply chain using blockchain technology from cultivation to distribution.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPlus className="size-4 text-white"/>

                            <h3 className="text-sm font-medium text-white">Improve Traceability</h3>
                        </div>
                        <p className="text-gray-300 text-sm">Access real-time data on crop origins, processing, and logistics through GIS-based tracking.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
