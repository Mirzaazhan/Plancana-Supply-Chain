import React from 'react'
import { Mail, SendHorizonal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from '@/components/header'
import { LogoCloud } from '@/components/logo-cloud'
import Image from 'next/image'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function HeroSection() {
    return (
        <>
            <main className="overflow-hidden">
                <HeroHeader></HeroHeader>
                <section className='bg-gradient-to-br from-[#00531e] to-[#318026] pb-10'>
                    <div className="w-full px-1 pt-32 lg:pb-16 lg:pt-48">
                        <div className="flex flex-row gap-x-20 max-w-8xl lg:mx-40 md:mx-auto sm:mx-auto">
                            <div className="basis-1/2 md: px-5">
                                <div className="relative z-10">
                                    <TextEffect
                                        preset="fade-in-blur"
                                        speedSegment={0.3}
                                        as="h1"
                                        className=" text-balance text-white text-3xl font-bold sm:text-5xl md:text-6xl">
                                        Revolutionize Your Agricultural Supply Chain Management
                                    </TextEffect>
                                    <TextEffect
                                        per="line"
                                        preset="fade-in-blur"
                                        speedSegment={0.3}
                                        delay={0.5}
                                        as="p"
                                        className="text-white mt-12 max-w-2xl text-pretty text-lg">
                                        Track, manage, and optimize your agricultural operations with complete transparency and real-time visibility
                                    </TextEffect>

                                    <AnimatedGroup
                                        variants={{
                                            container: {
                                                visible: {
                                                    transition: {
                                                        staggerChildren: 0.05,
                                                        delayChildren: 0.75,
                                                    },
                                                },
                                            },
                                            ...transitionVariants,
                                        }}
                                        className="mt-12">
                                        <form
                                            action=""
                                            className="max-w-sm">
                                            <div className="bg-background has-[input:focus]:ring-muted relative grid grid-cols-[1fr_auto] items-center rounded-[calc(var(--radius)+0.5rem)] border pr-2 shadow shadow-zinc-950/5 has-[input:focus]:ring-2">
                                                <Mail className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4" />

                                                <input
                                                    placeholder="Your mail address"
                                                    className="h-12 w-full bg-transparent pl-12 focus:outline-none"
                                                    type="email"
                                                />

                                                <div className="md:pr-1.5 lg:pr-0">
                                                    <Button
                                                        aria-label="submit"
                                                        size="sm"
                                                        className="rounded-(--radius) bg-green-800 hover:bg-gray-300 hover:text-green-800">
                                                        <span className="hidden md:block">Get Started</span>
                                                        <SendHorizonal
                                                            className="relative mx-auto size-5 md:hidden"
                                                            strokeWidth={2}
                                                        />
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    </AnimatedGroup>
                                </div>
                            </div>
                            <div className="basis-1/2 relative h-[400px]">
                            <Image
                                src="/agri-pic.svg"
                                alt="agri picture"
                                fill
                                className="object-cover"
                            />
                            </div>
                        </div>   
                    </div>
                </section>
                {/* <LogoCloud /> */}
            </main>
        </>
    )
}