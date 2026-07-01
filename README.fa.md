# افزونه VPN شرکت MOVTIGROUP

[English](README.en.md) | [فارسی](README.fa.md) | [中文](README.zh.md)

این مخزن شامل افزونه VPN مرورگر شرکت **MOVTIGROUP** است. هدف از ارائه این مخزن، نمایش و مستندسازی طراحی ظاهری و ساختار صفحات جهت ارائه‌ی هویت بصری شرکت می‌باشد. لازم به ذکر است که کدهای عملکردی و منطق پشت وب‌سایت به صورت خصوصی در مخزن مجزا نگهداری می‌شوند.

**لینک گیت هاب:** [https://github.com/movtigroup/movtigroup/](https://github.com/movtigroup/movtigroup/)

## معرفی

افزونه VPN شرکت شرکت MOVTIGROUP ارائه شده است. در اینجا تمرکز بر ایجاد یک تجربه کاربری مدرن، ساده و واکنش‌گرا قرار دارد. تمامی اجزا و ساختارهای بصری نمایانگر هویت برند، در‌باشند.

## ویژگی‌ها

### افزونه VPN

- **طراحی ریسپانسیو:** سازگار با تمامی دستگاه‌ها از جمله موبایل، تبلت و دسکتاپ.
- **سفارشی‌سازی آسان:** امکان تغییر و تطبیق المان‌های طراحی مطابق با هویت بصری شرکت.
- **پشتیبانی دو زبانه:** پشتیبانی کامل از زبان‌های فارسی (RTL) و انگلیسی (LTR).
- **سادگی و مستندسازی:** ساختار تمیز و مستند برای مرور و استفاده سریع.
- **سهولت نگهداری:** به‌روزرسانی‌های منظم و ساختار سازمان‌یافته جهت حفظ انسجام طراحی.
- **دسترس‌پذیری:** رعایت استانداردهای WCAG 2.1 برای دسترسی بهتر.

### افزونه VPN

- 🔒 اتصال امن با یک کلیک
- 🌍 بیش از 300 سرور در سراسر جهان
- 📊 نمایش زنده آمار اتصال (پینگ، سرعت، آپلود، دانلود)
- 🎨 رابط کاربری مدرن با تم تیره
- 🔄 بروزرسانی خودکار لیست سرورها
- 🔍 جستجوی سرورها
- ⚙️ تنظیمات پیشرفته (کیل سوئیچ، DNS، اتصال خودکار)

## ساختار پروژه

```
movtigroup/
├── .github/
│   ├── FUNDING.yml
│   └── workflows/
│       ├── jekyll-gh-pages.yml
│       ├── release.yml
│       ├── version-bump.yml
│       └── build-crx.yml
├── vpn-extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── background.js
│   ├── options.html
│   ├── options.css
│   ├── options.js
│   ├── icons/
│   └── README.md
├── build-crx.sh
├── .gitignore
├── .dockerignore
├── AGENTS.md
├── CHANGELOG
├── CLAUDE.md
├── CONTRIBUTING.md
├── DESIGN.md
├── LICENSE
├── PASS.md
├── PHILOSOPHY.md
├── README.md
├── README.en.md
├── README.fa.md
└── README.zh.md
```

## شروع به کار

### پیش‌نیازها

- مرورگر وب مدرن (Chrome, Firefox, Safari, Edge)
- برای توسعه: ویرایشگر کد (VS Code, PhpStorm, etc.)
- Node.js (برای ساخت فایل‌های CRX)

### نصب و استفاده

1. مخزن را کلون کنید:

   ```bash
   git clone https://github.com/movtigroup/movtigroup.git
   ```

2. به دایرکتوری پروژه بروید:

   ```bash
   cd movtigroup
   ```

3. فایل‌های افزونه را در مرورگر باز کنید یا از یک سرور محلی استفاده کنید.

### ساخت فایل‌های CRX

برای ساخت فایل‌های CRX برای مرورگرهای Chrome و Edge:

```bash
# اسکریپت را قابل اجرا کنید
chmod +x build-crx.sh

# ساخت تمام پکیج‌ها
./build-crx.sh all

# ساخت برای مرورگر خاص
./build-crx.sh chrome
./build-crx.sh edge
./build-crx.sh firefox
```

### نصب افزونه‌ها

#### Chrome:

1. `chrome://extensions/` را باز کنید
2. **Developer mode** را فعال کنید
3. فایل `.crx` را drag and drop کنید

#### Edge:

1. `edge://extensions/` را باز کنید
2. **Developer mode** را فعال کنید
3. فایل `.crx` را drag and drop کنید

#### Firefox:

1. `about:debugging#/runtime/this-firefox` را باز کنید
2. روی **Load Temporary Add-on** کلیک کنید
3. فایل `manifest.json` را از ZIP استخراج شده انتخاب کنید

## نسخه‌بندی

این پروژه از Semantic Versioning استفاده می‌کند. برای افزایش نسخه:

1. به Actions → Version Bump بروید
2. نوع افزایش را انتخاب کنید (patch/minor/major)
3. workflow را اجرا کنید

یا از خط فرمان استفاده کنید:

```bash
# نصب وابستگی‌ها
npm install -g semantic-release

# افزایش خودکار نسخه
npm run bump
```

## ایجاد Release

Releaseها به صورت خودکار از طریق GitHub Actions ایجاد می‌شوند:

1. یک tag با فرمت `v*` push کنید
2. Workflow به صورت خودکار:
   - فایل‌های CRX برای Chrome و Edge می‌سازد
   - ZIP برای Firefox ایجاد می‌کند
   - GitHub Release با تمام artifacts ایجاد می‌کند

```bash
# ایجاد release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## مستندات

- [DESIGN.md](DESIGN.md) - مستندات سیستم طراحی
- [CONTRIBUTING.md](CONTRIBUTING.md) - راهنمای مشارکت
- [PHILOSOPHY.md](PHILOSOPHY.md) - فلسفه پروژه
- [PASS.md](PASS.md) - امنیت و دسترسی
- [CHANGELOG](CHANGELOG) - تاریخچه تغییرات

## نکات مهم

- این مخزن صرفاً جهت نمایش افزونه VPN می‌باشد.
- کدهای مربوط به منطق عملکردی و مدیریت ترافیک، در مخزن خصوصی جداگانه نگهداری می‌شوند.
- تغییرات، بهبودها و به‌روزرسانی‌های طراحی از طریق این مخزن منتشر خواهند شد.
- این پروژه تحت لایسنس [MIT](LICENSE) منتشر شده است.

## استفاده از افزونه

برای بررسی اجزای طراحی و ساختار صفحات، می‌توانید فایل‌های موجود در این مخزن را مرور نمایید. در صورت داشتن نظرات یا پیشنهادات جهت بهبود افزونه، از طریق بخش **Issues** یا ارتباط مستقیم با تیم ما مشارکت فرمایید.

## ارتباط با ما

- **گیت هاب:** [https://github.com/movtigroup/](https://github.com/movtigroup/)
- **وب‌سایت:** [https://movtigroup.com](https://movtigroup.com)

---

**نسخه:** 1.0.0 | **آخرین به‌روزرسانی:** 2025-06-10
