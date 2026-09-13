import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Team from "@/components/sections/Team";
import Stories from "@/components/sections/Stories";
import AppointmentForm from "@/components/sections/AppointmentForm";
import Contact from "@/components/sections/Contact";
import Feedback from "@/components/sections/Feedback";
import TestimonialsCarousel from "@/components/sections/TestimonialsCarousel";
import Footer from "@/components/layout/Footer";
import "@/styles/homepage.css";

const Index = () => {
  return (
    <div className="homepage min-h-[100dvh] bg-background">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:p-3 focus:text-foreground">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Services />
        <Stories />
        <Team />
        <div className="home-contact-layout section-padding">
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
