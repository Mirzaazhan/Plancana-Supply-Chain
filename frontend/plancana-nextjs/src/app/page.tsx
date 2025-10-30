'use client';

import ContentSection from '@/components/content-5';
import FAQsFour from '@/components/faqs-4';
import FeaturesSection from '@/components/features-2';
import FooterSection from '@/components/footer';
import HeroSection from '@/components/hero-section';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';


export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    } else {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);
  
  const scrollToSection = (elementRef :any) => {
    window.scrollTo({
      top: elementRef.current.offsetTop,
      behavior: "smooth", // This makes the scroll animated
    });
  }; 
  return(
    <>
    <HeroSection></HeroSection>
    <FeaturesSection></FeaturesSection>
    <ContentSection></ContentSection>
    <FAQsFour></FAQsFour>
    <FooterSection></FooterSection>
    </>
  );
}
