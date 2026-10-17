const fs = require('fs');
const csv = require('csv-parser');

// 日常编程、竞赛核心词汇
const codingKeywords = [
  '数组', '链表', '队列', '栈', '堆', '树', '图', '节点', '叶子', '根节点', '深度', '广度', '层',
  '递归', '迭代', '循环', '遍历', '搜索', '二分', '排序', '哈希', '散列', '动态规划', '贪心',
  '算法', '复杂度', '时间复杂度', '空间复杂度', '指针', '引用', '内存', '缓存', '释放', '分配',
  '变量', '常量', '函数', '方法', '参数', '返回值', '对象', '类', '接口', '继承', '多态', '封装',
  '编译', '解释', '调试', '异常', '错误', '崩溃', '运行', '执行', '线程', '进程', '并发', '同步', '异步',
  '数据库', '查询', '插入', '更新', '删除', '索引', '主键', '外键', '事务', '字符', '字符串', '整数',
  '浮点数', '布尔', '逻辑', '位运算', '条件', '分支', '输入', '输出', '文件', '路径', '读取', '写入',
  '网络', '请求', '响应', '服务器', '客户端', '协议', '端口', '地址', '安全', '加密', '解密',
  '测试', '断言', '模块', '组件', '框架', '库', '包', '依赖', '版本', '代码', '注释', '文档',
  '差', '值', '差值', '修改', '用户', '系统'
];

const finalDict = {};
let count = 0;

console.log('🚀 开始读取 62MB 词典，正在进行极限精简...');

fs.createReadStream('ecdict.csv') 
  .pipe(csv())
  .on('data', (row) => {
    const word = row.word;
    const phonetic = row.phonetic && row.phonetic.indexOf('\\') === -1 ? `[${row.phonetic}]` : '';
    let translation = row.translation || '';

    if (!translation || !/[\u4e00-\u9fa5]/.test(translation)) return;

    const tag = row.tag || '';
    
    // 🌟 核心精简：只认四六级(cet4/6)、考研(ky)、高考(gk)标签！
    const isExamWord = tag.includes('cet4') || tag.includes('cet6') || tag.includes('ky') || tag.includes('gk');

    // 提取中文释义：取第一行，去掉词性前缀
    let rawCn = translation.split('\n')[0].replace(/^[a-z]+\.\s*/i, '').trim();
    
    // 按逗号拆开
    let cnWords = rawCn.split(/[,，;；]/);

    for (let cn of cnWords) {
        cn = cn.trim();
        
        // 安全过滤：长度 <= 15，无破坏性符号
        if (cn && cn.length <= 15 && !/["\\\n\r()\[\]{}]/.test(cn)) {
            
            // 判断是不是编程词
            const isCodingWord = codingKeywords.some(keyword => cn.includes(keyword));

            // 🌟 只要它带有考试标签，或者是编程强相关词，才收录！
            if (isExamWord || isCodingWord) {
                if (!finalDict[cn]) {
                    finalDict[cn] = { en: word, ipa: phonetic };
                    count++;
                }
            }
        }
    }
  })
  .on('end', () => {
    console.log(`✅ 极限精简完成！去除了所有无用生僻词，共保留 ${count} 个最常用词。`);
    
    let tsContent = 'export const dictData: Record<string, { en: string, ipa: string }> = {\n';
    for (const [cn, data] of Object.entries(finalDict)) {
      const safeCn = JSON.stringify(cn);
      const safeEn = JSON.stringify(data.en);
      const safeIpa = JSON.stringify(data.ipa);
      tsContent += `  ${safeCn}: { en: ${safeEn}, ipa: ${safeIpa} },\n`;
    }
    tsContent += '};\n';

    fs.writeFileSync('src/dictionary.ts', tsContent, 'utf8');
    console.log('🎉 生成成功！快去按 F5 测试吧！');
  });