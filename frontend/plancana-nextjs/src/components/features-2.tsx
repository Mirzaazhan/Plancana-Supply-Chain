import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Activity, ChartColumnIncreasing, Link } from 'lucide-react'
import { ReactNode, useRef } from 'react'
import Image from 'next/image'



export default function Features(featureRef :any) {
    
    return (
        <section id='feature' className="py-10 md:py-16">
            <div className="@container max-w-8xl lg:mx-40 md:mx-auto sm:mx-auto px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold ">Key Features</h2>
                    {/* <p className="mt-4">Libero sapiente aliquam quibusdam aspernatur, praesentium iusto repellendus.</p> */}
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 [--color-background:var(--color-muted)] [--color-card:var(--color-muted)] *:text-center md:mt-16 dark:[--color-muted:var(--color-zinc-900)]">
                    <Card className="group shadow-xl">
                        
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Link size={44} strokeWidth={2.75} className='text-green-800 m-auto' />
                            </CardDecorator>
                            <h3 className="mt-6 font-medium">End-to-End Traceability</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">Track crops from farm to table with complete transparency</p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-xl">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <ChartColumnIncreasing size={44} strokeWidth={2.75} className='text-green-800 m-auto'  />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Reak-time Monitoring</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Monitor inventory, shipments, and quality metrics in real time</p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-xl">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Activity size={44} strokeWidth={2.75} className='text-green-800 m-auto' />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Smart Analytics</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Make data-driven decisions with advanced analytics and insights</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-50"
        />

        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
    </div>
)
