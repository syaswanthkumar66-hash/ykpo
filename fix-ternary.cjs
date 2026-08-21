const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The desktop auth block has this issue:
// {user ? ( 
// ...
// </div> 
// <button 

// I need to put the `) : (` back.
code = code.replace(/<\/div>\s*<button\s*onClick=\{openAuthModal\}/, '</div> ) : ( <button onClick={openAuthModal}');
code = code.replace(/<\/div>\s*<button\s*onClick=\{\(\) => \{ openAuthModal\(\); setIsMenuOpen\(false\); \}\}/, '</div> ) : ( <button onClick={() => { openAuthModal(); setIsMenuOpen(false); }}');

fs.writeFileSync('src/App.tsx', code);
