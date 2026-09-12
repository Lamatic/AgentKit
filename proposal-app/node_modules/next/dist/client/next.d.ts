import './register-deployment-id-global';
import './webpack';
import '../lib/require-instrumentation-client';
declare global {
    interface Window {
        next: any;
    }
}
