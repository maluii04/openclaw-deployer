import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/shell';

interface CheckResult {
  name: string;
  installed: boolean;
  version: string | null;
  required: boolean;
  can_auto_install: boolean;
  install_url: string;
  install_guide: string[];
}

interface SystemReport {
  platform: string;
  all_ready: boolean;
  checks: CheckResult[];
}

interface SystemCheckProps {
  onReady: () => void;
}

export default function SystemCheck({ onReady }: SystemCheckProps) {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await invoke<SystemReport>('check_all_requirements');
      setReport(result);
    } catch (err) {
      console.error('检测失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoInstall = async (name: string) => {
    if (name === 'Docker') {
      setInstalling('Docker');
      setInstallResult(null);
      try {
        const result = await invoke<{ success: boolean; message: string }>('auto_install_docker');
        setInstallResult(result.message);
        if (result.success) {
          setTimeout(() => {
            loadReport();
          }, 3000);
        }
      } catch (err) {
        setInstallResult('安装失败: ' + String(err));
      } finally {
        setInstalling(null);
      }
    }
  };

  const handleOpenUrl = async (url: string) => {
    await open(url);
  };

  const toggleExpand = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">正在检测...</h2>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">检测失败</p>
          <button
            onClick={loadReport}
            className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const requiredChecks = report.checks.filter(c => c.required);
  const missingRequired = requiredChecks.filter(c => !c.installed);
  const allReady = missingRequired.length === 0;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">OpenClaw Deployer</h1>
          <p className="text-white/70">一键部署 AI 助手平台</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl p-6 mb-6 ${allReady ? 'bg-green-500/90' : 'bg-amber-500/90'} backdrop-blur`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {allReady ? (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {allReady ? '系统环境已就绪' : `缺少 ${missingRequired.length} 个必需组件`}
              </h2>
              <p className="text-white/80">
                {allReady ? '可以开始部署 OpenClaw' : '请安装以下组件后继续'}
              </p>
            </div>
            {allReady && (
              <button
                onClick={onReady}
                className="px-6 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-white/90 transition"
              >
                开始部署
              </button>
            )}
          </div>
        </div>

        {/* Install Result */}
        {installResult && (
          <div className="bg-blue-500/90 backdrop-blur rounded-xl p-4 mb-4 text-white">
            <p>{installResult}</p>
          </div>
        )}

        {/* Checks List */}
        <div className="space-y-3">
          <h3 className="text-white/70 text-sm font-semibold uppercase tracking-wider">环境检测</h3>
          
          {report.checks.map((check) => {
            const isExpanded = expandedItem === check.name;
            
            return (
              <div
                key={check.name}
                className={`rounded-xl overflow-hidden backdrop-blur ${
                  check.installed ? 'bg-white/10' : 'bg-white/20'
                }`}
              >
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => !check.installed && toggleExpand(check.name)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    check.installed ? 'bg-green-500' : 'bg-amber-500'
                  }`}>
                    {check.installed ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{check.name}</span>
                      {check.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/80 text-white rounded">必需</span>
                      )}
                    </div>
                    {check.version && (
                      <p className="text-sm text-white/70">{check.version}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {check.installed ? (
                      <span className="text-green-300 text-sm font-medium">已安装</span>
                    ) : (
                      <>
                        <span className="text-amber-300 text-sm font-medium">未安装</span>
                        <svg className={`w-5 h-5 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Expanded Content */}
                {!check.installed && isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="pt-4 space-y-4">
                      <div>
                        <h4 className="text-white/80 text-sm mb-2">安装步骤：</h4>
                        <ol className="space-y-1">
                          {check.install_guide.map((step, i) => (
                            <li key={i} className="text-white/60 text-sm">{step}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div className="flex gap-2">
                        {check.can_auto_install && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoInstall(check.name);
                            }}
                            disabled={installing === check.name}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50"
                          >
                            {installing === check.name ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                安装中...
                              </span>
                            ) : (
                              '一键安装'
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUrl(check.install_url);
                          }}
                          className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
                        >
                          官网下载
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={loadReport}
            className="text-white/50 hover:text-white text-sm transition"
          >
            重新检测
          </button>
        </div>
      </div>
    </div>
  );
}
