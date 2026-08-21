const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\{navLinks\.map\(\(link\) => \([\s\S]*?\)\s*\)\}/, 
`{navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-olive hover:text-white transition-colors uppercase tracking-wider"
                >
                  {link.name}
                </Link>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-olive hover:text-white transition-colors uppercase tracking-wider"
                >
                  {link.name}
                </a>
              )
            ))}`);

code = code.replace(/\{navLinks\.map\(\(link\) => \([\s\S]*?\)\s*\)\}/, 
`{navLinks.map((link) => (
              link.href.startsWith('/') ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-olive hover:text-white transition-colors uppercase tracking-wider"
                >
                  {link.name}
                </Link>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-olive hover:text-white transition-colors uppercase tracking-wider"
                >
                  {link.name}
                </a>
              )
            ))}`);

fs.writeFileSync('src/App.tsx', code);
