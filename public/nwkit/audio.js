/* 奶蛙音效辅助：依赖 /assets/nw.js。预加载笑声采样；静音与 BGM 由 NW 统一处理。原创采样见 /assets/audio/ */
(function (root) {
  'use strict';
  if (!root.NW) return;
  root.NW.loadAudio && root.NW.loadAudio();
})(window);
