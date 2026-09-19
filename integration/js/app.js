'use strict';

/* 内置备份数据：file:// 协议下浏览器禁止 fetch 本地文件，用它保证双击 index.html 也能演示。
   内容与 data/data.json 一致。 */
const BACKUP_DATA = {
  meta: {
    title: '迷你版校园公共信息与数据展示中心',
    updatedAt: '2026-09-19',
    source: '课堂练习用虚构数据，不对应真实场馆',
    unit: { usage7d: '人次 / 近7日', monthlyVisits: '人次 / 当月' }
  },
  studyRooms: [
    { id: 1, name: '图书馆三层静音区', building: '图书馆', floor: 3, seats: 120, open: true, usage7d: 860, hours: '08:00-22:00', busyRate: 0.86 },
    { id: 2, name: '图书馆四层研讨室', building: '图书馆', floor: 4, seats: 40, open: true, usage7d: 240, hours: '09:00-21:00', busyRate: 0.61 },
    { id: 3, name: '第一教学楼A区自习室', building: '第一教学楼', floor: 2, seats: 90, open: true, usage7d: 610, hours: '07:30-22:30', busyRate: 0.74 },
    { id: 4, name: '第一教学楼C区自习室', building: '第一教学楼', floor: 5, seats: 60, open: false, usage7d: 0, hours: '装修暂停', busyRate: 0 },
    { id: 5, name: '第二教学楼开放自习区', building: '第二教学楼', floor: 1, seats: 150, open: true, usage7d: 1120, hours: '07:00-23:00', busyRate: 0.93 },
    { id: 6, name: '第二教学楼六层晚自习室', building: '第二教学楼', floor: 6, seats: 70, open: true, usage7d: 380, hours: '18:00-23:00', busyRate: 0.42 },
    { id: 7, name: '学生活动中心考研专区', building: '学生活动中心', floor: 2, seats: 100, open: true, usage7d: 705, hours: '08:00-22:00', busyRate: 0.79 },
    { id: 8, name: '学生活动中心四层阅读角', building: '学生活动中心', floor: 4, seats: 24, open: false, usage7d: 12, hours: '仅工作日 12:00-14:00', busyRate: 0.18 }
  ],
  monthlyUsage: [
    { month: '3月', visits: 12400 }, { month: '4月', visits: 13800 },
    { month: '5月', visits: 15200 }, { month: '6月', visits: 17600 },
    { month: '9月', visits: 19800 }, { month: '10月', visits: 21400 },
    { month: '11月', visits: 18900 }, { month: '12月', visits: 14200 }
  ]
};

const state = {
  data: null,
  from: '',
  charts: { usage: null, trend: null }
};

const dom = {
  noticeArea: document.getElementById('noticeArea'),
  dataStatus: document.getElementById('dataStatus'),
  floorSelect: document.getElementById('floorSelect'),
  openSelect: document.getElementById('openSelect'),
  keywordInput: document.getElementById('keywordInput'),
  resetBtn: document.getElementById('resetBtn'),
  roomList: document.getElementById('roomList'),
  roomCount: document.getElementById('roomCount'),
  dataSource: document.getElementById('dataSource')
};

function notice(level, text) {
  const box = document.createElement('div');
  box.className = 'alert alert-' + level + ' py-2 px-3 small';
  box.role = 'alert';
  box.textContent = text;
  dom.noticeArea.appendChild(box);
}

async function loadData() {
  try {
    const response = await fetch('data/data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new Error('JSON 解析失败：' + e.message);
    }
    if (!parsed || !Array.isArray(parsed.studyRooms)) throw new Error('数据缺少 studyRooms 数组');
    return { data: parsed, from: 'data/data.json（本地 JSON 文件）' };
  } catch (error) {
    notice('warning', '本地数据加载失败：' + error.message + '。已切换内置备份数据；建议用本地服务器打开（python -m http.server 8000）。');
    return { data: BACKUP_DATA, from: 'js/app.js 内置备份数据' };
  }
}

function fillFloorOptions(rooms) {
  const floors = [...new Set(rooms.map(function (r) { return r.floor; }))].sort(function (a, b) { return a - b; });
  dom.floorSelect.innerHTML = '<option value="all">全部楼层</option>';
  floors.forEach(function (f) {
    const option = document.createElement('option');
    option.value = String(f);
    option.textContent = f + ' 层';
    dom.floorSelect.appendChild(option);
  });
}

function currentFilters() {
  return {
    floor: dom.floorSelect.value,
    open: dom.openSelect.value,
    keyword: dom.keywordInput.value.trim().toLowerCase()
  };
}

function applyFilters(rooms) {
  const f = currentFilters();
  return rooms.filter(function (r) {
    if (f.floor !== 'all' && String(r.floor) !== f.floor) return false;
    if (f.open === 'open' && !r.open) return false;
    if (f.open === 'closed' && r.open) return false;
    if (f.keyword && (r.name + r.building).toLowerCase().indexOf(f.keyword) === -1) return false;
    return true;
  });
}

function roomCard(room) {
  const busy = Math.round(room.busyRate * 100);
  const badge = room.open
    ? '<span class="badge text-bg-success">开放中</span>'
    : '<span class="badge text-bg-secondary">已闭馆</span>';
  const level = busy >= 80 ? 'high' : (busy >= 50 ? 'mid' : 'low');
  return '<div class="col-12 col-md-6 col-xl-4">' +
    '<article class="card h-100 room-card">' +
    '<div class="card-body">' +
    '<div class="d-flex justify-content-between align-items-start">' +
    '<h3 class="h6 card-title mb-1">' + room.name + '</h3>' + badge +
    '</div>' +
    '<p class="small text-secondary mb-2">' + room.building + ' · ' + room.floor + ' 层 · ' + room.seats + ' 座 · ' + room.hours + '</p>' +
    '<div class="progress" role="img" aria-label="拥挤度 ' + busy + '%（仅为文字提示的补充）" style="height:6px">' +
    '<div class="progress-bar bg-' + ({ high: 'danger', mid: 'warning', low: 'success' })[level] + '" style="width:' + busy + '%"></div></div>' +
    '<p class="small mb-0 mt-2">拥挤度 <strong>' + busy + '%</strong>（' + (level === 'high' ? '紧张' : level === 'mid' ? '适中' : '宽松') + '）｜近 7 日 ' + room.usage7d + ' 人次</p>' +
    '</div></article></div>';
}

function renderRooms() {
  const rooms = state.data.studyRooms;
  dom.roomList.innerHTML = '';
  if (!Array.isArray(rooms) || rooms.length === 0) {
    dom.roomList.innerHTML = '<div class="col-12"><div class="alert alert-info py-2 small mb-0">当前没有自习室数据。</div></div>';
    dom.roomCount.textContent = '共 0 间';
    return;
  }
  const matched = applyFilters(rooms);
  if (matched.length === 0) {
    dom.roomList.innerHTML = '<div class="col-12"><div class="alert alert-secondary py-2 small mb-0">没有符合条件的自习室，请放宽筛选条件。</div></div>';
  } else {
    dom.roomList.innerHTML = matched.map(roomCard).join('');
  }
  dom.roomCount.textContent = '共 ' + rooms.length + ' 间，当前显示 ' + matched.length + ' 间';
}

function chartUnavailable() {
  if (window.echarts && typeof window.echarts.init === 'function') return false;
  notice('danger', '图表库 ECharts 未能加载（可能处于离线状态或 CDN 被拦截），文字数据与列表功能不受影响。');
  ['usageChart', 'trendChart'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="chart-fallback">图表暂不可用</div>';
  });
  return true;
}

function renderCharts() {
  dom.dataSource.textContent = '数据来源：' + state.from + '｜' + state.data.meta.source + '｜更新时间 ' + state.data.meta.updatedAt;
  if (chartUnavailable()) return;

  const rooms = state.data.studyRooms.slice().sort(function (a, b) { return b.usage7d - a.usage7d; });
  const months = state.data.monthlyUsage;
  if (rooms.length === 0 || months.length === 0) {
    notice('info', '图表数据为空，暂不渲染图表。');
    return;
  }

  const usageEl = document.getElementById('usageChart');
  if (!state.charts.usage) state.charts.usage = window.echarts.init(usageEl);
  state.charts.usage.setOption({
    grid: { left: 52, right: 16, top: 28, bottom: 78 },
    tooltip: { trigger: 'axis', valueFormatter: function (v) { return v + ' 人次'; } },
    xAxis: {
      type: 'category',
      data: rooms.map(function (r) { return r.name; }),
      axisLabel: { interval: 0, rotate: 38, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '人次', nameTextStyle: { fontSize: 10 } },
    series: [{ name: '近7日到馆人次', type: 'bar', data: rooms.map(function (r) { return r.usage7d; }), itemStyle: { color: '#2f6f8f' } }]
  });

  const trendEl = document.getElementById('trendChart');
  if (!state.charts.trend) state.charts.trend = window.echarts.init(trendEl);
  state.charts.trend.setOption({
    grid: { left: 62, right: 20, top: 28, bottom: 40 },
    tooltip: { trigger: 'axis', valueFormatter: function (v) { return v + ' 人次'; } },
    xAxis: { type: 'category', data: months.map(function (m) { return m.month; }) },
    yAxis: { type: 'value', name: '人次', nameTextStyle: { fontSize: 10 } },
    series: [{
      name: '当月自习人次', type: 'line', smooth: true,
      data: months.map(function (m) { return m.visits; }),
      areaStyle: { opacity: 0.15 }, itemStyle: { color: '#c86b3c' }, lineStyle: { color: '#c86b3c' }
    }]
  });
}

function bindEvents() {
  ['change', 'input'].forEach(function (evt) {
    document.getElementById('filterForm').addEventListener(evt, function (e) {
      if (e.target === dom.resetBtn) return;
      renderRooms();
    });
  });
  dom.resetBtn.addEventListener('click', function () {
    window.setTimeout(renderRooms, 0);
  });
  window.addEventListener('resize', function () {
    if (state.charts.usage) state.charts.usage.resize();
    if (state.charts.trend) state.charts.trend.resize();
  });
}

function highlightNav() {
  const links = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');
  links.forEach(function (link) {
    link.addEventListener('click', function () {
      links.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
      if (window.bootstrap && link.closest('.navbar-collapse') &&
          link.closest('.navbar-collapse').classList.contains('show')) {
        window.bootstrap.Collapse.getOrCreateInstance(document.getElementById('mainNav')).hide();
      }
    });
  });
}

async function boot() {
  const loaded = await loadData();
  state.data = loaded.data;
  state.from = loaded.from;
  dom.dataStatus.textContent = '数据就绪 · ' + state.data.studyRooms.length + ' 间自习室';
  fillFloorOptions(state.data.studyRooms);
  renderRooms();
  renderCharts();
  bindEvents();
  highlightNav();
}

document.addEventListener('DOMContentLoaded', boot);
