const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Refund from './pages/legal/Refund';
import Services from './pages/Services';
import { PaymentSuccess, PaymentFailure } from './pages/PaymentStatus';
`;

code = code.replace("import ControlPanel from './pages/ControlPanel';", imports + "\nimport ControlPanel from './pages/ControlPanel';");

const newRoutes = `
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/services" element={<Services />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
`;

code = code.replace("<Route path=\"/cp\" element={<ControlPanel />} />", "<Route path=\"/cp\" element={<ControlPanel />} />" + newRoutes);

fs.writeFileSync('src/App.tsx', code);
