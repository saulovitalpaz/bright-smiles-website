import { motion } from "framer-motion";
import { PawPrint, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const goToApp = () => navigate("/app", { replace: false });

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500"
        style={{ backgroundImage: "url('/images/home.jpg')" }}
      />
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center max-w-5xl"
        >
          <h1 className="text-5xl md:text-7xl font-black text-primary uppercase tracking-[0.2em] mb-4 drop-shadow-[0_2px_15px_rgba(255,255,255,0.9)]">
            Bem-vindo
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 font-semibold mb-16 tracking-tight">
            Selecione o modo de acesso ao sistema
          </p>

          <div className="flex flex-wrap gap-10 justify-center items-stretch">
            {/* Card Meus Animais */}
            <motion.button
              whileHover={{ y: -12, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={goToApp}
              className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-3xl p-12 w-80 text-left transition-all hover:bg-white hover:border-primary/50 cursor-pointer group"
            >
              <div className="p-4 bg-primary/10 rounded-2xl w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <PawPrint className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-primary text-2xl font-black mb-3">Meus Animais</h3>
              <p className="text-muted-foreground text-base leading-relaxed font-medium">
                Histórico clínico e evolução detalhada dos seus pets.
              </p>
            </motion.button>

            {/* Card ReviverPet */}
            <motion.button
              whileHover={{ y: -12, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={goToApp}
              className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-3xl p-12 w-80 text-left transition-all hover:bg-white hover:border-primary/50 cursor-pointer group"
            >
              <div className="p-4 bg-primary/10 rounded-2xl w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-primary text-2xl font-black mb-3">ReviverPet</h3>
              <p className="text-muted-foreground text-base leading-relaxed font-medium">
                Dashboard clínico completo para gestão profissional.
              </p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
