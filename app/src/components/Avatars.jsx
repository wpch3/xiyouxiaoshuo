import React from 'react';

// 精心绘制的高质量拟人立绘 SVG 组件，符合各大 AI 知名形象
// 包含闲置呼吸动画、眨眼、不同情绪（开心/思考/疲倦/吃惊）、对话泡泡

export const ClaudeAvatar = ({ mood = 'idle', size = 260, interactive = false }) => {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 300 390" fill="none" xmlns="http://www.w3.org/2000/svg" className="character-svg">
      <defs>
        <linearGradient id="claude-hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C96442" />
          <stop offset="50%" stopColor="#D97757" />
          <stop offset="100%" stopColor="#9C3E1F" />
        </linearGradient>
        <linearGradient id="claude-robe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2D2926" />
          <stop offset="100%" stopColor="#191716" />
        </linearGradient>
        <linearGradient id="claude-acc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E39478" />
          <stop offset="100%" stopColor="#C96442" />
        </linearGradient>
        <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 背后学者光环/星轨 */}
      <circle cx="150" cy="140" r="110" stroke="#D97757" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.3" className="spin-slow" />
      <circle cx="150" cy="140" r="85" stroke="#E39478" strokeWidth="1" strokeDasharray="4 6" opacity="0.25" />
      {/* 悬浮算式与哲学符号 */}
      <text x="235" y="80" fill="#D97757" fontSize="12" fontFamily="serif" opacity="0.6">3.7 Sonnet</text>
      <text x="50" y="90" fill="#D97757" fontSize="12" fontFamily="serif" opacity="0.5">Constitutional</text>

      {/* 飘逸后长发 (赤陶色长发、优雅微卷学者气质) */}
      <path d="M95 140 C80 200, 60 270, 75 320 C85 300, 100 240, 105 180 Z" fill="#9C3E1F" opacity="0.8" />
      <path d="M205 140 C220 200, 240 270, 225 320 C215 300, 200 240, 195 180 Z" fill="#9C3E1F" opacity="0.8" />

      {/* 身体 & 燕尾学者风琴礼服 */}
      <path d="M110 230 C90 260, 80 340, 70 380 L230 380 C220 340, 210 260, 190 230 Z" fill="url(#claude-robe)" />
      {/* 领口暖橘色围巾/衬衫 */}
      <path d="M125 210 L150 250 L175 210 L150 225 Z" fill="url(#claude-acc)" />
      <path d="M150 235 L150 290" stroke="#F5D0C5" strokeWidth="2" strokeDasharray="3 3" />
      {/* 精致领结 */}
      <polygon points="142,228 158,228 150,235" fill="#E39478" />

      {/* 脸部轮廓 (温润典雅学者美少女) */}
      <path d="M115 130 C115 190, 185 190, 185 130 C185 95, 115 95, 115 130 Z" fill="#FFF2EB" />
      {/* 淡淡腮红 */}
      <ellipse cx="126" cy="148" rx="8" ry="4" fill="#FFA588" opacity="0.45" />
      <ellipse cx="174" cy="148" rx="8" ry="4" fill="#FFA588" opacity="0.45" />

      {/* 标志性金属圆框金丝眼镜 (Anthropic 理性严谨特质) */}
      <circle cx="132" cy="138" r="14" stroke="#D4AF37" strokeWidth="2.2" fill="rgba(255,255,255,0.2)" />
      <circle cx="168" cy="138" r="14" stroke="#D4AF37" strokeWidth="2.2" fill="rgba(255,255,255,0.2)" />
      <line x1="146" y1="138" x2="154" y2="138" stroke="#D4AF37" strokeWidth="2.5" />
      {/* 镜腿金链吊坠 */}
      <path d="M182 140 C190 155, 192 175, 188 190" stroke="#D4AF37" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
      <circle cx="188" cy="192" r="3" fill="#D97757" />

      {/* 眼睛 - 琥珀金棕深邃眼眸 */}
      {mood === 'happy' ? (
        <>
          <path d="M124 138 Q132 130 140 138" stroke="#331A10" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M160 138 Q168 130 176 138" stroke="#331A10" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : mood === 'sleepy' ? (
        <>
          <path d="M124 140 Q132 144 140 140" stroke="#4A2618" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M160 140 Q168 144 176 140" stroke="#4A2618" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* 左眼 */}
          <ellipse cx="132" cy="138" rx="7" ry="8.5" fill="#5A2E1B" />
          <circle cx="132" cy="139" r="5" fill="#D97757" />
          <circle cx="130" cy="135" r="2.5" fill="#FFF" />
          {/* 右眼 */}
          <ellipse cx="168" cy="138" rx="7" ry="8.5" fill="#5A2E1B" />
          <circle cx="168" cy="139" r="5" fill="#D97757" />
          <circle cx="166" cy="135" r="2.5" fill="#FFF" />
        </>
      )}

      {/* 嘴巴 */}
      {mood === 'happy' ? (
        <path d="M144 162 Q150 169 156 162" stroke="#B84A28" strokeWidth="2" strokeLinecap="round" fill="#FFA588" />
      ) : mood === 'thinking' ? (
        <circle cx="150" cy="162" r="2.5" fill="#B84A28" />
      ) : (
        <path d="M145 162 Q150 164 155 162" stroke="#B84A28" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      )}

      {/* 优雅赤陶波浪刘海与发型 */}
      <path d="M108 120 C105 70, 195 70, 192 120 C180 95, 160 100, 150 105 C140 100, 120 95, 108 120 Z" fill="url(#claude-hair)" />
      {/* 遮耳鬓发 */}
      <path d="M108 115 C102 145, 106 180, 114 195 C116 185, 114 150, 118 130 Z" fill="url(#claude-hair)" />
      <path d="M192 115 C198 145, 194 180, 186 195 C184 185, 186 150, 182 130 Z" fill="url(#claude-hair)" />

      {/* 标志性发饰：Anthropic 八角光芒/羽毛星徽 */}
      <g transform="translate(192, 95) scale(0.9)">
        <polygon points="10,0 13,7 20,10 13,13 10,20 7,13 0,10 7,7" fill="#E39478" />
        <circle cx="10" cy="10" r="3" fill="#FFF" />
      </g>

      {/* 手持羽毛笔与古代宪法法典/笔记本 */}
      <g transform="translate(105, 270)">
        <rect x="0" y="0" width="90" height="60" rx="6" fill="#4E3629" stroke="#D4AF37" strokeWidth="2" />
        <line x1="45" y1="0" x2="45" y2="60" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M15 15 L35 15 M15 25 L38 25 M15 35 L30 35 M55 15 L75 15 M55 25 L78 25" stroke="#E6D3B3" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="45" cy="50" r="4" fill="#D97757" />
      </g>
      {/* 羽毛笔斜插 */}
      <path d="M185 245 L215 210" stroke="#E39478" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M210 205 C220 200, 222 215, 215 220 Z" fill="#D97757" />
    </svg>
  );
};

export const OpenAIAvatar = ({ mood = 'idle', size = 260 }) => {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 300 390" fill="none" xmlns="http://www.w3.org/2000/svg" className="character-svg">
      <defs>
        <linearGradient id="oai-hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10A37F" />
          <stop offset="60%" stopColor="#0B795E" />
          <stop offset="100%" stopColor="#054E3C" />
        </linearGradient>
        <linearGradient id="oai-suit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E232A" />
          <stop offset="100%" stopColor="#0F141C" />
        </linearGradient>
        <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F5A0" />
          <stop offset="100%" stopColor="#00D9F5" />
        </linearGradient>
      </defs>

      {/* 背后科技环 - 经典的涡状螺旋环 (OpenAI Logo 拟化) */}
      <g transform="translate(150, 140) scale(0.95)" className="spin-slow">
        <circle cx="0" cy="0" r="105" stroke="url(#neon-cyan)" strokeWidth="1.8" strokeDasharray="16 12" opacity="0.4" />
        <circle cx="0" cy="0" r="80" stroke="#10A37F" strokeWidth="1" strokeDasharray="8 6" opacity="0.3" />
      </g>
      <text x="210" y="70" fill="#10A37F" fontSize="12" fontFamily="monospace" opacity="0.7">GPT-4o</text>
      <text x="45" y="80" fill="#10A37F" fontSize="12" fontFamily="monospace" opacity="0.6">&gt; Omni Mode</text>

      {/* 翡翠绿双马尾 / 科技感束发 */}
      <path d="M85 130 C55 170, 40 250, 60 310 C65 260, 85 200, 95 160 Z" fill="#0B795E" opacity="0.9" />
      <path d="M215 130 C245 170, 260 250, 240 310 C235 260, 215 200, 205 160 Z" fill="#0B795E" opacity="0.9" />

      {/* 机能风制服 & 赛博夹克 */}
      <path d="M105 230 C85 260, 75 340, 65 380 L235 380 C225 340, 215 260, 195 230 Z" fill="url(#oai-suit)" />
      {/* 领部荧光呼吸灯带 */}
      <path d="M125 210 L150 245 L175 210" stroke="url(#neon-cyan)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M150 245 L150 350" stroke="#10A37F" strokeWidth="2" strokeDasharray="6 4" />

      {/* 脸部 */}
      <path d="M115 130 C115 190, 185 190, 185 130 C185 95, 115 95, 115 130 Z" fill="#FFF7F2" />
      {/* 科技感小巧腮红 */}
      <ellipse cx="126" cy="148" rx="7" ry="3.5" fill="#10A37F" opacity="0.25" />
      <ellipse cx="174" cy="148" rx="7" ry="3.5" fill="#10A37F" opacity="0.25" />

      {/* 单边智能赛博耳机/取景目镜 */}
      <rect x="180" y="125" width="16" height="26" rx="4" fill="#1F2937" stroke="#00F5A0" strokeWidth="1.5" />
      <circle cx="188" cy="138" r="4" fill="#00F5A0" className="pulse-glow" />
      <path d="M180 138 L160 148" stroke="#00F5A0" strokeWidth="1" strokeDasharray="2 2" />

      {/* 眼睛 - 碧绿清澈灵动大眼 */}
      {mood === 'happy' ? (
        <>
          <path d="M125 137 Q133 129 141 137" stroke="#054E3C" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M159 137 Q167 129 175 137" stroke="#054E3C" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : mood === 'sleepy' ? (
        <>
          <path d="M125 140 Q133 145 141 140" stroke="#0B795E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M159 140 Q167 145 175 140" stroke="#0B795E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="133" cy="138" rx="7.5" ry="9" fill="#054E3C" />
          <circle cx="133" cy="139" r="5" fill="#10A37F" />
          <circle cx="131" cy="135" r="2.8" fill="#FFF" />
          <circle cx="135" cy="141" r="1.2" fill="#80F0D2" />

          <ellipse cx="167" cy="138" rx="7.5" ry="9" fill="#054E3C" />
          <circle cx="167" cy="139" r="5" fill="#10A37F" />
          <circle cx="165" cy="135" r="2.8" fill="#FFF" />
          <circle cx="169" cy="141" r="1.2" fill="#80F0D2" />
        </>
      )}

      {/* 嘴部 */}
      {mood === 'happy' ? (
        <path d="M144 163 Q150 171 156 163" stroke="#0B795E" strokeWidth="2.2" strokeLinecap="round" fill="#E0F7F1" />
      ) : mood === 'thinking' ? (
        <circle cx="150" cy="163" r="2.5" fill="#0B795E" />
      ) : (
        <path d="M145 163 Q150 166 155 163" stroke="#0B795E" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* 头发刘海 - 墨绿到翠绿渐变，齐刘海带未来感切角 */}
      <path d="M108 122 C105 72, 195 72, 192 122 C178 98, 160 102, 150 106 C140 102, 122 98, 108 122 Z" fill="url(#oai-hair)" />
      <path d="M106 118 C100 148, 106 182, 114 196 C116 185, 113 150, 117 130 Z" fill="url(#oai-hair)" />
      <path d="M194 118 C200 148, 194 182, 186 196 C184 185, 187 150, 183 130 Z" fill="url(#oai-hair)" />

      {/* 发饰：经典的 OpenAI 六边花形发卡 */}
      <g transform="translate(108, 92) scale(0.7)">
        <polygon points="15,0 30,8 30,24 15,32 0,24 0,8" fill="#10A37F" stroke="#00F5A0" strokeWidth="2" />
        <circle cx="15" cy="16" r="6" fill="#FFF" />
      </g>

      {/* 悬浮全息魔方/Token 数据球 */}
      <g transform="translate(130, 280)">
        <polygon points="20,0 40,12 20,24 0,12" fill="rgba(0, 245, 160, 0.4)" stroke="#00F5A0" strokeWidth="1.5" />
        <polygon points="0,12 20,24 20,48 0,36" fill="rgba(16, 163, 127, 0.6)" stroke="#00F5A0" strokeWidth="1.5" />
        <polygon points="40,12 20,24 20,48 40,36" fill="rgba(11, 121, 94, 0.8)" stroke="#00F5A0" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="5" fill="#FFF" opacity="0.9" className="pulse-glow" />
      </g>
    </svg>
  );
};

export const DeepSeekAvatar = ({ mood = 'idle', size = 260 }) => {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 300 390" fill="none" xmlns="http://www.w3.org/2000/svg" className="character-svg">
      <defs>
        <linearGradient id="ds-hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A8BFF" />
          <stop offset="60%" stopColor="#1E5CFF" />
          <stop offset="100%" stopColor="#0B2C99" />
        </linearGradient>
        <linearGradient id="whale-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2D68FF" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
      </defs>

      {/* 深海波光与气泡光环 */}
      <circle cx="150" cy="140" r="115" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.35" className="spin-slow" />
      <circle cx="70" cy="90" r="6" fill="#6EE7B7" opacity="0.4" className="pulse-glow" />
      <circle cx="230" cy="110" r="4" fill="#3B82F6" opacity="0.5" />
      <circle cx="210" cy="65" r="8" fill="#6EE7B7" opacity="0.3" />
      <text x="215" y="85" fill="#3B82F6" fontSize="12" fontFamily="monospace" opacity="0.8">R1-Reasoning</text>
      <text x="40" y="80" fill="#3B82F6" fontSize="12" fontFamily="monospace" opacity="0.7">DeepSeek MoE</text>

      {/* 蓝白双色水手服/深海研究员大衣 */}
      <path d="M105 230 C85 260, 75 340, 65 380 L235 380 C225 340, 215 260, 195 230 Z" fill="#0D1B3E" />
      {/* 水手大翻领 */}
      <path d="M100 230 L150 270 L200 230 L180 215 L150 240 L120 215 Z" fill="#2563EB" stroke="#60A5FA" strokeWidth="1.5" />
      {/* 领口蓝色蝴蝶结 */}
      <polygon points="140,250 160,250 150,260" fill="#6EE7B7" />

      {/* 脸部 */}
      <path d="M115 130 C115 190, 185 190, 185 130 C185 95, 115 95, 115 130 Z" fill="#FFF5F2" />
      {/* 脸颊微红 */}
      <ellipse cx="126" cy="148" rx="8" ry="4" fill="#FF8BA7" opacity="0.4" />
      <ellipse cx="174" cy="148" rx="8" ry="4" fill="#FF8BA7" opacity="0.4" />

      {/* 标志性呆毛 (形似小蓝鲸喷水/跃动) */}
      <path d="M150 75 C150 45, 175 40, 168 65 C164 72, 156 75, 150 78" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* 眼睛 - 湛蓝深邃星辰眼 (带思考高光) */}
      {mood === 'happy' ? (
        <>
          <path d="M125 137 Q133 129 141 137" stroke="#0B2C99" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M159 137 Q167 129 175 137" stroke="#0B2C99" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : mood === 'sleepy' ? (
        <>
          <path d="M125 140 Q133 145 141 140" stroke="#1E5CFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M159 140 Q167 145 175 140" stroke="#1E5CFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="133" cy="138" rx="7.5" ry="9" fill="#0B2C99" />
          <circle cx="133" cy="139" r="5" fill="#3B82F6" />
          <circle cx="131" cy="135" r="2.8" fill="#FFF" />
          <polygon points="135,142 136,140 138,142 136,144" fill="#93C5FD" />

          <ellipse cx="167" cy="138" rx="7.5" ry="9" fill="#0B2C99" />
          <circle cx="167" cy="139" r="5" fill="#3B82F6" />
          <circle cx="165" cy="135" r="2.8" fill="#FFF" />
          <polygon points="169,142 170,140 172,142 170,144" fill="#93C5FD" />
        </>
      )}

      {/* 嘴部 */}
      {mood === 'happy' ? (
        <path d="M144 163 Q150 171 156 163" stroke="#1E40AF" strokeWidth="2.2" strokeLinecap="round" fill="#DBEAFE" />
      ) : mood === 'thinking' ? (
        <path d="M145 163 Q149 159 155 163" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M145 163 Q150 166 155 163" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* 蔚蓝渐变短发 + 柔顺侧马尾 */}
      <path d="M108 122 C105 72, 195 72, 192 122 C178 98, 160 102, 150 106 C140 102, 122 98, 108 122 Z" fill="url(#ds-hair)" />
      <path d="M106 118 C100 148, 105 180, 114 195 C116 185, 113 150, 117 130 Z" fill="url(#ds-hair)" />
      <path d="M194 118 C202 155, 218 200, 230 240 C220 230, 202 185, 186 150 Z" fill="url(#ds-hair)" />

      {/* 发饰：DeepSeek 标志性萌宠“小蓝鲸”发卡 */}
      <g transform="translate(182, 95) scale(0.85)">
        <ellipse cx="16" cy="10" rx="14" ry="9" fill="#3B82F6" />
        <path d="M4 10 L-2 4 L-2 16 Z" fill="#2563EB" />
        <circle cx="22" cy="8" r="2" fill="#FFF" />
        <path d="M14 2 Q14 -5 18 -6" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* 怀中抱着小蓝鲸抱枕 */}
      <g transform="translate(115, 265)">
        <path d="M15 35 C15 15, 55 15, 65 35 C70 50, 50 60, 35 60 C20 60, 15 50, 15 35 Z" fill="#3B82F6" stroke="#60A5FA" strokeWidth="2" />
        {/* 鲸鱼尾巴 */}
        <polygon points="65,35 80,25 78,45" fill="#2563EB" />
        <circle cx="30" cy="35" r="3.5" fill="#FFF" />
        <circle cx="31" cy="35" r="2" fill="#0F172A" />
        <ellipse cx="40" cy="40" rx="3" ry="1.5" fill="#F472B6" />
        <text x="25" y="52" fill="#FFFFFF" fontSize="9" fontWeight="bold">r1</text>
      </g>
    </svg>
  );
};

export const GeminiAvatar = ({ mood = 'idle', size = 260 }) => {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 300 390" fill="none" xmlns="http://www.w3.org/2000/svg" className="character-svg">
      <defs>
        <linearGradient id="gemini-hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="40%" stopColor="#9B72CB" />
          <stop offset="80%" stopColor="#D96570" />
          <stop offset="100%" stopColor="#FFAA00" />
        </linearGradient>
        <linearGradient id="gemini-sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4E88FF" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>

      {/* 背后星芒光效 (Gemini 四角星) */}
      <g transform="translate(150, 140)" className="spin-slow">
        <path d="M0 -110 Q0 0 110 0 Q0 0 0 110 Q0 0 -110 0 Q0 0 0 -110 Z" fill="url(#gemini-sparkle)" opacity="0.15" />
      </g>
      <text x="210" y="80" fill="#9B72CB" fontSize="12" fontFamily="sans-serif" opacity="0.75">Gemini 1.5 Pro</text>
      <text x="45" y="85" fill="#4285F4" fontSize="12" fontFamily="sans-serif" opacity="0.65">2M Context</text>

      {/* 渐变流光长发 */}
      <path d="M85 130 C60 180, 50 270, 70 330 C75 270, 95 210, 100 160 Z" fill="#4285F4" opacity="0.85" />
      <path d="M215 130 C240 180, 250 270, 230 330 C225 270, 205 210, 200 160 Z" fill="#D96570" opacity="0.85" />

      {/* 未来梦幻魔法礼服 */}
      <path d="M105 230 C85 260, 75 340, 65 380 L235 380 C225 340, 215 260, 195 230 Z" fill="#1A1333" />
      <path d="M125 215 L150 255 L175 215" stroke="url(#gemini-hair)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* 脸部 */}
      <path d="M115 130 C115 190, 185 190, 185 130 C185 95, 115 95, 115 130 Z" fill="#FFF8F5" />
      <ellipse cx="126" cy="148" rx="8" ry="4" fill="#FF84A8" opacity="0.45" />
      <ellipse cx="174" cy="148" rx="8" ry="4" fill="#FF84A8" opacity="0.45" />

      {/* 眼睛 - 异色瞳 (左眼深蓝星河，右眼粉紫晚霞) */}
      {mood === 'happy' ? (
        <>
          <path d="M125 137 Q133 129 141 137" stroke="#3C4043" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M159 137 Q167 129 175 137" stroke="#3C4043" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : mood === 'sleepy' ? (
        <>
          <path d="M125 140 Q133 145 141 140" stroke="#7050A6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M159 140 Q167 145 175 140" stroke="#7050A6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* 左眼：蓝 */}
          <ellipse cx="133" cy="138" rx="7.5" ry="9" fill="#174EA6" />
          <circle cx="133" cy="139" r="5" fill="#4285F4" />
          <circle cx="131" cy="135" r="2.8" fill="#FFF" />
          {/* 右眼：紫粉 */}
          <ellipse cx="167" cy="138" rx="7.5" ry="9" fill="#842977" />
          <circle cx="167" cy="139" r="5" fill="#D96570" />
          <circle cx="165" cy="135" r="2.8" fill="#FFF" />
        </>
      )}

      {/* 嘴部 */}
      {mood === 'happy' ? (
        <path d="M144 163 Q150 171 156 163" stroke="#842977" strokeWidth="2.2" strokeLinecap="round" fill="#FCE8E6" />
      ) : mood === 'thinking' ? (
        <circle cx="150" cy="163" r="2.5" fill="#842977" />
      ) : (
        <path d="M145 163 Q150 166 155 163" stroke="#842977" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* 彩色渐变秀发 */}
      <path d="M108 122 C105 72, 195 72, 192 122 C178 98, 160 102, 150 106 C140 102, 122 98, 108 122 Z" fill="url(#gemini-hair)" />
      <path d="M106 118 C100 148, 105 180, 114 195 C116 185, 113 150, 117 130 Z" fill="#4285F4" />
      <path d="M194 118 C200 148, 195 180, 186 195 C184 185, 187 150, 183 130 Z" fill="#D96570" />

      {/* 发饰：经典的 Gemini 双子四芒星发饰 */}
      <g transform="translate(185, 95) scale(0.9)">
        <path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" fill="#FFF" stroke="#FFAA00" strokeWidth="1.5" />
      </g>

      {/* 手托星空棱镜 */}
      <g transform="translate(135, 275)">
        <polygon points="15,0 30,25 0,25" fill="rgba(255,255,255,0.7)" stroke="#FFAA00" strokeWidth="1.5" className="pulse-glow" />
        <circle cx="15" cy="17" r="4" fill="#9B72CB" />
      </g>
    </svg>
  );
};

export const AvatarRenderer = ({ characterId, mood = 'idle', size = 260 }) => {
  switch (characterId) {
    case 'claude':
      return <ClaudeAvatar mood={mood} size={size} />;
    case 'openai':
      return <OpenAIAvatar mood={mood} size={size} />;
    case 'deepseek':
      return <DeepSeekAvatar mood={mood} size={size} />;
    case 'gemini':
      return <GeminiAvatar mood={mood} size={size} />;
    default:
      return <ClaudeAvatar mood={mood} size={size} />;
  }
};
