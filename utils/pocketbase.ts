import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from './config';

// Singleton pattern untuk mencegah multiple client instances
let pbInstance: PocketBase | null = null;

export const pb = (() => {
  if (!pbInstance) {
    // Gunakan hardcoded URL untuk memastikan konsistensi
    pbInstance = new PocketBase('http://141.11.25.69:8090');
    
    // Tambahkan event listener untuk error jaringan
    pbInstance.beforeSend = function (url, options) {
      // Tambahkan header tambahan jika diperlukan
      options.headers = {
        ...options.headers,
        'X-App-Version': '2.0',
      };
      
      return { url, options };
    };
  }
  return pbInstance;
})();