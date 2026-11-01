// 生成静态角色素材：node gen-assets.js
const fs = require('fs'); const path = require('path');
const F = require('./public/assets/frog.js');
const A = path.join(__dirname, 'public/assets');
const unwrap = (s) => s; 
fs.writeFileSync(path.join(A, 'frog.svg'), F.svg({ id: 'a_', mood: 'neutral' }));
fs.writeFileSync(path.join(A, 'frog-laugh.svg'), F.svg({ id: 'b_', mood: 'laugh' }));
fs.writeFileSync(path.join(A, 'frog-peace.svg'), F.svg({ id: 'c_', mood: 'laugh', pose: 'peace' }));
fs.writeFileSync(path.join(A, 'favicon.svg'), F.bust({ mood: 'laugh' }));
