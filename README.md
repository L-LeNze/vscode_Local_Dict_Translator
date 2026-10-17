# vscode_Local_Dict_Translator 

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.142.0-blue.svg)

> 解释：基于vscode的一个本地词典翻译插件，专为算法备赛（CSP/蓝桥杯/洛谷）与四六级备考



# 核心特性:

- **毫秒级本地查词**：所有词条存储在本地 TS/JSON 文件中，不依赖任何网络 API，查词零延迟

- **多维度词典**：

  1. `algorithm`: 算法与数据结构

  2. `cpp`: C++ 语法与 STL 容器

  3. `oj`: Online Judge 评测状态与竞赛黑话

  4. `variable`: 常用变量命名全称（如 diff -> difference）

  5. `problem`: 写<u>英文题</u>面高频词

  6. `cet4`: 四六级高频核心词汇（但是还没开始添加）

     

- **智能机制**：
  - **中英双向翻译**：支持中译英，也支持英译中
  
  - **支持模糊搜索**：输入部分文字，自动提示相关词条
  
  - **驼峰/下划线智能拆分**：遇到 `calculateDiff` 或 `find_user_by_id` 时，自动拆分并翻译已知词根（未知词根会提示缺少词汇）
  
    
  
- **翻译用法**：

  - 鼠标选中文本（停 300ms），自动弹出翻译
  - 支持快捷键 `Ctrl+Alt+T` 主动翻译选中文本
  - 幽灵注释（Decoration）显示，打字时或换另一个词时自动消失

  

# 安装步骤：针对（vscode）

1. 克隆仓库并安装依赖：
   ```bash
   git clone https://github.com/L-LeNze/vscode_Local_Dict_Translator.git
   cd vscode_Local_Dict_Translator
   npm install

2. 按`F5`或者运行启动扩展开发宿主窗口进行调试体验

## 项目结构：

```
src/
├── dicts/              # 核心本地词典库
│   ├── algorithm.ts    # 算法与数据结构
│   ├── cet4.ts         # 四六级词汇
│   ├── cpp.ts          # C++ 语法与 STL
│   ├── oj.ts           # 竞赛术语与黑话
│   ├── problem.ts      # 英文题面词汇
│   ├── variable.ts     # 变量命名全称
│   └── index.ts        # 词典合并导出入口
└── extension.ts        # 插件主逻辑与智能匹配算法
```

## 词典拓展格式：

`"中文释义": { en: "english_word", ipa: "[音标]" },`

## 修改/提交历史：

### 20261017   由 AI 辅助生成基础代码框架，并实现基本翻译功能，初始上传github



## 注意事项：

- 本项目在开发过程中借助了 AI 辅助生成基础代码框架，但整体框架、智能功能、功能迭代均由作者设计并改进



## 📄 开源协议

[MIT License](https://license/)
