export interface ModelFingerprint {
  id: string;
  name: string;
  family: 'gemini' | 'claude' | 'openai' | 'custom';
  keywords: string[];
  patterns: RegExp[];
  typicalSpeedTpsRange: [number, number];
  typicalTtftMsRange: [number, number];
  thinkingSupport: boolean;
  description: string;
}

export const KNOWN_MODELS: ModelFingerprint[] = [
  {
    id: 'gemini-3.8-flash-high',
    name: 'Gemini 3.8 Flash (High)',
    family: 'gemini',
    keywords: ['Gemini 3.8 Flash (High)', 'gemini-3.8-flash', 'flash-high'],
    patterns: [/3\.8[-_\s]flash.*high/i, /gemini.*3\.8.*flash/i],
    typicalSpeedTpsRange: [60, 150],
    typicalTtftMsRange: [200, 800],
    thinkingSupport: true,
    description: 'Google 最新 3.8 Flash 高思考深度模型，兼具毫秒级响应速度与深度多步规划推理能力。'
  },
  {
    id: 'gemini-3.8-flash-low',
    name: 'Gemini 3.8 Flash (Low)',
    family: 'gemini',
    keywords: ['Gemini 3.8 Flash (Low)', 'flash-low'],
    patterns: [/3\.8[-_\s]flash.*low/i],
    typicalSpeedTpsRange: [80, 180],
    typicalTtftMsRange: [150, 500],
    thinkingSupport: false,
    description: 'Google 3.8 Flash 低思考/极速模式，适合极速代码补全与轻量查询。'
  },
  {
    id: 'gemini-3.8-pro',
    name: 'Gemini 3.8 Pro',
    family: 'gemini',
    keywords: ['Gemini 3.8 Pro', 'gemini-3.8-pro', 'pro-high'],
    patterns: [/3\.8[-_\s]pro/i, /gemini.*3\.8.*pro/i],
    typicalSpeedTpsRange: [25, 60],
    typicalTtftMsRange: [800, 2500],
    thinkingSupport: true,
    description: 'Google 3.8 Pro 旗舰推理模型，针对复杂架构设计、重构与数学代码推演优化。'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    family: 'gemini',
    keywords: ['Gemini 2.5 Pro', 'gemini-2.5-pro'],
    patterns: [/2\.5[-_\s]pro/i, /gemini.*2\.5.*pro/i],
    typicalSpeedTpsRange: [20, 50],
    typicalTtftMsRange: [800, 2500],
    thinkingSupport: true,
    description: 'Gemini 2.5 系列旗舰 Pro 模型。'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    family: 'gemini',
    keywords: ['Gemini 2.5 Flash', 'gemini-2.5-flash'],
    patterns: [/2\.5[-_\s]flash/i],
    typicalSpeedTpsRange: [70, 140],
    typicalTtftMsRange: [200, 600],
    thinkingSupport: false,
    description: 'Gemini 2.5 系列极速小模型。'
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    family: 'claude',
    keywords: ['Claude 3.7 Sonnet', 'claude-3-7-sonnet'],
    patterns: [/claude.*3\.7.*sonnet/i],
    typicalSpeedTpsRange: [40, 90],
    typicalTtftMsRange: [500, 1500],
    thinkingSupport: true,
    description: 'Anthropic 混合推理模型，具备可配置思考预算。'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    family: 'claude',
    keywords: ['Claude 3.5 Sonnet', 'claude-3-5-sonnet'],
    patterns: [/claude.*3\.5.*sonnet/i],
    typicalSpeedTpsRange: [50, 90],
    typicalTtftMsRange: [400, 1200],
    thinkingSupport: false,
    description: '业界标杆级代码与指令跟随模型。'
  }
];
