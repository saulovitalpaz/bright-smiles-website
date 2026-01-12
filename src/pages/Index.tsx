import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Team from "@/components/sections/Team";
import Blog from "@/components/sections/Blog";
import Stories from "@/components/sections/Stories";
import AppointmentForm from "@/components/sections/AppointmentForm";
import Contact from "@/components/sections/Contact";
import Feedback from "@/components/sections/Feedback";
import TestimonialsCarousel from "@/components/sections/TestimonialsCarousel";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <Stories />
        <Team />
        <Blog />
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-accent/20 border-y border-border overflow-hidden">
          <AppointmentForm />
          <Contact />
        </div>
        <TestimonialsCarousel />
        <Feedback />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
