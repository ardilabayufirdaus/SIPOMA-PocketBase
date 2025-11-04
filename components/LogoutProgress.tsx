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
          icon: <LogOut className="w-6 h-6" />,
          title: 'Memulai Logout...',
          description: 'Menghapus sesi pengguna',
          color: 'blue',
        };
      case 'clearing':
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin" />,
          title: 'Membersihkan Data SIPOMA...',
          description: 'Menghapus cookies & site data untuk localhost dan sipoma.site',
          color: 'orange',
        };
      case 'completing':
        return {
          icon: <Shield className="w-6 h-6" />,
          title: 'Mengamankan Sesi...',
          description: 'Memastikan semua data telah dibersihkan',
          color: 'purple',
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          title: 'Logout Berhasil',
          description: 'Mengarahkan ke halaman login...',
          color: 'green',
        };
      default:
        return {
          icon: <LogOut className="w-6 h-6" />,
          title: 'Logout',
          description: '',
          color: 'blue',
        };
    }
  };

  const stageInfo = getStageInfo();

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 border-blue-400',
      orange: 'bg-orange-500 border-orange-400',
      purple: 'bg-purple-500 border-purple-400',
      green: 'bg-green-500 border-green-400',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Progress Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full">
              {/* Icon dengan animasi */}
              <motion.div
                key={stage}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`w-16 h-16 rounded-full ${getColorClasses(stageInfo.color)} flex items-center justify-center text-white mb-6 mx-auto`}
              >
                {stageInfo.icon}
              </motion.div>

              {/* Content */}
              <div className="text-center">
                <motion.h3
                  key={`title-${stage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
                >
                  {stageInfo.title}
                </motion.h3>

                <motion.p
                  key={`desc-${stage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 dark:text-gray-300 mb-6"
                >
                  {stageInfo.description}
                </motion.p>

                {/* Progress Steps */}
                <div className="flex justify-center space-x-2 mb-4">
                  {['starting', 'clearing', 'completing', 'completed'].map((stepStage, index) => {
                    const isActive = stage === stepStage;
                    const isCompleted =
                      ['starting', 'clearing', 'completing', 'completed'].indexOf(stage) > index;

                    return (
                      <motion.div
                        key={stepStage}
                        initial={{ scale: 0.8 }}
                        animate={{
                          scale: isActive ? 1.2 : 1,
                          backgroundColor: isCompleted || isActive ? '#3B82F6' : '#E5E7EB',
                        }}
                        transition={{ duration: 0.3 }}
                        className={`w-3 h-3 rounded-full ${
                          isCompleted || isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Security Notice */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                >
                  <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Pembersihan terbatas untuk localhost & sipoma.site saja
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogoutProgress;
