'use strict';

/* 备份数据：离线或直接双击打开时 $.getJSON 会失败，用它保证页面不白屏。内容与 data/facilities.json 一致。 */
const BACKUP_DATA = {
  meta: {
    title: '校园运动场馆信息与预约看板',
    updatedAt: '2026-09-19',
    source: '课堂练习用虚构数据，不对应真实场馆与真实价格',
    unit: { occupancy: '今日已预约名额占比', pricePerHour: '元 / 小时', weekBookings: '人次 / 天' }
  },
  facilities: [
    { id: 1, name: '北区体育馆羽毛球馆', type: '球类', area: '北区', capacity: 48, hours: '08:00-21:30', pricePerHour: 30, occupancy: 0.81, bookable: true },
    { id: 2, name: '北区体育馆乒乓球室', type: '球类', area: '北区', capacity: 24, hours: '08:00-21:30', pricePerHour: 15, occupancy: 0.42, bookable: true },
    { id: 3, name: '中心游泳馆 25 米池', type: '水上', area: '中心区', capacity: 60, hours: '12:00-20:30', pricePerHour: 25, occupancy: 0.93, bookable: true },
    { id: 4, name: '中心游泳馆训练池', type: '水上', area: '中心区', capacity: 30, hours: '07:00-09:00', pricePerHour: 20, occupancy: 0.27, bookable: true },
    { id: 5, name: '东区田径场跑道', type: '田径', area: '东区', capacity: 300, hours: '06:30-22:00', pricePerHour: 0, occupancy: 0.35, bookable: false },
    { id: 6, name: '东区篮球场（室外）', type: '球类', area: '东区', capacity: 60, hours: '06:30-22:00', pricePerHour: 0, occupancy: 0.88, bookable: false },
    { id: 7, name: '南区风雨操场综合馆', type: '综合', area: '南区', capacity: 120, hours: '08:30-21:00', pricePerHour: 40, occupancy: 0.56, bookable: true },
    { id: 8, name: '南区健身中心力量房', type: '健身', area: '南区', capacity: 35, hours: '09:00-22:00', pricePerHour: 10, occupancy: 0.74, bookable: true },
    { id: 9, name: '学生活动中心瑜伽室', type: '健身', area: '中心区', capacity: 20, hours: '18:00-21:00', pricePerHour: 12, occupancy: 0.15, bookable: true },
    { id: 10, name: '西区攀岩墙（维护中）', type: '综合', area: '西区', capacity: 16, hours: '暂停开放', pricePerHour: 0, occupancy: 0, bookable: false }
  ],
  week: [
    { day: '周一', bookings: 268 }, { day: '周二', bookings: 302 }, { day: '周三', bookings: 345 },
    { day: '周四', bookings: 318 }, { day: '周五', bookings: 402 }, { day: '周六', bookings: 511 },
    { day: '周日', bookings: 463 }
  ]
};

const SLOTS = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '18:00-19:00', '19:00-20:00', '20:00-21:00'];
const STORAGE_KEY = 'hw8-venue-bookings';

const app = {
  data: null,
  from: '',
  charts: { week: null, type: null }
};

/* ---------- 提示与信息条 ---------- */
function notify(level, text) {
  const cls = level === 'danger' ? 'danger' : (level === 'warning' ? 'warning' : (level === 'success' ? 'success' : 'info'));
  window.setTimeout(function () {
    $('#messages').append(
      $('<div class="alert alert-' + cls + ' py-2 px-3 small" role="alert"></div>').text(text).hide().fadeIn(120).delay(6500).fadeOut(250, function () { $(this).remove(); })
    );
  }, 0);
}

function loadLevel(rate) {
  if (rate >= 0.8) return { text: '紧张', cls: 'danger' };
  if (rate >= 0.5) return { text: '适中', cls: 'warning' };
  return { text: '宽松', cls: 'success' };
}

/* ---------- 数据加载与三种异常状态 ---------- */
function loadData() {
  return new Promise(function (resolve) {
    $.getJSON('data/facilities.json', function (data) {
      if (!data || !Array.isArray(data.facilities)) {
        notify('warning', '数据结构不符合预期（缺少 facilities 数组），已改用内置备份数据。');
        resolve({ data: BACKUP_DATA, from: 'js/app.js 内置备份数据' });
        return;
      }
      resolve({ data: data, from: 'data/facilities.json（本地 JSON 文件）' });
    }).fail(function (jqXHR, status) {
      notify('warning', '场馆数据读取失败（' + status + '）。已切换到内置备份数据；若你是直接双击 index.html 打开的，请改用本地服务器：python -m http.server 8000');
      resolve({ data: BACKUP_DATA, from: 'js/app.js 内置备份数据' });
    });
  });
}

/* ---------- 概览卡片 ---------- */
function renderSummary() {
  const list = app.data.facilities;
  const total = list.length;
  const bookable = list.filter(function (f) { return f.bookable; }).length;
  const seats = list.reduce(function (sum, f) { return sum + f.capacity; }, 0);
  const avg = total ? Math.round(list.reduce(function (sum, f) { return sum + f.occupancy; }, 0) / total * 100) : 0;
  const cards = [
    { t: '场馆总数', v: total + ' 个', s: '其中 ' + bookable + ' 个支持线上预约' },
    { t: '名额总量', v: seats + ' 人', s: '同一时段可容纳的总人数' },
    { t: '平均占用', v: avg + '%', s: '今日已预约名额占比的平均值' },
    { t: '我的预约', v: readBookings().length + ' 条', s: '保存在本机浏览器' }
  ];
  $('#summaryCards').html(cards.map(function (c) {
    return '<div class="col-12 col-sm-6 col-lg-3"><div class="card h-100 summary-card"><div class="card-body">' +
      '<h2 class="h6 text-secondary mb-1">' + c.t + '</h2>' +
      '<p class="h3 mb-1">' + c.v + '</p>' +
      '<p class="small text-secondary mb-0">' + c.s + '</p>' +
      '</div></div></div>';
  }).join(''));
}

/* ---------- 筛选与表格 ---------- */
function fillFilters() {
  const types = app.data.facilities.map(function (f) { return f.type; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  $('#typeSelect').find('option:gt(0)').remove();
  types.forEach(function (t) { $('#typeSelect').append($('<option></option>').val(t).text(t)); });
}

function currentQuery() {
  return {
    type: $('#typeSelect').val() || 'all',
    free: $('#freeSelect').val() || 'all',
    keyword: ($('#searchInput').val() || '').trim().toLowerCase()
  };
}

function matchedFacilities() {
  const q = currentQuery();
  return app.data.facilities.filter(function (f) {
    if (q.type !== 'all' && f.type !== q.type) return false;
    if (q.free === 'easy' && f.occupancy >= 0.5) return false;
    if (q.free === 'busy' && f.occupancy < 0.5) return false;
    if (q.keyword && (f.name + f.area + f.type).toLowerCase().indexOf(q.keyword) === -1) return false;
    return true;
  });
}

function rowHtml(facility) {
  const level = loadLevel(facility.occupancy);
  const price = facility.pricePerHour === 0 ? '免费' : facility.pricePerHour + ' 元/小时';
  const bookBtn = facility.bookable
    ? '<button class="btn btn-sm btn-primary book-btn" type="button" data-id="' + facility.id + '">预约</button>'
    : '<button class="btn btn-sm btn-secondary" type="button" disabled title="该场馆不支持线上预约">不可预约</button>';
  return '<tr>' +
    '<th scope="row" class="fw-normal"><span class="d-block">' + facility.name + '</span>' +
    '<span class="small text-secondary">容量 ' + facility.capacity + ' 人 · <a class="link-offset-2" href="three-d/scene.html?id=' + facility.id + '">在三维区查看</a></span></th>' +
    '<td>' + facility.type + '</td>' +
    '<td>' + facility.area + '</td>' +
    '<td>' + facility.capacity + '</td>' +
    '<td class="small">' + facility.hours + '</td>' +
    '<td>' + price + '</td>' +
    '<td><span class="badge text-bg-' + level.cls + '">' + level.text + '</span> <span class="small">' + Math.round(facility.occupancy * 100) + '%</span></td>' +
    '<td>' + bookBtn + '</td>' +
    '</tr>';
}

function renderTable() {
  const all = app.data.facilities;
  $('#venueBody').empty();
  if (!all.length) {
    $('#venueBody').html('<tr><td colspan="8" class="text-center text-secondary py-4">当前没有场馆数据，请检查 data/facilities.json。</td></tr>');
    $('#listState').text('共 0 个场馆');
    return;
  }
  const matched = matchedFacilities();
  if (!matched.length) {
    $('#venueBody').html('<tr><td colspan="8" class="text-center text-secondary py-4">没有符合条件的场馆，请调整类型、空闲程度或关键字。</td></tr>');
  } else {
    $('#venueBody').html(matched.map(rowHtml).join(''));
  }
  $('#listState').text('共 ' + all.length + ' 个场馆，当前显示 ' + matched.length + ' 个');
}

/* ---------- 我的预约（localStorage 增删） ---------- */
function readBookings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    notify('warning', '本机预约记录解析失败，已按空记录处理。');
    return [];
  }
}

function saveBookings(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    notify('danger', '浏览器拒绝写入本地存储（可能处于隐私模式），本次预约未能保存。');
    return false;
  }
}

function facilityById(id) {
  return app.data.facilities.filter(function (f) { return f.id === id; })[0] || null;
}

function renderBookings() {
  const list = readBookings();
  $('#myBookingList').empty();
  if (!list.length) {
    $('#myBookingList').html('<li class="list-group-item text-secondary small">还没有预约记录。在上方表格点“预约”，或在这里选择场馆与时段。</li>');
  } else {
    list.forEach(function (b, index) {
      const facility = facilityById(b.facilityId);
      $('#myBookingList').append(
        $('<li class="list-group-item d-flex justify-content-between align-items-center gap-2 px-0"></li>').html(
          '<span>' + (facility ? facility.name : '（该场馆已从数据中移除）') +
          '<span class="small text-secondary d-block">' + b.day + ' ' + b.slot + '</span></span>'
        ).append(
          $('<button class="btn btn-sm btn-outline-danger" type="button">取消</button>').data('index', index)
        )
      );
    });
  }
  $('#myBookingState').text('共 ' + list.length + ' 条预约（最多同时保留 5 条）');
  renderSummary();
}

function fillVenueOptions() {
  const current = $('#venuePick').val();
  $('#venuePick').empty();
  const bookable = app.data.facilities.filter(function (f) { return f.bookable; });
  if (!bookable.length) {
    $('#venuePick').append($('<option></option>').val('').text('暂无可预约场馆'));
    return;
  }
  $('#venuePick').append($('<option></option>').val('').text('请选择场馆'));
  bookable.forEach(function (f) {
    $('#venuePick').append($('<option></option>').val(String(f.id)).text(f.name + '（' + f.type + '）'));
  });
  if (current) $('#venuePick').val(current);
}

function addBooking(facilityIdText, slot) {
  const list = readBookings();
  if (!facilityIdText) {
    notify('danger', '请先选择要预约的场馆。');
    return;
  }
  const facilityId = Number(facilityIdText);
  if (list.some(function (b) { return b.facilityId === facilityId && b.slot === slot; })) {
    notify('warning', '该场馆的 ' + slot + ' 时段已经预约过了，请换一个时段。');
    return;
  }
  if (list.length >= 5) {
    notify('warning', '最多保留 5 条练习预约，请先取消一条再添加。');
    return;
  }
  list.push({ facilityId: facilityId, slot: slot, day: '本周', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
  if (saveBookings(list)) {
    const facility = facilityById(facilityId);
    notify('success', '已添加预约：' + (facility ? facility.name : facilityId) + ' ' + slot + '。刷新页面后仍在。');
    renderBookings();
  }
}

/* ---------- 图表 ---------- */
function renderCharts() {
  $('#source').text('数据来源：' + app.from + '｜' + app.data.meta.source + '｜更新时间 ' + app.data.meta.updatedAt + '｜' + (app.data.meta.unit ? '占用口径：' + app.data.meta.unit.occupancy : ''));
  if (!window.Chart || typeof window.Chart.register !== 'function') {
    notify('danger', '图表库 Chart.js 未能加载（离线或 CDN 被拦截），场馆列表与预约功能仍可正常使用。');
    $('.chart-box').html('<div class="chart-fallback">图表暂不可用</div>');
    return;
  }
  const week = app.data.week || [];
  const counts = {};
  app.data.facilities.forEach(function (f) { counts[f.type] = (counts[f.type] || 0) + 1; });
  const types = Object.keys(counts);
  if (!week.length || !types.length) {
    notify('info', '图表数据为空，暂不渲染图表。');
    return;
  }

  if (app.charts.week) app.charts.week.destroy();
  app.charts.week = new window.Chart(document.getElementById('weekChart'), {
    type: 'line',
    data: {
      labels: week.map(function (w) { return w.day; }),
      datasets: [{
        label: '预约人次（人次／天）',
        data: week.map(function (w) { return w.bookings; }),
        borderColor: '#2f6f8f',
        backgroundColor: 'rgba(47,111,143,.15)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        title: { display: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '人次', font: { size: 11 } } },
        x: { title: { display: true, text: '星期', font: { size: 11 } } }
      }
    }
  });

  if (app.charts.type) app.charts.type.destroy();
  app.charts.type = new window.Chart(document.getElementById('typeChart'), {
    type: 'doughnut',
    data: {
      labels: types,
      datasets: [{
        label: '场馆数量（个）',
        data: types.map(function (t) { return counts[t]; }),
        backgroundColor: ['#2f6f8f', '#c86b3c', '#6a8f6f', '#d9c46a', '#8aa6b5']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const total = types.reduce(function (s, t) { return s + counts[t]; }, 0);
              return ctx.label + '：' + ctx.parsed + ' 个（占 ' + Math.round(ctx.parsed / total * 100) + '%）';
            }
          }
        }
      }
    }
  });
}

/* ---------- 事件绑定（DOM 查询与事件统一用 jQuery） ---------- */
function bindEvents() {
  $('#queryForm').on('change', 'select', renderTable);
  $('#queryForm').on('input', '#searchInput', renderTable);
  $('#clearBtn').on('click', function () {
    $('#typeSelect').val('all');
    $('#freeSelect').val('all');
    $('#searchInput').val('');
    renderTable();
  });

  $('#bookingForm').on('submit', function (e) {
    e.preventDefault();
    addBooking($('#venuePick').val(), $('#slotPick').val());
  });

  $('#venueBody').on('click', '.book-btn', function () {
    const id = $(this).data('id');
    const facility = facilityById(Number(id));
    if (!facility) return;
    $('#venuePick').val(String(id));
    if (!$('#slotPick option').length) {
      SLOTS.forEach(function (s) { $('#slotPick').append($('<option></option>').val(s).text(s)); });
    }
    $('html, body').animate({ scrollTop: $('#bookingForm').offset().top - 80 }, 200);
    $('#venuePick').trigger('focus');
    notify('info', '已选中场馆“' + facility.name + '”，请确认时段后提交。');
  });

  $('#myBookingList').on('click', 'button', function () {
    const index = $(this).data('index');
    const list = readBookings();
    const removed = list.splice(index, 1)[0];
    if (saveBookings(list)) {
      const facility = removed ? facilityById(removed.facilityId) : null;
      notify('success', '已取消预约：' + (facility ? facility.name : '该场馆') + ' ' + (removed ? removed.slot : '') + '。');
      renderBookings();
    }
  });

  $('#topNav').on('click', '.nav-link', function () {
    $('#topNav .nav-link').removeClass('active');
    $(this).addClass('active');
    const collapse = window.bootstrap && window.bootstrap.Collapse;
    if (collapse) {
      const nav = document.getElementById('topNav');
      if (nav.classList.contains('show')) collapse.getOrCreateInstance(nav).hide();
    }
  });
}

function boot() {
  loadData().then(function (loaded) {
    app.data = loaded.data;
    app.from = loaded.from;
    $('#loadState').text('数据就绪 · ' + app.data.facilities.length + ' 个场馆');
    SLOTS.forEach(function (s) { $('#slotPick').append($('<option></option>').val(s).text(s)); });
    fillFilters();
    fillVenueOptions();
    renderSummary();
    renderTable();
    renderBookings();
    renderCharts();
    bindEvents();
  });
}

$(document).ready(boot);
