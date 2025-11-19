import { manualDelay } from '@/utils/common-methods'

const CITIES = ['上海', '北京', '深圳', '广州', '重庆', '苏州', '成都', '杭州', '武汉', '南京', '天津', '宁波', '青岛', '无锡', '长沙']
const POSITIONS = ['Developer', 'Ph.D.', 'B.Sc.', 'M.Sc.', 'MBA', 'CEO', 'CFO', 'CTO', 'COO', 'HR', 'HRBP', 'PM', 'VP', 'Director', 'Engineer', 'Analyst', 'Manager', 'Intern', 'Dr.', 'Prof.']
export async function apiGetData(total) {
  if (typeof total !== 'number' || !total) total = Math.floor(Math.random() * 2000 + 1000)
  await manualDelay(500)
  return Array.from({ length: total }).map((_, idx) => {
    return {
      no: idx + 1,
      code: Math.floor(Math.random() * 100000).toString(16),
      name: Math.floor(Math.random() * 100000).toString(16),
      age: Math.floor(Math.random() * 30 + 18),
      gender: Math.random() > 0.5 ? '男' : '女',
      city: CITIES[Math.floor(Math.random() * CITIES.length)],
      tags: POSITIONS
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 4)),
    }
  })
}