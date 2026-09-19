/* 研究二：采集三种脚本加载方式下的关键时刻，并把结果回传给父页面 */
'use strict';

window.marks = [];
window.execOrder = [];

window.mark = function (label) {
  window.marks.push({
    label: label,
    t: Math.round(performance.now() * 10) / 10,
    late: !!document.getElementById('late')
  });
};

/* 被测试的脚本自己调用，记录"我是什么时候执行的、执行时后面的 DOM 是否已解析出来" */
window.executed = function (name, costMs) {
  window.execOrder.push({
    name: name,
    t: Math.round(performance.now() * 10) / 10,
    late: !!document.getElementById('late')
  });
};

window.report = function (mode) {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const payload = {
    mode: mode,
    marks: window.marks,
    order: window.execOrder,
    dcl: Math.round((nav.domContentLoadedEventEnd || 0) * 10) / 10,
    resources: performance.getEntriesByType('resource').map(function (r) {
      return {
        name: r.name.split('/').pop(),
        start: Math.round(r.startTime * 10) / 10,
        end: Math.round(r.responseEnd * 10) / 10
      };
    })
  };
  const box = document.getElementById('result');
  if (box) box.textContent = JSON.stringify(payload);
  if (window.parent !== window) window.parent.postMessage(payload, '*');
};
