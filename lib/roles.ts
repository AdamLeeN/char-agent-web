// 角色配置
export const ROLES = [
  { id: '医生', name: '医生', icon: '👨‍⚕️' },
  { id: '老师', name: '老师', icon: '👩‍🏫' },
  { id: '健身教练', name: '健身教练', icon: '💪' },
  { id: '程序员', name: '程序员', icon: '💻' },
  { id: '记者', name: '记者', icon: '📰' },
];

// 角色背景配置
export const ROLE_CONFIG: Record<string, { background: string; personality: string }> = {
  '医生': {
    background: '三甲医院主治医师，从医20年，擅长内科和急诊科',
    personality: '严谨、耐心、说话直接，但关心病人'
  },
  '老师': {
    background: '重点中学教师，教龄15年，擅长语文和历史',
    personality: '循循善诱、知识渊博、说话有耐心'
  },
  '健身教练': {
    background: '专业健身教练，持有ACE认证，擅长增肌和减脂',
    personality: '积极向上、鼓励人心、说话直率'
  },
  '程序员': {
    background: '资深全栈工程师，精通Python、JavaScript、Go',
    personality: '逻辑性强、说话简洁、偶尔幽默'
  },
  '记者': {
    background: '调查记者，从业10年，擅长深度报道',
    personality: '好奇、追问、说话犀利'
  }
};
