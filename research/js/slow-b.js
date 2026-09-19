/* 小而快的脚本：本地几 KB，传输几乎不耗时，执行 10 ms。
   与 slow-a.js（大文件）配对，用来观察 async 下的执行顺序是否颠倒。 */
'use strict';
(function () {
  const end = performance.now() + 10;
  while (performance.now() < end) { /* 忙等 */ }
  window.executed('slow-b.js（小文件，10ms）', 10);
})();
