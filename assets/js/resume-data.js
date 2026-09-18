/**
 * 页面唯一内容数据源。
 * 修改个人信息、经历或证书时，只需要更新本文件。
 */
window.RESUME_DATA = Object.freeze({
  person: {
    name: "冯若辰",
    role: "区块链工程 2026 级本科生 · AI 应用学习者",
    status: "2026 级新生",
    motto: "Let whatever happens, happen",
    summary:
      "持续进修生成式 AI 与智能工具应用，已完成 8 项阿里云 AI 专项技能认证。具备大型活动执行、队员训练、英语辅导和实验实践经验，能够拆解任务、持续复盘并推动结果落地。",
    qq: "892278415",
    location: "广州",
    age: 18,
  },

  schools: [
    {
      type: "大学",
      name: "广州软件学院",
      degree: "本科 · 区块链工程",
      start: "2026 年 9 月",
      end: "预计 2030 年 6 月",
    },
    {
      type: "高中",
      name: "广州市第 41 中学",
      degree: "",
      start: "2023 年 9 月",
      end: "2026 年 6 月",
    },
  ],

  keywords: [
    "生成式 AI",
    "智能体与 RAG",
    "区块链基础",
    "提示词设计",
    "训练指导",
    "团队协作",
  ],

  highlights: [
    {
      value: "8 项",
      label: "AI 专项认证",
      text: "覆盖 AIGC、智能体、RAG、Spring AI、视觉 AI 与编码实践。",
    },
    {
      value: "全国",
      label: "大型开幕式代表",
      text: "代表广州国旗护卫队参加全国中小学生运动会开幕仪式。",
    },
    {
      value: "市二等奖",
      label: "国旗护卫队竞赛",
      text: "以规范动作、稳定发挥和团队协作获得市级二等奖。",
    },
    {
      value: "1 周",
      label: "完成新队员集训",
      text: "帮助新队员掌握大部分动作，受训队伍获得市三等奖。",
    },
    {
      value: "2′48″",
      label: "1000 米最佳成绩",
      text: "从约 5 分 30 秒提升至 2 分 48 秒，完成持续耐力训练突破。",
    },
  ],

  certificates: [
    {
      id: "aigc-design",
      order: "01",
      title: "基于 PAI ArtLab 的 AIGC 设计基础",
      shortTitle: "AIGC 设计基础",
      category: "内容生成",
      categoryId: "content",
      summary: "完成 AIGC 设计基础专项技能认证，建立从文字创意到视觉表达的基础认知。",
      image: "assets/certificates/aigc-design.png",
    },
    {
      id: "content-productivity",
      order: "02",
      title: "利用大模型提升内容生产能力",
      shortTitle: "大模型内容生产",
      category: "内容生成",
      categoryId: "content",
      summary: "学习利用大模型完成内容构思、组织与优化，关注提示设计和结果校验。",
      image: "assets/certificates/content-productivity.png",
    },
    {
      id: "spring-ai",
      order: "03",
      title: "Spring AI 应用开发（入门）",
      shortTitle: "Spring AI 入门",
      category: "开发工具",
      categoryId: "engineering",
      summary: "完成 Spring AI 入门认证，了解大模型能力接入应用的基本开发路径。",
      image: "assets/certificates/spring-ai.png",
    },
    {
      id: "agent-application",
      order: "04",
      title: "基于百炼平台构建智能体应用",
      shortTitle: "智能体应用",
      category: "智能体 / RAG",
      categoryId: "agent",
      summary: "学习智能体应用的搭建流程，理解任务设定、工具协同与应用发布环节。",
      image: "assets/certificates/agent-application.png",
    },
    {
      id: "rag-optimization",
      order: "05",
      title: "RAG 应用构建及优化",
      shortTitle: "RAG 构建与优化",
      category: "智能体 / RAG",
      categoryId: "agent",
      summary: "完成 RAG 专项认证，理解检索增强生成的基本链路与常见优化方向。",
      image: "assets/certificates/rag-optimization.png",
    },
    {
      id: "vision-advanced",
      order: "06",
      title: "VISION 人工智能设计（进阶）",
      shortTitle: "视觉 AI 进阶",
      category: "视觉 AI",
      categoryId: "vision",
      summary: "在视觉 AI 入门基础上继续学习进阶设计方法和创意表达流程。",
      image: "assets/certificates/vision-advanced.png",
    },
    {
      id: "ai-coding",
      order: "07",
      title: "基于通义灵码实现高效 AI 编码实践",
      shortTitle: "AI 编码实践",
      category: "开发工具",
      categoryId: "engineering",
      summary: "学习将 AI 编码助手用于理解需求、生成代码与辅助排查，强调人工复核。",
      image: "assets/certificates/ai-coding.png",
    },
    {
      id: "vision-foundations",
      order: "08",
      title: "VISION 人工智能设计（入门）",
      shortTitle: "视觉 AI 入门",
      category: "视觉 AI",
      categoryId: "vision",
      summary: "完成视觉 AI 设计入门认证，了解基础工具、创作流程与视觉表达方式。",
      image: "assets/certificates/vision-foundations.png",
    },
  ],

  experience: [
    {
      id: "practice",
      label: "实践经历",
      items: [
        {
          title: "英语学习辅导",
          org: "学生辅导实践",
          bullets: [
            "分析辅导对象在词汇、语法、阅读和答题习惯方面的薄弱环节。",
            "制定阶段性学习计划，通过讲解、错题复盘和重点练习持续推进。",
            "根据反馈调整讲解方式，将复杂知识拆分为可执行任务。",
            "帮助辅导对象将英语成绩从约 50 分提升至约 100 分。",
          ],
        },
      ],
    },
    {
      id: "campus",
      label: "校园经历",
      items: [
        {
          title: "队员 / 优秀代表 / 新生指导员",
          org: "高中国旗护卫队",
          bullets: [
            "参与队列、正步、持旗及升旗仪式训练，完成重要活动保障任务。",
            "代表广州国旗护卫队参加全国中小学生运动会开幕仪式。",
            "参加市级国旗护卫队比赛并获得市二等奖。",
            "在 1 周内帮助新队员掌握大部分动作；受训队伍获得市三等奖。",
          ],
        },
      ],
    },
  ],

  projects: [
    {
      id: "works",
      label: "作品",
      items: [
        {
          name: "我的星球 · 3D 互动祝福空间",
          result: "独立完成 3D 粒子星球互动作品，融合星环、祝福文字、爱心动画、音乐控制与摄像头手势交互，并支持自定义内容和专属页面导出。",
          tags: ["Three.js", "3D 粒子动画", "交互设计", "手势识别"],
          link: "my-planet/index.html",
          linkLabel: "打开我的星球 ↗"
        }
      ]
    },
    { id: "tank-battle", label: "独立项目", items: [{ name: "沙暴能源站 · 坦克大战", result: "独立完成原创 HTML5 Canvas 坦克大战：负责玩法设计、Canvas 渲染、碰撞检测、十关战役、三类敌人 AI、技能系统与音频反馈，并完成 Netlify 部署。", tags: ["HTML5 Canvas", "原生 JavaScript", "敌人 AI", "十关战役"], link: "tank-battle/index.html", linkLabel: "试玩游戏 ↗" }] },
    {
      id: "ai",
      label: "AI 学习",
      items: [
        {
          name: "人工智能能力进修与工具应用",
          result:
            "围绕内容生成、智能体与 RAG、开发工具、视觉 AI 四条路径持续学习，并将 AI 工具用于资料归纳、知识梳理和任务规划。",
          tags: ["8 项专项认证", "提示词设计", "结果校验", "持续学习"],
        },
      ],
    },
    {
      id: "experiment",
      label: "实验实践",
      items: [
        {
          name: "高中经典物理实验复刻",
          result: "独立完成原理分析、材料准备、装置搭建、变量控制与误差排查。",
          tags: ["实验设计", "变量控制", "问题排查"],
        },
      ],
    },
    {
      id: "training",
      label: "团队训练",
      items: [
        {
          name: "国旗护卫队新队员短期训练",
          result: "拆分姿态、行进、衔接和整体配合模块，1 周内帮助新队员掌握大部分动作。",
          tags: ["训练规划", "动作拆解", "团队协同"],
        },
      ],
    },
    {
      id: "sport",
      label: "体育训练",
      items: [
        {
          name: "多项目标运动训练",
          result:
            "持续进行篮球与跑步训练；1000 米成绩从约 5 分 30 秒提升至最高 2 分 48 秒。经历伤病后，仍保持对运动和长期训练的投入。",
          tags: ["1000 米 2 分 48 秒", "长期训练", "复盘调整", "伤病后坚持"],
        },
      ],
    },
  ],

  skills: [
    {
      name: "AI 学习方向",
      items: [
        ["生成式 AI 应用", "8 项认证"],
        ["智能体与 RAG", "专项学习"],
        ["视觉 AI 设计", "入门至进阶"],
        ["AI 编码工具", "实践学习"],
      ],
    },
    {
      name: "专业基础",
      items: [
        ["区块链基础", "专业方向"],
        ["智能合约概念", "基础了解"],
        ["密码学基础", "课程方向"],
        ["计算机基础", "持续学习"],
      ],
    },
    {
      name: "方法与表达",
      items: [
        ["AI 辅助检索", "可应用"],
        ["提示词设计", "持续学习"],
        ["资料归纳", "可应用"],
        ["知识拆解", "实践经验"],
      ],
    },
    {
      name: "综合能力",
      items: [
        ["训练指导", "1 周集训"],
        ["团队协作", "竞赛经验"],
        ["责任意识", "长期实践"],
        ["问题排查", "实验经验"],
      ],
    },
  ],

  educationText: {
    university:
      "即将开始区块链工程本科阶段学习，关注区块链底层原理、智能合约、密码学与计算机基础，并持续拓展人工智能应用知识。",
    highSchool:
      "完成高中阶段学习，积极参与国旗护卫队、英语学习、物理实验复刻及体育训练等校园实践。",
  },

  honors: [
    "阿里云 AI 专项技能认证｜8 项",
    "市级国旗护卫队相关比赛二等奖｜1 次",
    "全国中小学生运动会开幕仪式广州国旗护卫队代表",
    "指导下一届国旗护卫队获得市级比赛三等奖",
    "校运会 1000 米项目奖项｜多次获得",
    "英语学科奖金 / 奖励｜多次获得",
    "高中优秀进步奖｜多次获得",
  ],
});
