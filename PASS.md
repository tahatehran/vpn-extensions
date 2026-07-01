# PASS.md - Security & Access Guidelines

## Security Policy

### Reporting Security Vulnerabilities

اگر آسیب‌پذیری امنیتی در این مخزن مشاهده کردید، لطفاً آن را به صورت خصوصی گزارش دهید.

If you discover a security vulnerability in this repository, please report it privately.

**Do NOT** open a public Issue for security vulnerabilities.

### Contact

- **Email:** security@movtigroup.com
- **GitHub:** [https://github.com/movtigroup/movtigroup/security](https://github.com/movtigroup/movtigroup/security)

## Access Control

### Public Repository

این مخزن به صورت عمومی در دسترس است و شامل موارد زیر می‌باشد:

This repository is publicly accessible and contains:

- Visual design templates
- Layout components
- VPN browser extension (open source)
- Documentation
- Static assets (images, fonts, icons)

### Private Information

مطالب زیر به صورت خصوصی نگهداری می‌شوند و در این مخزن قرار نمی‌گیرند:

The following are kept private and are NOT in this repository:

- Backend source code
- API endpoints and logic
- Database schemas and connections
- Server configurations
- Environment variables and secrets
- Authentication systems
- Production deployment scripts
- User data and analytics

## Data Protection

### No Sensitive Data

این مخزن نباید حاوی داده‌های حساس باشد:

This repository should NOT contain:

- API keys or tokens
- Passwords or credentials
- Personal user data
- Database connection strings
- SSL private keys
- Internal server IPs
- VPN credentials or server keys

### Template Placeholders

در صورت نیاز به نمایش داده‌های نمونه، از placeholderهای امن استفاده کنید:

If sample data is needed, use secure placeholders:

```html
<!-- Instead of real API keys -->
<!-- Use: YOUR_API_KEY_HERE -->
```

### VPN Extension Security

افزونه VPN ما از امنیت زیر پشتیبانی می‌کند:

Our VPN extension supports the following security:

- **No Logging:** هیچ اطلاعات کاربری ذخیره نمی‌شود
  No user information is stored
- **Secure Connections:** اتصالات از طریق پروتکل‌های امن
  Connections via secure protocols
- **Open Source:** کد منبع قابل بررسی توسط جامعه
  Source code auditable by the community
- **Regular Updates:** بروزرسانی‌های منظم امنیتی
  Regular security updates

## Dependency Security

### Regular Audits

- بررسی منظم وابستگی‌ها برای آسیب‌پذیری‌های امنیتی
  Regular dependency audits for security vulnerabilities
- به‌روزرسانی وابستگی‌ها در صورت نیاز
  Update dependencies as needed

### Approved Dependencies

- وابستگی‌های جدید باید قبل از افزودن بررسی و تأیید شوند
  New dependencies must be reviewed and approved before addition
- از منابع معتبر و به‌روز استفاده کنید
  Use reputable and up-to-date sources

## Deployment Security

### GitHub Pages

- از HTTPS برای تمام ارتباطات استفاده می‌شود
  HTTPS is used for all communications
- دسترسی فقط به صورت خواندن (read-only) تنظیم شده است
  Access is configured as read-only

### CRX Files

- فایل‌های CRX با کلیدهای خصوصی امضا می‌شوند
  CRX files are signed with private keys
- کلیدهای خصوصی در مخزن ذخیره نمی‌شوند
  Private keys are NOT stored in the repository
- فقط از طریق GitHub Actions تولید می‌شوند
  Only generated via GitHub Actions

### Container Security (if applicable)

- از تصاویر پایه (base images) به روز استفاده کنید
  Use up-to-date base images
- اسکن vulnerabilities را به صورت منظم اجرا کنید
  Run vulnerability scans regularly
- به حداقل امتیازات (least privilege) عمل کنید
  Follow least privilege principles

## Compliance

### License

- این پروژه تحت لایسنس MIT منتشر می‌شود
  This project is released under the MIT License
- رعایت شرایط لایسنس الزامی است
  License terms must be respected

### Privacy

- اطلاعات شخصی در این مخزن جمع‌آوری نمی‌شود
  No personal information is collected in this repository
- از سرویس‌های شخص‌ساز (tracking) در قالب‌ها استفاده نشود
  No tracking services should be used in templates
- افزونه VPN اطلاعات کاربران را ذخیره نمی‌کند
  VPN extension does not store user data

## Incident Response

در صورت وقوع حادثه امنیتی:

In case of a security incident:

1. فوراً با تیم امنیت تماس بگیرید
   Contact the security team immediately
2. دسترسی‌های مربوطه را محدود کنید
   Restrict relevant access
3. آسیب‌پذیری را برطرف کنید
   Patch the vulnerability
4. اطلاعیه عمومی در صورت نیاز منتشر شود
   Publish a public advisory if necessary

---

**آخرین به‌روزرسانی | Last Updated:** 2025-06-10
