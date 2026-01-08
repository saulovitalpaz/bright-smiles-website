import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Team from "@/components/sections/Team";
import Blog from "@/components/sections/Blog";
import AppointmentForm from "@/components/sections/AppointmentForm";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <Team />
        <Blog />
        <AppointmentForm />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
