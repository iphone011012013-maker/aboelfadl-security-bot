const { Telegraf, Markup, Scenes, session } = require('telegraf');
const axios = require('axios'); // مكتبة Axios للطلبات اليدوية
const crypto = require('crypto'); // مكتبة Node.js للتشفير

// إعدادات البوت (يفضل وضع التوكن في Environment Variables للأمان)
const BOT_TOKEN = process.env.BOT_TOKEN || '8074252682:AAEVcKbV4oAz4nY44Pin6TnpsRuV8N74nds'; 
const ADMIN_ID = 1431886140;

const bot = new Telegraf(BOT_TOKEN);

// --- 1. إعداد خدمة الـ Scenes (المشاهد) ---
// هذا "ويزارد" بسيط لجمع معلومات المستخدم (خدمة Telegraf المتقدمة)
const infoWizard = new Scenes.WizardScene(
  'INFO_WIZARD',
  (ctx) => {
    ctx.reply('مرحباً بك في خدمة جمع البيانات الآمنة.\nالرجاء إدخال اسمك الحقيقي:');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    ctx.reply('ممتاز! الآن، كم عمرك؟');
    return ctx.wizard.next();
  },
  (ctx) => {
    const name = ctx.wizard.state.name;
    const age = ctx.message.text;
    ctx.reply(
      `تم حفظ البيانات بنجاح ✅\nالاسم: ${name}\nالعمر: ${age}`,
      // زر شفاف للخروج
      Markup.inlineKeyboard([
        Markup.button.callback('🔙 رجوع للقائمة', 'cancel_scene')
      ])
    );
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([infoWizard]);
bot.use(session());
bot.use(stage.middleware());

// --- 2. القائمة الرئيسية (أزرار ثابتة - Reply Keyboard) ---
const mainMenu = Markup.keyboard([
  ['🔐 تشفير نص (Node.js)', '📡 فحص موقع (Axios)'],
  ['🧙‍♂️ سيناريو بيانات', 'ℹ️ معلومات البوت']
]).resize();

// --- أوامر البداية ---
bot.start((ctx) => {
  ctx.reply(`أهلاً بك يا محمود (Admin) 🛡️\nتم تفعيل نظام ${ctx.botInfo.username}`, mainMenu);
});

// --- 3. خدمات Node.js (التشفير) ---
bot.hears('🔐 تشفير نص (Node.js)', (ctx) => {
  ctx.reply('اضغط على الزر الشفاف لتوليد هاش تشفير:', 
    Markup.inlineKeyboard([
      [Markup.button.callback('تشفير MD5', 'hash_md5')],
      [Markup.button.callback('تشفير SHA256', 'hash_sha256')]
    ])
  );
});

// معالجة الأزرار الشفافة للتشفير
bot.action('hash_md5', (ctx) => {
  const secret = 'AboElfadl_Secret';
  const hash = crypto.createHash('md5').update(secret).digest('hex');
  ctx.reply(`🔒 MD5 Hash:\n\`${hash}\``, { parse_mode: 'Markdown' });
});

bot.action('hash_sha256', (ctx) => {
  const secret = 'AboElfadl_Secret';
  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  ctx.reply(`🔒 SHA256 Hash:\n\`${hash}\``, { parse_mode: 'Markdown' });
});

// --- 4. خدمات Axios (طلبات HTTP يدوية) ---
bot.hears('📡 فحص موقع (Axios)', async (ctx) => {
  ctx.reply('جاري فحص حالة سيرفر Google باستخدام Axios...');
  try {
    const startTime = Date.now();
    // استخدام Axios لعمل طلب حقيقي
    const response = await axios.get('https://www.google.com');
    const endTime = Date.now();
    
    ctx.reply(
      `✅ الحالة: ${response.status} OK\n⏱️ الوقت المستغرق: ${endTime - startTime}ms`,
      Markup.inlineKeyboard([
        Markup.button.url('زيارة الموقع', 'https://www.google.com')
      ])
    );
  } catch (error) {
    ctx.reply(`❌ حدث خطأ أثناء الفحص: ${error.message}`);
  }
});

// --- تشغيل السيناريو ---
bot.hears('🧙‍♂️ سيناريو بيانات', (ctx) => ctx.scene.enter('INFO_WIZARD'));
bot.action('cancel_scene', (ctx) => ctx.reply('تم الإلغاء.', mainMenu));

bot.hears('ℹ️ معلومات البوت', (ctx) => {
  ctx.reply(`Admin ID: ${ADMIN_ID}\nLibraries: Telegraf, Axios, Node Crypto`);
});

// --- إعداد الويب هوك الخاص بـ Netlify ---
exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 200, body: 'Bot is active!' };
    }
    const body = JSON.parse(event.body);
    await bot.handleUpdate(body);
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Error' };
  }
};

