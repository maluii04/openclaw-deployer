import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/shell';
import SystemCheck from './components/SystemCheck';
import DeployWizard from './components/DeployWizard';

function App() {
  const [systemReady, setSystemReady] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSystem();
  }, []);

  const checkSystem = async () => {
    try {
      const result = await invoke<any>('check_all_requirements');
      setSystemReady(result.all_ready);
    } catch (err) {
      console.error('检测失败:', err);
      setSystemReady(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSystemReady = () => {
    setSystemReady(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">正在检测系统环境...</h2>
          <p className="text-white/80">请稍候</p>
        </div>
      </div>
    );
  }

  if (!systemReady) {
    return <SystemCheck onReady={handleSystemReady} />;
  }

  return <DeployWizard />;
}

export default App;
