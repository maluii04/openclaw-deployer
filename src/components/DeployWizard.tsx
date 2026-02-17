import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/shell';

const modelProviders = [
  { id: 'anthropic', name: 'Claude (Anthropic)', icon: '🧠', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', name: 'GPT (OpenAI)', icon: '⚡', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Gemini (Google)', icon: '🔮', keyUrl: 'https://aistudio.google.com/app/apikey' },
];

const channels = [
  { id: 'wechatwork', name: '企业微信', icon: '💼', guide: '群设置 → 群机器人 → 添加机器人 → 复制 Webhook Key' },
  { id: 'feishu', name: '飞书', icon: '📱', guide: '群设置 → 群机器人 → 自定义机器人 → 复制 Webhook URL' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', guide: '@BotFather → /newbot → 复制 Token' },
  { id: 'slack', name: 'Slack', icon: '💬', guide: 'api.slack.com/apps → Create New App → 复制 Bot Token' },
];

const skills = [
  { id: 'web_search', name: '网页搜索', desc: '让 AI 可以搜索互联网' },
  { id: 'browser', name: '浏览器', desc: '让 AI 可以浏览网页' },
  { id: 'github', name: 'GitHub', desc: '管理代码仓库' },
  { id: 'file_manager', name: '文件管理', desc: '管理本地文件' },
];

export default function DeployWizard() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    provider: '',
    apiKey: '',
    channels: [] as string[],
    channelTokens: {} as Record<string, string>,
    selectedSkills: ['web_search'],
  });
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);

  const canProceed = () => {
    switch (step) {
      case 1: return config.provider && config.apiKey;
      case 2: return config.channels.length > 0 && config.channels.every(c => config.channelTokens[c]);
      case 3: return config.selectedSkills.length > 0;
      default: return true;
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployResult(null);
    
    // 模拟部署过程
    await new Promise(r => setTimeout(r, 3000));
    
    setDeployResult('部署成功！OpenClaw 已启动在 http://localhost:18789');
    setDeploying(false);
  };

  const openUrl = async (url: string) => {
    await open(url);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white mb-2">OpenClaw Deployer</h1>
          <p className="text-white/70">步骤 {step}/4</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition ${
                s <= step ? 'bg-white' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step 1: AI Model */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">选择 AI 模型</h2>
            
            <div className="space-y-3">
              {modelProviders.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setConfig({ ...config, provider: p.id })}
                  className={`p-4 rounded-xl cursor-pointer transition ${
                    config.provider === p.id
                      ? 'bg-white/30 ring-2 ring-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{p.name}</p>
                    </div>
                    {config.provider === p.id && (
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {config.provider && (
              <div className="bg-white/10 rounded-xl p-4">
                <label className="block text-white/70 text-sm mb-2">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="输入你的 API Key"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50"
                />
                <button
                  onClick={() => openUrl(modelProviders.find(p => p.id === config.provider)?.keyUrl || '')}
                  className="mt-2 text-sm text-white/60 hover:text-white transition"
                >
                  获取 API Key →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Channels */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">选择通信渠道</h2>
            
            <div className="space-y-3">
              {channels.map((c) => {
                const isSelected = config.channels.includes(c.id);
                return (
                  <div key={c.id}>
                    <div
                      onClick={() => {
                        const newChannels = isSelected
                          ? config.channels.filter(id => id !== c.id)
                          : [...config.channels, c.id];
                        setConfig({ ...config, channels: newChannels });
                      }}
                      className={`p-4 rounded-xl cursor-pointer transition ${
                        isSelected
                          ? 'bg-white/30 ring-2 ring-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{c.name}</p>
                        </div>
                        {isSelected && (
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-2 ml-4 p-4 bg-white/5 rounded-lg">
                        <p className="text-white/60 text-sm mb-2">{c.guide}</p>
                        <input
                          type="password"
                          value={config.channelTokens[c.id] || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            channelTokens: { ...config.channelTokens, [c.id]: e.target.value }
                          })}
                          placeholder={`输入 ${c.name} Token`}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Skills */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">选择 Skills</h2>
            
            <div className="space-y-3">
              {skills.map((s) => {
                const isSelected = config.selectedSkills.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      const newSkills = isSelected
                        ? config.selectedSkills.filter(id => id !== s.id)
                        : [...config.selectedSkills, s.id];
                      setConfig({ ...config, selectedSkills: newSkills });
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-white/30 ring-2 ring-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{s.name}</p>
                        <p className="text-sm text-white/60">{s.desc}</p>
                      </div>
                      {isSelected && (
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Deploy */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">确认配置</h2>
            
            <div className="bg-white/10 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-white/60 text-sm">AI 模型</p>
                <p className="text-white">{modelProviders.find(p => p.id === config.provider)?.name}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">通信渠道</p>
                <p className="text-white">{config.channels.map(c => channels.find(ch => ch.id === c)?.name).join(', ')}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Skills</p>
                <p className="text-white">{config.selectedSkills.map(s => skills.find(sk => sk.id === s)?.name).join(', ')}</p>
              </div>
            </div>

            {deployResult && (
              <div className="bg-green-500/90 rounded-xl p-4 text-white">
                <p>{deployResult}</p>
                <button
                  onClick={() => open('http://localhost:18789')}
                  className="mt-2 text-sm underline"
                >
                  打开 OpenClaw →
                </button>
              </div>
            )}

            <button
              onClick={handleDeploy}
              disabled={deploying || !!deployResult}
              className="w-full py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-white/90 transition disabled:opacity-50"
            >
              {deploying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  部署中...
                </span>
              ) : deployResult ? (
                '部署完成'
              ) : (
                '开始部署'
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              上一步
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-white/90 transition disabled:opacity-50"
            >
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
