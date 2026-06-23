const CACHE_NAME = 'dxn-store-v6'; // اسم الإصدار الجديد
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. تثبيت التطبيق وإجبار السيرفس وركر الجديد على التنشيط فوراً
self.addEventListener('install', e => {
  self.skipWaiting(); // خطوة مصيرية: تجبر المتصفح على الانتقال لـ v3 فوراً بدون انتظار
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. التفعيل وحذف كاش الإصدارات القديمة (v1, v2) من جهاز الزبون تلقائياً
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('جاري حذف الكاش القديم المنتهي:', cache);
            return caches.delete(cache); // يمسح الفايلات القديمة تماماً علمود لا تظهر للزبون
          }
        })
      );
    }).then(() => self.clients.claim()) // يخلي السيرفس وركر الجديد يسيطر على الموقع بالثانية الحالية
  );
});

// 3. جلب البيانات وتشغيل المتجر أوفلاين وسونلاين
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
