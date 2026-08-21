const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace desktop nav map
code = code.replace(/\{navLinks\.map\(\(link\) => \([\s\S]*?\)\s*\)\}/, 
`{navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-xs font-bold tracking-[0.2em] uppercase text-olive hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-white transition-all group-hover:w-full" />
                </a>
              ))}`);

// Replace mobile nav map
code = code.replace(/\{navLinks\.map\(\(link\) => \([\s\S]*?\)\s*\)\}/, 
`{navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-olive hover:text-white transition-colors uppercase tracking-wider"
                >
                  {link.name}
                </a>
            ))}`);

fs.writeFileSync('src/App.tsx', code);
