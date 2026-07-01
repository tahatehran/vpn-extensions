# MOVTI VPN Shield

فیلترشکن قدرتمند با رابط کاربری مدرن | Powerful VPN with Modern UI

## ✨ ویژگی‌ها

- 🔒 اتصال امن با یک کلیک
- 🌍 بیش از 300 سرور در سراسر جهان
- 📊 نمایش زنده آمار اتصال (پینگ، سرعت، آپلود، دانلود)
- 🎨 رابط کاربری مدرن و زیبا با تم تیره
- 🔄 بروزرسانی خودکار لیست سرورها
- 🔍 جستجوی سرورها
- ⚙️ تنظیمات پیشرفته (کیل سوئیچ، DNS، اتصال خودکار)

## 📦 نصب

1. فایل‌ها را دانلود کنید
2. مرورگر Chrome را باز کنید و به `chrome://extensions/` بروید
3. حالت **Developer mode** را فعال کنید
4. روی **Load unpacked** کلیک کنید
5. پوشه `vpn-extension` را انتخاب کنید

## 🛠️ ساختار پروژه

```
vpn-extension/
├── manifest.json          # Chrome Extension Manifest V3
├── popup.html             # صفحه اصلی popup
├── popup.css              # استایل‌های UI
├── popup.js               # منطق اتصال و مدیریت
├── background.js          # Service Worker
├── options.html           # صفحه تنظیمات
├── options.css            # استایل تنظیمات
├── options.js             # منطق تنظیمات
├── icons/                 # آیکون‌ها
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # مستندات
```

## 📊 منبع داده پراکسی

لیست پراکسی‌ها از منبع زیر بارگذاری می‌شود:

```
https://cdn.jsdelivr.net/gh/tahatehran/worker-vpn-proxy/best_proxies.txt
```

## 🎨 طراحی

- تم تیره مدرن با گرادیانت آبی
- انیمیشن‌های روان اتصال/قطع
- پشتیبانی RTL برای فارسی
- فونت Inter + Vazirmatn

## ⚙️ تنظیمات

- **اتصال خودکار**: اتصال خودکار هنگام باز کردن مرورگر
- **کیل سوئیچ**: قطع اینترنت در صورت قطع اتصال VPN
- **DNS**: انتخاب سرور DNS (پیش‌فرض، Cloudflare، Google، OpenDNS)

## 📄 لایسنس

MIT License
