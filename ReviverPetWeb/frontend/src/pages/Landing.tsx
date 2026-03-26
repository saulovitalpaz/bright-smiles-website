import { motion } from "framer-motion";
import { PawPrint, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center w-full max-w-2xl"
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-primary uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4 drop-shadow-[0_2px_15px_rgba(255,255,255,0.9)]">
            Bem-vindo
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-foreground/90 font-semibold mb-8 sm:mb-12 tracking-tight">
            Selecione o modo de acesso ao sistema
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-center">
            {/* Card Meus Animais */}
            <motion.button
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app?mode=personal")}
              className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-3xl p-6 sm:p-10 text-left transition-all hover:bg-white hover:border-primary/50 cursor-pointer group w-full"
            >
              <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl w-fit mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <PawPrint className="h-9 w-9 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-primary text-xl sm:text-2xl font-black mb-2 sm:mb-3">Meus Animais</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
                Histórico clínico e evolução detalhada dos seus pets.
              </p>
            </motion.button>

            {/* Card ReviverPet */}
            <motion.button
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app?mode=clinical")}
              className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-3xl p-6 sm:p-10 text-left transition-all hover:bg-white hover:border-primary/50 cursor-pointer group w-full"
            >
              <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl w-fit mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-9 w-9 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-primary text-xl sm:text-2xl font-black mb-2 sm:mb-3">ReviverPet</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
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
