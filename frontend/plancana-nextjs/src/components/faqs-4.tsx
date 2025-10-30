'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'

export default function FAQsFour() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'What is Plancana?',
            answer: 'Plancana is a blockchain and GIS-based platform that provides end-to-end tracking for agricultural products from farm to export , ensuring transparency, compliance, and efficiency.',
        },
        {
            id: 'item-2',
            question: 'How does Plancana help farmers?',
            answer: 'It automates recordkeeping, helps monitor crop health through GIS maps, and provides insights to improve yield and sustainability.',
        },
        {
            id: 'item-3',
            question: 'How does blockchain improve transparency?',
            answer: 'Every transaction and process step is stored securely and immutably on the blockchain, making data tamper-proof and fully traceable.',
        },
        {
            id: 'item-4',
            question: 'What kind of data can be tracked?',
            answer: "Farm location, crop type, weather conditions, fertilizer usage, processing details, and export documentation .All linked to a unique batch ID.",
        },
        {
            id: 'item-5',
            question: 'How does Plancana ensure compliance?',
            answer: 'It automatically generates digital documentation that aligns with regulatory and export requirements.',
        },
    ]

    return (
        <section id='faq' className="bg-white py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="mx-auto max-w-xl text-center">
                    <h2 className="text-balance text-4xl font-bold md:text-4xl lg:text-5xl">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground mt-4 text-balance">Discover quick and comprehensive answers to common questions about our platform, services, and features.</p>
                </div>

                <div className="mx-auto mt-12 max-w-xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="bg-green-50 dark:bg-muted/50 w-full rounded-2xl p-1">
                        {faqItems.map((item) => (
                            <div
                                className="group"
                                key={item.id}>
                                <AccordionItem
                                    value={item.id}
                                    className="data-[state=open]:bg-card dark:data-[state=open]:bg-muted peer rounded-xl border-none px-7 py-1 data-[state=open]:border-none data-[state=open]:shadow-sm">
                                    <AccordionTrigger className="cursor-pointer text-base hover:no-underline">{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-base">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <hr className="mx-7 border-dashed group-last:hidden peer-data-[state=open]:opacity-0" />
                            </div>
                        ))}
                    </Accordion>

                    <p className="text-muted-foreground mt-6 px-8">
                        Can't find what you're looking for? Contact our{' '}
                        <Link
                            href="#"
                            className="text-primary font-medium hover:underline">
                            customer support team
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
