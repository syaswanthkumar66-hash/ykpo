const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexMobile = /<div className="flex flex-col space-y-8 text-2xl font-display font-bold">[\s\S]*?<div className="w-full h-px bg-olive\/20 my-4"><\/div>/;
code = code.replace(regexMobile, 
`<div className="flex flex-col space-y-8 text-2xl font-display font-bold">
            {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-olive hover:text-white transition-colors uppercase tracking-wider"
                >
                  {link.name}
                </a>
            ))}
            
            <div className="w-full h-px bg-olive/20 my-4"></div>`);
            
fs.writeFileSync('src/App.tsx', code);
