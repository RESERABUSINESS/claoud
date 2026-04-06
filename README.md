# عروض ذكية | Smart Offers

نظام أتمتة عروض وخصومات ذكية للمتاجر الإلكترونية السعودية.

## المميزات

- **إدارة العروض**: إنشاء وتعديل وحذف العروض والخصومات بسهولة
- **أنواع متعددة**: نسبة مئوية، مبلغ ثابت، اشتري واحصل، شحن مجاني
- **التحقق الآلي**: واجهة API للتحقق من صلاحية أكواد الخصم
- **تقارير وإحصائيات**: تتبع أداء العروض ومعدلات الاستخدام
- **واجهة عربية**: واجهة مستخدم كاملة بالعربي مع دعم RTL

## التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| Next.js 14 | الواجهة الأمامية والخلفية |
| TypeScript | لغة البرمجة |
| Tailwind CSS | التصميم |
| PostgreSQL | قاعدة البيانات |
| Prisma ORM | إدارة قاعدة البيانات |

## هيكل المشروع

```
src/
├── app/                # صفحات Next.js و API Routes
│   ├── api/offers/     # واجهات API للعروض
│   ├── dashboard/      # لوحة التحكم
│   └── layout.tsx      # التخطيط الرئيسي (RTL)
├── components/         # مكونات React
├── lib/                # أدوات مساعدة
├── services/           # منطق الأعمال
└── types/              # أنواع TypeScript
prisma/
└── schema.prisma       # مخطط قاعدة البيانات
```

## البدء السريع

### المتطلبات

- Node.js 18+
- PostgreSQL
- npm

### التثبيت

```bash
# استنساخ المشروع
git clone <repo-url>
cd claoud

# تثبيت الحزم
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# عدّل ملف .env بإعدادات قاعدة البيانات الخاصة بك

# إعداد قاعدة البيانات
npx prisma migrate dev --name init

# تشغيل المشروع
npm run dev
```

المشروع سيعمل على `http://localhost:3000`

## واجهات API

### العروض

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/offers?storeId=xxx` | جلب عروض المتجر |
| POST | `/api/offers` | إنشاء عرض جديد |
| POST | `/api/offers/validate` | التحقق من كود خصم |

### مثال: إنشاء عرض

```json
POST /api/offers
{
  "storeId": "store_123",
  "name": "خصم الصيف",
  "type": "PERCENTAGE",
  "value": 15,
  "code": "SUMMER15",
  "startsAt": "2026-06-01",
  "endsAt": "2026-08-31",
  "minOrderAmount": 100,
  "maxDiscount": 50
}
```

### مثال: التحقق من كود خصم

```json
POST /api/offers/validate
{
  "code": "SUMMER15",
  "storeId": "store_123",
  "orderAmount": 200
}
```

## الرخصة

MIT
