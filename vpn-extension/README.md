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

### Chrome / Edge:

1. فایل‌های را دانلود کنید
2. مرورگر Chrome یا Edge را باز کنید و به `chrome://extensions/` یا `edge://extensions/` بروید
3. حالت **Developer mode** را فعال کنید
4. روی **Load unpacked** کلیک کنید
5. پوشه `vpn-extension` را انتخاب کنید

### Firefox:

1. فایل‌ها را دانلود کنید
2. مرورگر Firefox را باز کنید و به `about:debugging#/runtime/this-firefox` بروید
3. روی **Load Temporary Add-on** کلیک کنید
4. فایل `manifest.json` را انتخاب کنید

### نصب از CRX:

1. فایل `.crx` مربوطه را دانلود کنید
2. فایل `.crx` را به صفحه extensions مرورگر drag and drop کنید

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

## 🔨 ساخت فایل CRX

برای ساخت فایل CRX برای مرورگرهای Chrome و Edge:

```bash
# از پوشه اصلی پروژه اجرا کنید
chmod +x build-crx.sh
./build-crx.sh all
```

یا برای ساخت تکی:

```bash
./build-crx.sh chrome    # فقط Chrome
./build-crx.sh edge      # فقط Edge
./build-crx.sh firefox   # فقط Firefox
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

## 🔄 بروزرسانی خودکار

افزونه به صورت خودکار لیست سرورها را بروزرسانی می‌کند. همچنین می‌توانید دکمه بروزرسانی دستی را در پنجره popup فشار دهید.

## 🐛 عیب‌یابی

### اتصال برقرار نمی‌شود

- بررسی کنید که اتصال اینترنت فعال باشد
- سرور DNS را تغییر دهید
- لیست سرورها را بروزرسانی کنید

### افزونه بارگذاری نمی‌شود

- مطمئن شوید که حالت Developer فعال است
- فایل‌ها را مجدداً دانلود کنید
- از مرورگر مدرن استفاده کنید

## 📄 لایسنس

MIT License

## 🔗 لینک‌های مفید

- [GitHub Repository](https://github.com/movtigroup/movtigroup)
- [Issues](https://github.com/movtigroup/movtigroup/issues)
- [Discussions](https://github.com/movtigroup/movtigroup/discussions)
