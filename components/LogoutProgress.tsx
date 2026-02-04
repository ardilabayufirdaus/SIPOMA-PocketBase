import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, CheckCircle, Shield } from 'lucide-react';

interface LogoutProgressProps {
  isVisible: boolean;
  stage: 'starting' | 'clearing' | 'completing' | 'completed';
}

const LogoutProgress: React.FC<LogoutProgressProps> = ({ isVisible, stage }) => {
  const getStageInfo = () => {
    switch (stage) {
      case 'starting':
        return {
          icon: <LogOut className="w-7 h-7" />,
          title: 'Memulai Logout...',
          description: 'Mengakhiri sesi aman Anda',
          color: 'orange',
        };
      case 'clearing':
        return {
          icon: <Loader2 className="w-7 h-7 animate-spin" />,
          title: 'Membersihkan Sistem...',
          description: 'Menghapus cookies & cache data SIPOMA',
          color: 'orange',
        };
      case 'completing':
        return {
          icon: <Shield className="w-7 h-7 text-ubuntu-orange" />,
          title: 'Mengamankan Data...',
          description: 'Menjamin privasi sesi telah terhapus',
          color: 'orange',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-7 h-7" />,
          title: 'Logout Berhasil',
          description: 'Mengarahkan ke halaman login...',
          color: 'green',
        };
      default:
        return {
          icon: <LogOut className="w-7 h-7" />,
          title: 'Logout',
          description: '',
          color: 'orange',
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop with Ubuntu Aubergine Tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#1a0513]/90 backdrop-blur-md"
          />

          {/* Progress Modal - Ubuntu Style */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-950 border border-white/10 shadow-2xl shadow-black/80 font-ubuntu"
          >
            {/* Header Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-ubuntu-orange via-ubuntu-orange/50 to-ubuntu-orange" />

            <div className="p-10">
              {/* Icon with Ubuntu Glow */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-ubuntu-orange blur-2xl rounded-full"
                  />
                  <motion.div
                    key={stage}
                    initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl relative z-10 ${
                      stage === 'completed'
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                        : 'bg-gradient-to-br from-ubuntu-orange to-orange-600'
                    }`}
                  >
                    {stageInfo.icon}
                  </motion.div>
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center space-y-3 mb-10">
                <motion.h3
                  key={`title-${stage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-white tracking-tight"
                >
                  {stageInfo.title}
                </motion.h3>
                <motion.p
                  key={`desc-${stage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/60 text-sm font-medium leading-relaxed"
                >
                  {stageInfo.description}
                </motion.p>
              </div>

              {/* Progress Stepper - Ubuntu Style */}
              <div className="flex justify-center items-center gap-3 mb-8">
                {['starting', 'clearing', 'completing', 'completed'].map((stepStage, index) => {
                  const stageOrder = ['starting', 'clearing', 'completing', 'completed'];
                  const currentIndex = stageOrder.indexOf(stage);
                  const stepIndex = stageOrder.indexOf(stepStage);
                  const isActive = stage === stepStage;
                  const isCompleted = currentIndex > stepIndex;

                  return (
                    <div key={stepStage} className="flex items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? 1.25 : 1,
                          backgroundColor:
                            isCompleted || isActive ? '#E95420' : 'rgba(255,255,255,0.1)',
                          boxShadow: isActive ? '0 0 15px rgba(233, 84, 32, 0.5)' : 'none',
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-white/5"
                      />
                      {index < 3 && (
                        <div className="w-4 h-0.5 bg-white/5 mx-1 overflow-hidden">
                          <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: isCompleted ? '0%' : '-100%' }}
                            className="w-full h-full bg-ubuntu-orange/40"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Security Banner */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-black/20 border border-white/5 rounded-2xl p-4 transition-all hover:bg-black/30"
              >
                <div className="flex items-center gap-3 text-white/50">
                  <Shield className="w-4 h-4 text-ubuntu-orange" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Sistem Keamanan Aktif
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Ubuntu Style Footer Bar */}
            <div className="bg-black/40 px-8 py-3 flex justify-center">
              <div className="w-12 h-1 rounded-full bg-white/10 animate-pulse" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogoutProgress;
