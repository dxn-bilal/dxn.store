const CACHE_NAME = 'dxn-store-v25'; // اسم الإصدار الجديد
const assets = [
  './',
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

const staticCacheName = 'static-assets-v1';
const dynamicCacheName = 'dynamic-products-v1';

// 1. هنا تحط فقط الملفات الأساسية الثابتة (بدون أي صورة منتج!)
const staticAssets = [
  './',
  './index.html',
  './style.css',
  './script.js'
];

// تثبيت الكاش الثابت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(staticAssets);
    })
  );
});

// 2. الكود السحري لجلب الكاش التلقائي (الأساسي لشغلك)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // إذا الملف موجود بالكاش (مثل الهيكل الأساسي)، يفتحه فوراً بدون نت
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا الملف مو موجود (مثل صورة جديدة أو بيانات الشيت)، يجلبها من النت ويحفظها فوراً
      return fetch(event.request).then(networkResponse => {
        return caches.open(dynamicCacheName).then(cache => {
          // هنا نخبره: احفظ أي صورة (png, jpg) أو أي رابط جاي من غوغل شيت
          if (
            event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
            event.request.url.includes('google.com') || 
            event.request.url.includes('script.google')
          ) {
            // يحفظ نسخة في الكاش الديناميكي ويعرض النسخة الأصلية للزبون
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        // إذا كان أوفلاين تماماً والملف مو مخزن، تكدر ترجع صفحة خطأ أو تتركها فارغة
      });
    })
  );
});
