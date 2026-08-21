const fs = require('fs');
let code = fs.readFileSync('src/pages/Services.tsx', 'utf8');

// Remove from initial state
code = code.replace(/phone:\s*'',\s*/g, '');

// Remove from validation
code = code.replace(/\|\|\s*!formData\.phone\s*/g, '');

// Remove from payload
code = code.replace(/phone:\s*formData\.phone,\s*/g, '');

// Remove from hidden inputs
code = code.replace(/<input\s+type="hidden"\s+name="phone"\s+value=\{formData\.phone\}\s*\/>/g, '<input type="hidden" name="phone" value="0000000000" />');

// Remove the UI section
const uiRegex = /<div>\s*<label className="block text-xs font-bold uppercase tracking-wider text-white\/50 mb-2">Phone Number<\/label>\s*<input\s*type="tel"\s*value=\{formData\.phone\}\s*onChange=\{e => setFormData\(\{ \.\.\.formData, phone: e\.target\.value \}\)\}\s*required\s*className="w-full bg-black\/20 border border-white\/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-teal-500"\s*\/>\s*<\/div>/g;
code = code.replace(uiRegex, '');

fs.writeFileSync('src/pages/Services.tsx', code);
