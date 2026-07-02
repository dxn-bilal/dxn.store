const CACHE_NAME = 'dxn-store-v21'; // زيدنا الإصدار إلى v20 علمود يجبر جهاز الزبون يمسح v19 ويحدث فوراً
const DYNAMIC_CACHE_NAME = 'dxn-dynamic-products-v1'; // كاش الصور والبيانات التلقائي

// 1. دمجنا كل ملفاتك القديمة (الأيقونات والمانيفست) مع ملفات البرمجة الأساسية
const assets = [
  './',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 2. تثبيت التطبيق وإجبار السيرفس وركر الجديد على التنشيط فوراً (من كودك القديم)
self.addEventListener('install', e => {
  self.skipWaiting(); // تجبر المتصفح على الانتقال للإصدار الجديد فوراً
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 3. التفعيل وحذف كاش الإصدارات القديمة تلقائياً (من كودك القديم مع حماية الكاش الديناميكي)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // يمسح أي كاش قديم، بس يعوف الكاش الثابت الجديد والكاش الديناميكي مالت الصور
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('جاري حذف الكاش القديم المنتهي:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // يسيطر على الموقع بالثانية الحالية
  );
});

// 4. الجلب الذكي: يفتح الملفات الأساسية أوفلاين + يلقط الصور وروابط الشيت تلقائياً (الكود الجديد مدمج)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // إذا الفايل أو الصورة موجودة مسبقاً بالكاش، افتحها فوراً بدون نت
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا مو موجودة، جيبها من النت وخزن نسخة منها للمستقبل
      return fetch(e.request).then(networkResponse => {
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          // شرط لقط الصور وروابط غوغل شيت تلقائياً بدون ما تكتب اسماؤهن وحدة وحدة
          if (
            e.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
            e.request.url.includes('google.com') || 
            e.request.url.includes('script.google')
          ) {
            cache.put(e.request, networkResponse.clone()); // خزن نسخة أوفلاين
          }
          return networkResponse;
        });
      }).catch(() => {
        // نتركها فارغة في حال الأوفلاين التام لملف غير مخزن
      });
    })
  );
});
