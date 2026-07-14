import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set. AI features may fail.');
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// 1. AI Chatbot Advice Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, memberContext } = req.body;
    
    // Construct rich system prompt with member context
    const childInfo = memberContext 
      ? `目前正在为宝贝进行弱视训练：
- 姓名：${memberContext.name}
- 年龄：${memberContext.age}岁
- 每日目标时长：${memberContext.targetHours}小时
- 遮盖周期配置：${memberContext.cyclePattern.map((e: string) => e === 'left' ? '左眼' : e === 'right' ? '右眼' : '休息').join(' -> ')}
- 已完成打卡记录：${JSON.stringify(memberContext.completedDates)}`
      : '目前为一般家庭弱视遮盖咨询。';

    const systemInstruction = `你是一位专业的儿童眼科医学专家与亲子沟通指导员。你正在通过一款名为 OccuTrack 的家庭护眼卫士应用，帮助家长解答关于儿童弱视训练、眼部遮盖疗法（Patching Therapy）的各种疑问。

请遵守以下指导原则：
1. 语言：使用中文回复。语气要专业、温暖、亲切、富有同理心，给家长以信心和支持。
2. 结合宝贝状态：${childInfo}
   如果家长提问，请结合这个宝贝的具体配置和打卡情况给出建议。例如，若宝贝最近连续打卡情况好，给予表扬；若不理想，给出温和的鼓励和改进建议。
3. 专业医学知识：
   - 弱视遮盖必须遵医嘱，不能随意增减遮盖时间。
   - 遮盖期间应当多进行精细视觉训练（如画画、拼图、串珠、阅读、写字），这样能更有效地刺激弱视眼。
   - 如果发生过敏（如眼罩胶贴过敏），可建议更换防过敏眼罩、使用眼镜式遮盖膜或布套，情况严重及时就医。
   - 不要轻易推荐药物，侧重于遮盖方法、心理辅导和精细训练游戏。
4. 趣味引导：提供能够吸引儿童配合遮盖的趣味方法（如自制勋章、角色扮演、把眼罩画成小动物等）。
5. 简洁明了：回答要清晰、重点突出，适合在移动端阅读。使用适当的 emoji 增加亲和力。`;

    // Format chat history for Google Gen AI SDK
    // The SDK expects contents to be Array of Content objects: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = [];
    
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || '抱歉，我现在无法回答，请稍后再试。';
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Server error calling Gemini API' });
  }
});

// 2. AI Reward Story Generator Endpoint
app.post('/api/story', async (req, res) => {
  try {
    const { memberContext, todayRemarks, todayHours } = req.body;
    
    if (!memberContext) {
      return res.status(400).json({ error: 'Missing member context' });
    }

    const { name, age, avatar } = memberContext;

    const systemInstruction = `你是一位擅长写儿童冒险故事的童话作家。你的任务是根据孩子今天的弱视遮盖打卡情况，为他们创作一篇专属的、极具画面感的短篇激励故事。
这个故事是由家长读给孩子听的，因此一定要充满童趣、夸张好玩，并把孩子今天的遮盖行为写成一种“超能力”或者“神秘勋章”。

故事要求：
1. 长度：150-250字左右，适合睡前或打卡后的快速阅读。
2. 主角：${name}（${age}岁，代表头像 ${avatar}）。
3. 今日任务：今天遮盖了眼睛并完成了 ${todayHours} 小时！${todayRemarks ? `今天遮盖时做了：${todayRemarks}` : ''}。
4. 核心隐喻：将眼罩比作“海盗眼罩”、“超级英雄光能镜”、“魔法星际眼罩”等，赋予遮盖动作酷炫的仪式感。
5. 鼓励性结尾：故事结尾必须直接表扬 ${name} 今天的坚持，并祝贺他/她获得了 1 颗“守护星”或者“勇气徽章”，鼓励明天继续！
6. 使用大量契合孩子的可爱 emoji，语言要欢快活泼。`;

    const prompt = `请为 ${name} 创作一篇今天遮眼打卡的专属童话故事。今天遮盖目标时间是 ${memberContext.targetHours} 小时，实际完成了 ${todayHours} 小时，今天他做了：${todayRemarks || '表现非常乖巧'}。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    const storyText = response.text || '宝贝今天太棒啦！你是最勇敢的小战士！';
    res.json({ story: storyText });
  } catch (error: any) {
    console.error('Error in /api/story:', error);
    res.status(500).json({ error: error.message || 'Server error calling Gemini API' });
  }
});

// 3. AI Report Analysis Endpoint
app.post('/api/analyze-report', async (req, res) => {
  try {
    const { memberContext } = req.body;
    if (!memberContext) {
      return res.status(400).json({ error: 'Missing member context' });
    }

    const prompt = `请对以下宝贝的弱视遮盖打卡记录进行深度分析，并输出一份有针对性的家长关怀与训练建议报告。
宝贝信息：
- 名字: ${memberContext.name}
- 年龄: ${memberContext.age}岁
- 每日目标时长: ${memberContext.targetHours}小时
- 遮盖周期: ${memberContext.cycleLength}天 (${memberContext.cyclePattern.join(' -> ')})
- 打卡数据 (日期/小时/备注):
${JSON.stringify(memberContext.completedDates, null, 2)}

请以专业的儿童眼科指导老师身份，用中文给出分析报告。报告应分为三个清晰的部分：
1. 【守护进度总结】 (用温暖的话总结打卡率、坚持天数，若有连胜记录给予极高肯定)。
2. 【眼部训练与精细动作建议】 (根据孩子之前的备注如画画、骑车，推荐适合他年龄段的下一步精细运动游戏，如穿珠子、画画描红、找不同、乐高搭建等，促进弱视眼视力发育)。
3. 【温馨提示与心理辅导】 (提醒家长关于眼罩选择、眼周皮肤护理、心理防线等注意事项)。
排版要清晰，分段明确，多用 emoji 装饰，适合家长阅读。`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });

    const reportText = response.text || '暂无分析报告。';
    res.json({ report: reportText });
  } catch (error: any) {
    console.error('Error in /api/analyze-report:', error);
    res.status(500).json({ error: error.message || 'Server error calling Gemini API' });
  }
});

// Serve static assets in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback all other routes to index.html for SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
