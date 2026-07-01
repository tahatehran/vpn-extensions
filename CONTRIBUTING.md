# راهنمای مشارکت | Contributing Guide

## مقدمه | Introduction

از علاقه شما برای مشارکت در پروژه MOVTIGROUP سپاسگزاریم. این مخزن شامل قالب وب‌سایت و افزونه VPN مرورگر می‌باشد و مشارکت‌های شما در بهبود قالب‌ها، اجزای بصری و افزونه بسیار ارزشمند است.

We appreciate your interest in contributing to the MOVTIGROUP project. This repository contains the website template and VPN browser extension, and your contributions to improving templates, visual components, and the extension are highly valued.

## نحوه مشارکت | How to Contribute

### گزارش باگ‌ها | Reporting Bugs

اگر باگی در قالب‌ها، اجزای بصری یا افزونه VPN مشاهده کردید:

If you find a bug in the templates, visual components, or VPN extension:

1. به بخش [Issues](https://github.com/movtigroup/movtigroup/issues) مراجعه کنید
   Visit the [Issues](https://github.com/movtigroup/movtigroup/issues) section
2. بررسی کنید که باگ قبلاً گزارش نشده باشد
   Check if the bug has already been reported
3. یک Issue جدید با عنوان واضح ایجاد کنید
   Create a new Issue with a clear title
4. مراحل تکرار باگ و اطلاعات دستگاه را ذکر کنید
   Include steps to reproduce and device information

### پیشنهاد بهبود | Suggesting Improvements

برای پیشنهاد بهبودهای طراحی یا افزونه:

To suggest design improvements or extension features:

1. در [Discussions](https://github.com/movtigroup/movtigroup/discussions) موضوع خود را مطرح کنید
   Raise your topic in [Discussions](https://github.com/movtigroup/movtigroup/discussions)
2. توضیحات دقیق و اگر ممکن است تصاویر نمونه ارائه دهید
   Provide detailed explanations and sample images if possible
3. با تیم ما در ارتباط باشید
   Contact our team

### ارسال Pull Request | Submitting Pull Requests

برای ارسال تغییرات:

To submit changes:

1. مخزن را Fork کنید
   Fork the repository
2. یک شاخه جدید برای ویژگی خود ایجاد کنید (`git checkout -b feature/amazing-feature`)
   Create a new branch for your feature
3. تغییرات خود را Commit کنید (`git commit -m 'Add amazing feature'`)
   Commit your changes
4. به شاخه Push کنید (`git push origin feature/amazing-feature`)
   Push to the branch
5. یک Pull Request باز کنید
   Open a Pull Request

## استانداردهای کدنویسی | Coding Standards

### قالب وب‌سایت | Website Template

- از HTML5 معنایی استفاده کنید
  Use semantic HTML5
- از قراردادهای نام‌گذاری BEM یا مشابه آن پیروی کنید
  Follow BEM or similar CSS naming conventions
- طراحی را موبایل-فرست (Mobile-First) در نظر بگیرید
  Consider mobile-first responsive design
- استانداردهای دسترس‌پذیری (WCAG 2.1) را رعایت کنید
  Maintain accessibility standards (WCAG 2.1)
- اندازه فایل‌ها را برای عملکرد وب بهینه نگه دارید
  Keep file sizes optimized for web performance

### افزونه VPN | VPN Extension

- از Manifest V3 برای Chrome/Edge استفاده کنید
  Use Manifest V3 for Chrome/Edge
- کد تمیز و مستند بنویسید
  Write clean and documented code
- از APIهای استاندارد مرورگر استفاده کنید
  Use standard browser APIs
- سازگاری با مرورگرهای مختلف را تست کنید
  Test compatibility with different browsers

## پشتیبانی دو زبانه | Bilingual Support

تمام محتوای کاربر-facing باید به هر دو زبان فارسی و انگلیسی در نظر گرفته شود.

All user-facing content should be provided in both Persian (Farsi) and English.

- فایل‌های README.md (فارسی) و README.en.md (انگلیسی) را به‌روز نگه دارید
  Keep README.md (Persian) and README.en.md (English) updated
- برای چیدمان‌های RTL/LTR از استایل‌های جداگانه استفاده کنید
  Use separate styles for RTL/LTR layouts

## تست افزونه | Testing the Extension

### نصب و تست | Installation & Testing

1. فایل‌ها را دانلود کنید
   Download the files
2. مرورگر Chrome یا Edge را باز کنید
   Open Chrome or Edge browser
3. به صفحه extensions بروید
   Go to the extensions page
4. حالت Developer را فعال کنید
   Enable Developer mode
5. روی Load unpacked کلیک کنید
   Click Load unpacked
6. پوشه vpn-extension را انتخاب کنید
   Select the vpn-extension folder

### ساخت CRX | Building CRX

```bash
# اسکریپت را قابل اجرا کنید
chmod +x build-crx.sh

# ساخت برای همه مرورگرها
./build-crx.sh all
```

## سوالات | Questions

اگر سوالی دارید، می‌توانید:

If you have questions, you can:

- یک Issue باز کنید
  Open an Issue
- با تیم ما از طریق لینک‌های موجود در README تماس بگیرید
  Contact our team through the links in the README

---

**متشکریم که وقت می‌گذارید! | Thank you for your time!**
