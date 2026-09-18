export const STORAGE_KEY = 'orbit-plans-v1';
export const statuses = { pending: '未开始', active: '进行中', done: '已完成' };
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function validDate(value, type) {
  if (typeof value !== 'string' || !(type === 'month' ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(value)) return false;
  const [y, m, d = 1] = value.split('-').map(Number);
  return y >= 1900 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y, m, 0).getDate();
}
export function validateDocument(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.plans) || input.plans.length > 3000) throw new Error('需要版本为 1 的计划文件，最多 3000 条计划。');
  const ids = new Set();
  const plans = input.plans.map(p => {
    if (!p || typeof p.id !== 'string' || !p.id || p.id.length > 100 || ids.has(p.id)) throw new Error('计划 ID 缺失或重复。');
    ids.add(p.id);
    if (!['day', 'month'].includes(p.type) || !validDate(p.date, p.type)) throw new Error('计划日期或类型无效。');
    if (typeof p.title !== 'string' || !p.title.trim() || p.title.length > 100) throw new Error('计划标题需要 1–100 个字符。');
    if (!Object.hasOwn(statuses, p.status) || typeof p.notes !== 'string' || p.notes.length > 20000) throw new Error('计划状态或说明无效。');
    if (!Array.isArray(p.checklist) || p.checklist.length > 100 || p.checklist.some(c => !c || typeof c.text !== 'string' || !c.text.trim() || c.text.length > 500 || typeof c.done !== 'boolean')) throw new Error('检查清单格式无效。');
    if (p.parentId != null && typeof p.parentId !== 'string') throw new Error('所属月计划无效。');
    return { id: p.id, type: p.type, title: p.title.trim(), date: p.date, status: p.status, notes: p.notes, checklist: p.checklist.map(c => ({ text: c.text, done: c.done })), parentId: p.parentId || null, example: p.example === true };
  });
  const byId = new Map(plans.map(p => [p.id, p]));
  for (const p of plans) {
    if (p.parentId && (p.type !== 'day' || byId.get(p.parentId)?.type !== 'month' || byId.get(p.parentId).date !== p.date.slice(0, 7))) throw new Error('日计划必须关联同月份的月计划。');
  }
  return { version: 1, plans };
}
export function progress(plan, plans) {
  const children = plan.type === 'month' ? plans.filter(p => p.parentId === plan.id) : [];
  const total = children.length;
  const done = children.filter(p => p.status === 'done').length;
  const status = total ? (done === total ? 'done' : children.some(p => p.status !== 'pending') ? 'active' : 'pending') : plan.status;
  return { total, done, status, percent: total ? Math.round(done / total * 100) : status === 'done' ? 100 : 0 };
}
export function visualState(plan, plans, date = today()) {
  const { status } = progress(plan, plans);
  return status !== 'done' && plan.date < (plan.type === 'month' ? date.slice(0, 7) : date) ? 'overdue' : status;
}
export function removePlan(plans, id) {
  return plans.filter(p => p.id !== id).map(p => p.parentId === id ? { ...p, parentId: null } : p);
}
export function seedPlans() {
  const month = today().slice(0, 7);
  const themes = ['构建个人作品集', '让身体恢复活力', '持续学习与输入', '留一点时间给生活'];
  const tasks = [['梳理作品目录', '完成首页草图', '整理项目图片', '发布第一版'], ['晨间拉伸 15 分钟', '完成一次力量训练', '去公园散步', '记录本周状态'], ['阅读 20 页', '整理读书笔记', '练习英语口语', '学习一个新概念'], ['给朋友打个电话', '整理书桌', '做一顿喜欢的饭', '记录本月小确幸']];
  return themes.flatMap((title, i) => {
    const id = `sample-month-${i}`;
    return [{ id, title, type: 'month', date: month, status: 'pending', notes: '这是一条示例计划。你可以编辑它，或清除示例后创建自己的计划。', parentId: null, checklist: [], example: true }, ...tasks[i].map((title, j) => ({ id: `sample-day-${i}-${j}`, title, type: 'day', date: j < 2 ? today() : `${month}-${String(Math.min(28, Number(today().slice(-2)) + j)).padStart(2, '0')}`, status: j === 0 ? 'done' : j === 1 ? 'active' : 'pending', notes: '把目标拆成一个可以完成的小步骤。', parentId: id, checklist: [{ text: '准备所需资料', done: j === 0 }, { text: '完成并回顾', done: j === 0 }], example: true }))];
  });
}
