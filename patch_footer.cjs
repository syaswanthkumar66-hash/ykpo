const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newFooter = `
      <footer className="py-12 border-t border-white/10 text-center bg-sage/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-left mb-8">
            <div>
              <div className="flex items-center gap-3 text-white mb-4">
                <img src="/favicon.svg" alt="YK Logo" className="w-8 h-8" />
                <span className="font-display font-bold tracking-widest uppercase">YK.</span>
              </div>
              <p className="text-olive/60 text-sm mb-4">
                Creative IoT Engineer & Full-Stack Developer delivering bespoke digital solutions.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-sm">Legal & Policies</h4>
              <ul className="space-y-2 text-sm text-olive/60">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/refund" className="hover:text-white transition-colors">Refund & Cancellation Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-sm">Contact Info</h4>
              <ul className="space-y-2 text-sm text-olive/60">
                <li>Email: contact@ykyash.in</li>
                <li>Phone: +91 (XXX) XXX-XXXX</li>
                <li>Address: Hyderabad, Telangana, India</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-6">
            <a href="https://www.instagram.com/ykyash.in" target="_blank" rel="noopener noreferrer" className="text-olive/60 hover:text-white transition-colors">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="https://www.facebook.com/1ykyash.in" target="_blank" rel="noopener noreferrer" className="text-olive/60 hover:text-white transition-colors">
              <Facebook className="w-6 h-6" />
            </a>
          </div>
          
          <p className="text-sm font-medium text-olive/60 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} YK. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
`;

code = code.replace(/<footer className="py-8 border-t border-olive\/10 text-center">[\s\S]*?<\/footer>\s*<\/div>\s*\);\s*\}/, newFooter);

fs.writeFileSync('src/App.tsx', code);
