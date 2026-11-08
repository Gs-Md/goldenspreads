import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "golden-spreads-language";
const LanguageContext = createContext(null);

const translations = {
  "Products": "المنتجات",
  "About": "من نحن",
  "Golden Rewards": "مكافآت غولدن",
  "Close navigation menu": "إغلاق قائمة التنقّل",
  "Open navigation menu": "فتح قائمة التنقّل",
  "Homemade peanut butter • Small batches • Made with love": "زبدة فول سوداني محضّرة منزلياً • دفعات صغيرة • صُنعت بكل حب",
  "© 2026 Golden Spreads": "© 2026 غولدن سبريدز",
  "Golden Spreads": "غولدن سبريدز",
  "Golden Spreads signature jar": "مرطبان غولدن سبريدز المميّز",
  "CRAFTED FOR YOUR EVERYDAY": "صُنعت لترافق تفاصيل يومك",
  "SMALL BATCH. BIG ON FLAVOUR.": "دفعات صغيرة، ونكهة كبيرة.",
  "Make every": "اجعل كل",
  "spoon": "ملعقة",
  "golden.": "ذهبية.",
  "Discover peanut butter made for the moments worth savouring. Simple ingredients, beautiful blends, and a little golden magic in every jar.": "اكتشف زبدة الفول السوداني المصمّمة للحظات التي تستحق الاستمتاع بها. مكوّنات بسيطة، ومزيج شهي، ولمسة من السحر الذهبي في كل مرطبان.",
  "Explore our spreads": "اكتشف منتجاتنا",
  "Discover our story": "اكتشف قصتنا",
  "Signature blends": "خلطات مميّزة",
  "In every jar": "في كل مرطبان",
  "Starting price": "السعر يبدأ من",
  "A LITTLE GOLDEN JOY, EVERY DAY.": "قليل من الفرح الذهبي، كل يوم.",
  "THE": "مجموعة",
  "GOLDEN COLLECTION": "غولدن سبريدز",
  "MADE": "صُنعت",
  "WITH": "بكل",
  "LOVE ✦": "حب ✦",
  "01 — THE COLLECTION": "01 — المجموعة",
  "GOODNESS IN EVERY SPOON": "خير في كل ملعقة",
  "REAL INGREDIENTS": "مكوّنات حقيقية",
  "BEAUTIFULLY CRAFTED": "محضّرة بعناية",
  "MADE TO BE SHARED": "صُنعت لتُشارك",
  "SCROLL TO EXPLORE ↓": "مرّر لاكتشاف المزيد ↓",
  "SMALL BATCHES": "دفعات صغيرة",
  "SIMPLE INGREDIENTS": "مكوّنات بسيطة",
  "MADE TO SPREAD JOY": "صُنعت لنشر الفرح",
  "Find your": "اكتشف",
  "favourite.": "مفضّلك.",
  "Five delicious ways to make your everyday a little better.": "خمس نكهات لذيذة تجعل يومك أجمل.",
  "SIGNATURE SPREADS": "خلطاتنا المميّزة",
  "THE ART OF A GOOD SPREAD": "فنّ المذاق الرائع",
  "Nothing complicated.": "لا شيء معقّد.",
  "Just": "فقط",
  "goodness.": "مذاق طيّب.",
  "From classic roasted peanuts to naturally sweet combinations, discover a spread for every mood and every moment.": "من الفول السوداني المحمّص الكلاسيكي إلى الخلطات المحلّاة طبيعياً، اكتشف نكهة تناسب كل مزاج وكل لحظة.",
  "01 / THE CLASSIC": "01 / الكلاسيكية",
  "Peanuts first.": "الفول السوداني أولاً.",
  "The foundation of our classic creamy and crunchy peanut butter.": "أساس زبدة الفول السوداني الكلاسيكية الناعمة والمقرمشة.",
  "02 / THE SWEET SIDE": "02 / النكهات الحلوة",
  "Naturally sweet.": "حلاوة طبيعية.",
  "Discover delicious combinations featuring dates and cocoa.": "اكتشف خلطات لذيذة من التمر والكاكاو.",
  "03 / YOUR MOMENT": "03 / لحظتك",
  "Made for you.": "صُنعت من أجلك.",
  "Enjoy your favourite spreads on toast, smoothies, oats and more.": "استمتع بنكهاتك المفضّلة مع التوست والسموذي والشوفان وغيرها.",
  "GOOD FOOD. GOOD MOOD.": "طعام طيّب، ومزاج رائع.",
  "YOUR NEXT FAVOURITE SPOON": "ملعقتك المفضّلة القادمة",
  "Life tastes better": "الحياة ألذّ",
  "with a little": "مع لمسة من",
  "Find your favourite blend and make every bite a little more special.": "اختر خلطتك المفضّلة واجعل كل لقمة أكثر تميّزاً.",
  "Find your favourite": "اكتشف نكهتك المفضّلة",
  "Our Story": "قصتنا",
  "Golden Spreads started as a simple homemade experiment — roasting peanuts, testing textures, and chasing the perfect spoonful. Every jar is made in small batches using clean ingredients Golden peanut butter Spreads, done right.": "بدأت غولدن سبريدز كتجربة منزلية بسيطة: تحميص الفول السوداني، واختبار القوام، والبحث عن الملعقة المثالية. نحضّر كل مرطبان على دفعات صغيرة باستخدام مكوّنات مختارة بعناية، لنقدّم زبدة فول سوداني كما يجب أن تكون.",
  "Small Batches": "دفعات صغيرة",
  "Freshly made for better texture and consistent quality.": "تُحضّر طازجة للحصول على قوام أفضل وجودة ثابتة.",
  "Premium Ingredients": "مكوّنات ممتازة",
  "Balanced Ingredients designed to fuel your day": "مكوّنات متوازنة تمنحك الطاقة خلال يومك.",
  "Made for daily life": "مصمّمة لحياتك اليومية",
  "Perfect for toast, oats, smoothies, baking, and snacks.": "مثالية للتوست والشوفان والسموذي والخبز والوجبات الخفيفة.",
  "BEST SELLER": "الأكثر مبيعاً",
  "Ingredients:": "المكوّنات:",
  "Best use:": "الاستخدامات المقترحة:",
  "Classic Peanut Butter": "زبدة الفول السوداني الكلاسيكية",
  "Crunchy Peanut Butter": "زبدة الفول السوداني المقرمشة",
  "Dates Peanut Butter": "زبدة الفول السوداني بالتمر",
  "Cocoa & Dates Peanut Butter": "زبدة الفول السوداني بالكاكاو والتمر",
  "Protein Powder Peanut Butter": "زبدة الفول السوداني بالبروتين",
  "Roasted peanuts": "فول سوداني محمّص",
  "Roasted peanuts, Peanut pieces": "فول سوداني محمّص وقطع من الفول السوداني",
  "Peanuts, Dates": "فول سوداني وتمر",
  "Peanuts, Cocoa , Dates": "فول سوداني وكاكاو وتمر",
  "Peanuts, whey protein": "فول سوداني وبروتين مصل الحليب",
  "No Added Sugars": "من دون سكريات مضافة",
  "Gluten Free": "خالٍ من الغلوتين",
  "Keto Friendly": "مناسب لنظام الكيتو",
  "Organic": "عضوي",
  "Naturally Sweetened": "محلّى طبيعياً",
  "Natural Energy Booster": "مصدر طبيعي للطاقة",
  "Palm Oil Free": "خالٍ من زيت النخيل",
  "No Preservatives": "من دون مواد حافظة",
  "High Protein (130g)": "غني بالبروتين (130 غ)",
  "Toast, Smoothies, Apple slices, Banana sandwiches Baking, OatMeals.": "التوست والسموذي وشرائح التفاح وسندويشات الموز والخبز والشوفان.",
  "Toast, Yogurt bowls, Apple slices, Banana sandwiches, OatMeals.": "التوست وأطباق اللبن وشرائح التفاح وسندويشات الموز والشوفان.",
  "Toast, Pancake,Yogurt Bowls, Energy Balls, Smoothies, OatMeals.": "التوست والبان كيك وأطباق اللبن وكرات الطاقة والسموذي والشوفان.",
  "Smoothies, OatMeals, Protein shakes, Waffles, Pancakes, Rice Cake.": "السموذي والشوفان ومخفوقات البروتين والوافل والبان كيك وكعك الأرز.",
  "Lab Tested": "مختبَر في المختبر",
  "Tested for Quality & Safety": "اختُبرت من حيث الجودة والسلامة",
  "Our peanut butter sample was microbiologically tested at the Chamber of Commerce, Industry & Agriculture in Sidon and South Lebanon.": "خضعت عيّنة من زبدة الفول السوداني لدينا لفحوصات ميكروبيولوجية في غرفة التجارة والصناعة والزراعة في صيدا والجنوب.",
  "Open microbiological test report": "فتح تقرير الفحوصات الميكروبيولوجية",
  "Microbiological test report from the Chamber of Commerce, Industry and Agriculture in Sidon and South Lebanon": "تقرير الفحوصات الميكروبيولوجية الصادر عن غرفة التجارة والصناعة والزراعة في صيدا والجنوب",
  "View full report": "عرض التقرير كاملاً",
  "Microbiological Test Results": "نتائج الفحوصات الميكروبيولوجية",
  "Salmonella:": "السالمونيلا:",
  "Absent": "غير موجودة",
  "E. coli:": "الإشريكية القولونية:",
  "Total coliforms:": "القولونيات الكلية:",
  "Anaerobic count:": "العدد اللاهوائي:",
  "Result:": "النتيجة:",
  "Compliant with referenced standards": "مطابق للمعايير المرجعية",
  "Results relate to the submitted sample.": "تتعلّق النتائج بالعيّنة المقدّمة للفحص.",
  "View Report": "عرض التقرير",
  "Microbiological test report": "تقرير الفحوصات الميكروبيولوجية",
  "Close report": "إغلاق التقرير",
  "Full microbiological test report": "تقرير الفحوصات الميكروبيولوجية الكامل",
  "Made by you": "بمشاركتكم",
  "Golden Community": "مجتمع غولدن",
  "Recipes, serving ideas, and real feedback from our customers.": "وصفات وأفكار للتقديم وآراء حقيقية من عملائنا.",
  "Previous photo": "الصورة السابقة",
  "Next photo": "الصورة التالية",
  "Recipe": "وصفة",
  "Feedback": "آراء العملاء",
  "Choose a photo": "اختر صورة",
  "Show photo": "عرض الصورة",
  "Customer Favorites": "اختيارات العملاء المفضّلة",
  "Client Feedback": "آراء العملاء",
  "See what our customers are saying about their experience with Golden Spreads.": "اكتشفوا ما يقوله عملاؤنا عن تجربتهم مع غولدن سبريدز.",
  "See what our customers are saying about Golden Spreads.": "اكتشفوا آراء عملائنا حول غولدن سبريدز.",
  "Customer Testimonials": "شهادات العملاء",
  "Customer Love": "محبة العملاء",
  "Goodness in every spoon.": "خير في كل ملعقة.",
  "Golden Rewards is almost ready": "مكافآت غولدن أصبحت جاهزة تقريباً",
  "The public Neon Auth URL has not been configured.": "لم يتم إعداد رابط Neon Auth العام.",
  "Back to homepage": "العودة إلى الصفحة الرئيسية",
  "GOLDEN SPREADS REWARDS": "مكافآت غولدن سبريدز",
  "Join Golden Rewards": "انضم إلى مكافآت غولدن",
  "Welcome back": "أهلاً بعودتك",
  "Create your account and start collecting points with your purchases.": "أنشئ حسابك وابدأ بجمع النقاط مع مشترياتك.",
  "Sign in to access your Golden Wallet.": "سجّل الدخول للوصول إلى محفظة غولدن الخاصة بك.",
  "Account access": "الوصول إلى الحساب",
  "Sign up": "إنشاء حساب",
  "Sign in": "تسجيل الدخول",
  "Clearing previous session...": "جارٍ مسح الجلسة السابقة...",
  "Clear previous session": "مسح الجلسة السابقة",
  "Your full name": "اسمك الكامل",
  "Phone number": "رقم الهاتف",
  "(optional)": "(اختياري)",
  "WhatsApp / phone number": "رقم واتساب / الهاتف",
  "you@example.com": "you@example.com",
  "At least 8 characters": "8 أحرف على الأقل",
  "Please wait...": "يرجى الانتظار...",
  "Create my Golden Wallet": "إنشاء محفظة غولدن",
  "Already received a six-digit verification code?": "هل وصل إليك رمز التحقق المؤلف من ستة أرقام؟",
  "Continue email verification": "متابعة التحقق من البريد الإلكتروني",
  "Your account is for loyalty points only. Orders and payments continue through WhatsApp, Instagram, phone, or in person.": "حسابك مخصّص لنقاط الولاء فقط. تستمر الطلبات وعمليات الدفع عبر واتساب أو إنستغرام أو الهاتف أو مباشرةً.",
  "Email verified. Enter your account password to finish.": "تم التحقق من البريد الإلكتروني. أدخل كلمة مرور حسابك لإكمال العملية.",
  "Unable to complete your sign-in.": "تعذّر إكمال تسجيل الدخول.",
  "Your account could not be fully activated.": "تعذّر تفعيل حسابك بالكامل.",
  "Welcome to Golden Rewards!": "أهلاً بك في مكافآت غولدن!",
  "Email verification was not completed.": "لم يكتمل التحقق من البريد الإلكتروني.",
  "Email verified. Enter your password to open your wallet.": "تم التحقق من البريد الإلكتروني. أدخل كلمة المرور لفتح محفظتك.",
  "Email verified. Opening your Golden Wallet...": "تم التحقق من البريد الإلكتروني. جارٍ فتح محفظة غولدن...",
  "Verification failed. Try again.": "فشل التحقق. حاول مجدداً.",
  "Unable to finish your registration.": "تعذّر إكمال تسجيلك.",
  "If verification has expired, return to sign in and complete the normal login verification.": "إذا انتهت صلاحية التحقق، عُد إلى تسجيل الدخول وأكمل عملية التحقق المعتادة.",
  "Unable to send verification code.": "تعذّر إرسال رمز التحقق.",
  "A new verification code was requested. Check your inbox and spam folder.": "تم طلب رمز تحقق جديد. تحقّق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها.",
  "Unable to resend the code.": "تعذّر إعادة إرسال الرمز.",
  "Complete your Golden Wallet": "أكمل إعداد محفظة غولدن",
  "Verify your email": "تحقّق من بريدك الإلكتروني",
  "Your email has been verified successfully.": "تم التحقق من بريدك الإلكتروني بنجاح.",
  "Enter the six-digit code sent to your email.": "أدخل رمز التحقق المؤلف من ستة أرقام الذي أُرسل إلى بريدك الإلكتروني.",
  "Verifying your account...": "جارٍ التحقق من حسابك...",
  "Verify and open Golden Wallet": "تحقّق وافتح محفظة غولدن",
  "Enter your password": "أدخل كلمة المرور",
  "Opening wallet...": "جارٍ فتح المحفظة...",
  "Continue to Golden Wallet": "المتابعة إلى محفظة غولدن",
  "Enter your password first.": "أدخل كلمة المرور أولاً.",
  "Unable to create login verification.": "تعذّر إنشاء رمز التحقق لتسجيل الدخول.",
  "Check your email for the login code.": "تحقّق من بريدك الإلكتروني للحصول على رمز تسجيل الدخول.",
  "Unable to send login code.": "تعذّر إرسال رمز تسجيل الدخول.",
  "Login verification was not completed.": "لم يكتمل التحقق من تسجيل الدخول.",
  "Incorrect or expired login code.": "رمز تسجيل الدخول غير صحيح أو انتهت صلاحيته.",
  "Sending code...": "جارٍ إرسال الرمز...",
  "Send login code": "إرسال رمز تسجيل الدخول",
  "Verifying...": "جارٍ التحقق...",
  "Verify and open wallet": "تحقّق وافتح المحفظة",
  "Unable to sign out.": "تعذّر تسجيل الخروج.",
  "Enter a valid email address first.": "أدخل عنوان بريد إلكتروني صالحاً أولاً.",
  "Enter a valid email address.": "أدخل عنوان بريد إلكتروني صالحاً.",
  "Enter your full name.": "أدخل اسمك الكامل.",
  "Unable to create your account.": "تعذّر إنشاء حسابك.",
  "Sign in failed.": "فشل تسجيل الدخول.",
  "Unable to complete this request.": "تعذّر إكمال هذا الطلب.",
  "Unable to complete account verification.": "تعذّر إكمال التحقق من الحساب.",
  "Could not load your wallet.": "تعذّر تحميل محفظتك.",
  "Please sign in with your existing account.": "يرجى تسجيل الدخول باستخدام حسابك الحالي.",
  "Your previous session has been cleared. Sign in again.": "تم مسح جلستك السابقة. سجّل الدخول مجدداً.",
  "Please try again.": "يرجى المحاولة مجدداً.",
  "Your contact number has been saved.": "تم حفظ رقم التواصل الخاص بك.",
  "Could not save your phone number.": "تعذّر حفظ رقم هاتفك.",
  "Unable to save redemption request. No request was sent.": "تعذّر حفظ طلب استبدال النقاط. لم يتم إرسال أي طلب.",
  "No reward code returned. Retry using the same request.": "لم يتم إرجاع رمز المكافأة. أعد المحاولة باستخدام الطلب نفسه.",
  "Show it to Golden Spreads when placing your next order.": "أبرزه لفريق غولدن سبريدز عند تقديم طلبك القادم.",
  "It expires in 30 days.": "تنتهي صلاحيته خلال 30 يوماً.",
  "The saved request could not be cleared. Retry the same request.": "تعذّر مسح الطلب المحفوظ. أعد المحاولة باستخدام الطلب نفسه.",
  "Wallet refresh failed. Refresh the page to update your balance.": "فشل تحديث المحفظة. أعد تحميل الصفحة لتحديث رصيدك.",
  "Your reward was created successfully.": "تم إنشاء مكافأتك بنجاح.",
  "Your reward was created successfully, but part of the wallet update failed. Refresh the page.": "تم إنشاء مكافأتك بنجاح، لكن تعذّر إكمال جزء من تحديث المحفظة. أعد تحميل الصفحة.",
  "Could not redeem your points. Your request remains saved for retry.": "تعذّر استبدال نقاطك. لا يزال طلبك محفوظاً لإعادة المحاولة.",
  "Your session needs to be refreshed": "يجب تحديث جلستك",
  "Your wallet couldn't load": "تعذّر تحميل محفظتك",
  "Sign out and return to sign in": "سجّل الخروج ثم عُد إلى صفحة تسجيل الدخول",
  "Golden Member": "عضو غولدن",
  "YOUR PERSONAL LOYALTY ACCOUNT": "حساب الولاء الشخصي الخاص بك",
  "Hello,": "مرحباً،",
  "Your next order can bring you closer to a Golden reward.": "طلبك القادم قد يقرّبك أكثر من الحصول على مكافأة غولدن.",
  "GOLDEN REWARDS": "مكافآت غولدن",
  "AVAILABLE POINTS": "النقاط المتاحة",
  "PTS": "نقطة",
  "Worth": "تساوي",
  "in rewards": "من المكافآت",
  "MEMBER ID": "رقم العضوية",
  "MEMBER": "العضو",
  "Total earned": "إجمالي النقاط المكتسبة",
  "Total redeemed": "إجمالي النقاط المستبدلة",
  "YOUR NEXT REWARD": "مكافأتك القادمة",
  "200 points = $1 off": "200 نقطة = خصم بقيمة $1",
  "points": "نقاط",
  "Retry pending redemption": "إعادة محاولة استبدال النقاط المعلّق",
  "Redeem 200 points for $1 off": "استبدل 200 نقطة لتحصل على خصم $1",
  "YOUR REWARD CODES": "رموز المكافآت الخاصة بك",
  "Ready to use": "جاهزة للاستخدام",
  "Issued": "صادر",
  "ACCOUNT DETAILS": "تفاصيل الحساب",
  "Your contact number": "رقم التواصل الخاص بك",
  "Save": "حفظ",
  "YOUR ACTIVITY": "نشاطك",
  "Recent transactions": "آخر المعاملات",
  "Your purchases and rewards will appear here.": "ستظهر مشترياتك ومكافآتك هنا.",
  "Open Golden Spreads admin dashboard →": "فتح لوحة إدارة غولدن سبريدز ←",
  "Unable to check login verification": "تعذّر التحقق من حالة تسجيل الدخول",
  "Could not check login status.": "تعذّر التحقق من حالة تسجيل الدخول.",
  "Previous session cleared. Sign in with your existing account.": "تم مسح الجلسة السابقة. سجّل الدخول باستخدام حسابك الحالي.",
  "Could not clear previous session:": "تعذّر مسح الجلسة السابقة:",
  "Sign out": "تسجيل الخروج",
  "Retry": "إعادة المحاولة",
  "Checking admin permissions...": "جارٍ التحقق من صلاحيات المسؤول...",
  "Admin access required": "مطلوب صلاحية المسؤول",
  "You are not authorized to manage rewards.": "ليست لديك صلاحية إدارة المكافآت.",
  "Return to My Wallet": "العودة إلى محفظتي",
  "GOLDEN SPREADS ADMIN": "إدارة غولدن سبريدز",
  "Loyalty management": "إدارة برنامج الولاء",
  "Signed in as": "تم تسجيل الدخول باسم",
  "Manage customers, record purchases, and confirm rewards.": "إدارة العملاء وتسجيل المشتريات وتأكيد المكافآت.",
  "My wallet": "محفظتي",
  "CUSTOMERS": "العملاء",
  "Find a Golden Member": "البحث عن عضو غولدن",
  "shown": "معروض",
  "Search name, email, phone or member ID": "ابحث بالاسم أو البريد الإلكتروني أو الهاتف أو رقم العضوية",
  "Searching...": "جارٍ البحث...",
  "Search": "بحث",
  "No customer wallets found.": "لم يتم العثور على محافظ للعملاء.",
  "OFFLINE ORDER": "طلب خارج الإنترنت",
  "Record a completed purchase": "تسجيل عملية شراء مكتملة",
  "Select a customer, enter their eligible purchase amount, and choose the order channel. Delivery is excluded. The system calculates points and generates a unique order reference automatically.": "اختر عميلاً، وأدخل قيمة مشترياته المؤهلة، وحدّد قناة الطلب. لا تُحتسب رسوم التوصيل. يحسب النظام النقاط وينشئ مرجع طلب فريداً تلقائياً.",
  "This purchase has already been confirmed by the server. Do not submit it again. Clear the completed purchase notice below to start another purchase.": "تم تأكيد عملية الشراء هذه من الخادم مسبقاً. لا ترسلها مرة أخرى. امسح إشعار اكتمال الشراء أدناه لبدء عملية جديدة.",
  "A purchase is pending. Its details and unique reference have been saved in this browser. Use the button below to retry the same purchase. Do not change the customer or purchase details, and do not create another purchase until this one is resolved.": "هناك عملية شراء معلّقة. تم حفظ تفاصيلها ومرجعها الفريد في هذا المتصفح. استخدم الزر أدناه لإعادة محاولة العملية نفسها. لا تغيّر العميل أو تفاصيل الشراء، ولا تنشئ عملية أخرى قبل معالجة هذه العملية.",
  "Clear completed purchase notice": "مسح إشعار اكتمال الشراء",
  "Selected member": "العضو المحدّد",
  "Select a customer above": "اختر عميلاً من القائمة أعلاه",
  "Eligible product total (USD)": "إجمالي قيمة المنتجات المؤهلة (دولار)",
  "Order channel": "قناة الطلب",
  "WhatsApp": "واتساب",
  "Instagram": "إنستغرام",
  "Phone": "الهاتف",
  "In person": "مباشرةً",
  "Other": "أخرى",
  "Note": "ملاحظة",
  "For example: 2 Creamy + 1 Crunchy": "مثال: 2 كريمي + 1 مقرمش",
  "Order reference: automatically generated when you confirm the purchase.": "مرجع الطلب: يتم إنشاؤه تلقائياً عند تأكيد عملية الشراء.",
  "Recording purchase...": "جارٍ تسجيل عملية الشراء...",
  "Retry pending purchase safely": "إعادة محاولة عملية الشراء المعلّقة بأمان",
  "Confirm purchase and award points": "تأكيد الشراء وإضافة النقاط",
  "CUSTOMER REWARDS": "مكافآت العملاء",
  "Issued reward codes": "رموز المكافآت الصادرة",
  "pending": "معلّق",
  "No active reward codes awaiting confirmation.": "لا توجد رموز مكافآت فعّالة بانتظار التأكيد.",
  "off · Expires": "خصم · تنتهي الصلاحية",
  "Mark used": "تأكيد الاستخدام",
  "ACCOUNT MANAGEMENT": "إدارة الحسابات",
  "Manage customer accounts": "إدارة حسابات العملاء",
  "Registered customers, including users without wallets. Use the search above to find an account.": "العملاء المسجّلون، بمن فيهم المستخدمون الذين لا يملكون محافظ. استخدم البحث أعلاه للعثور على حساب.",
  "No registered accounts found.": "لم يتم العثور على حسابات مسجّلة.",
  "No Golden Wallet created yet": "لم يتم إنشاء محفظة غولدن بعد",
  "Email:": "البريد الإلكتروني:",
  "Verified": "تم التحقق",
  "Not verified": "لم يتم التحقق",
  "Delete customer": "حذف العميل",
  "PERMANENT ACCOUNT DELETION": "حذف الحساب نهائياً",
  "Delete": "حذف",
  "this customer": "هذا العميل",
  "Member ID:": "رقم العضوية:",
  "No wallet created": "لم يتم إنشاء محفظة",
  "Current points:": "النقاط الحالية:",
  "This permanently deletes the customer's account, points, purchase history, and reward codes. It cannot be undone.": "سيؤدي هذا إلى حذف حساب العميل ونقاطه وسجل مشترياته ورموز مكافآته نهائياً. لا يمكن التراجع عن هذا الإجراء.",
  "Type DELETE to confirm": "اكتب DELETE للتأكيد",
  "Deleting customer...": "جارٍ حذف العميل...",
  "Permanently delete customer": "حذف العميل نهائياً",
  "Cancel deletion": "إلغاء الحذف",
  "Golden Rewards setup required": "يجب إعداد مكافآت غولدن",
  "Configure REACT_APP_NEON_AUTH_BASE_URL.": "يرجى إعداد REACT_APP_NEON_AUTH_BASE_URL.",
  "Authentication error": "خطأ في المصادقة",
  "Could not verify your session.": "تعذّر التحقق من جلستك.",
  "Please sign in first": "يرجى تسجيل الدخول أولاً",
  "Sign in using your administrator account.": "سجّل الدخول باستخدام حساب المسؤول.",
  "Go to sign in": "الانتقال إلى تسجيل الدخول",
  "Administrator permission denied.": "تم رفض صلاحية المسؤول.",
  "Administrator access required.": "مطلوب الوصول بصلاحية المسؤول.",
  "Could not load admin data.": "تعذّر تحميل بيانات لوحة الإدارة.",
  "Could not search customers.": "تعذّر البحث عن العملاء.",
  "This purchase was already confirmed by the server. Clear its completed notice before recording another purchase.": "تم تأكيد عملية الشراء هذه من الخادم مسبقاً. امسح إشعار اكتمالها قبل تسجيل عملية أخرى.",
  "Select a customer and enter the eligible purchase total.": "اختر عميلاً وأدخل إجمالي قيمة الشراء المؤهلة.",
  "The purchase was recorded successfully, but the browser could not clear its recovery record. Do not submit it again. Clear the completed purchase notice below after checking the wallet.": "تم تسجيل عملية الشراء بنجاح، لكن المتصفح لم يتمكن من مسح سجل الاستعادة. لا ترسلها مرة أخرى. تحقّق من المحفظة ثم امسح إشعار اكتمال الشراء أدناه.",
  "Purchase recorded successfully!": "تم تسجيل عملية الشراء بنجاح!",
  "points added to": "نقطة أُضيفت إلى",
  "New balance:": "الرصيد الجديد:",
  "Order reference:": "مرجع الطلب:",
  "Purchase saved successfully, but the customer list did not refresh.": "تم حفظ عملية الشراء بنجاح، لكن قائمة العملاء لم يتم تحديثها.",
  "This purchase reference has already been recorded. The server did not award points again. Check the customer wallet and purchase history before recording another purchase.": "تم تسجيل مرجع عملية الشراء هذه مسبقاً. لم يضف الخادم النقاط مرة أخرى. تحقّق من محفظة العميل وسجل المشتريات قبل تسجيل عملية جديدة.",
  "The purchase was rejected and was not recorded.": "تم رفض عملية الشراء ولم يتم تسجيلها.",
  "The purchase details and reference are saved in this browser. Retry the same pending purchase; do not create a new one.": "تم حفظ تفاصيل الشراء ومرجعه في هذا المتصفح. أعد محاولة عملية الشراء المعلّقة نفسها، ولا تنشئ عملية جديدة.",
  "Could not save the purchase recovery record.": "تعذّر حفظ سجل استعادة عملية الشراء.",
  "Could not clear the completed purchase notice from browser storage. Do not submit this purchase again.": "تعذّر مسح إشعار اكتمال الشراء من مساحة تخزين المتصفح. لا ترسل عملية الشراء هذه مرة أخرى.",
  "Completed purchase notice cleared. You can record the next purchase.": "تم مسح إشعار اكتمال الشراء. يمكنك تسجيل عملية الشراء التالية.",
  "Could not confirm reward code.": "تعذّر تأكيد رمز المكافأة.",
  "Resolve the pending purchase before deleting a customer account.": "عالج عملية الشراء المعلّقة قبل حذف حساب عميل.",
  "You cannot delete your administrator account.": "لا يمكنك حذف حساب المسؤول الخاص بك.",
  "Customer deleted, but the list could not refresh. Reload the page.": "تم حذف العميل، لكن تعذّر تحديث القائمة. أعد تحميل الصفحة.",
  "Customer deletion failed.": "فشل حذف العميل.",
  "Delete this customer permanently?": "هل تريد حذف هذا العميل نهائياً؟",
  "Delete this customer?": "هل تريد حذف هذا العميل؟",
  "Email": "البريد الإلكتروني",
  "points balance": "رصيد النقاط",
  "pts": "نقطة",
  "Loading...": "جارٍ التحميل...",
  "Checking your account...": "جارٍ التحقق من حسابك...",
  "Try again": "حاول مجدداً",
  "Hi 👋 I’m the Golden Spreads assistant. How can I help you?": "مرحباً 👋 أنا مساعد غولدن سبريدز. كيف يمكنني مساعدتك؟",
  "🥜 Products": "🥜 المنتجات",
  "What products do you have?": "ما المنتجات المتوفرة لديكم؟",
  "💰 Prices": "💰 الأسعار",
  "What are your prices?": "ما أسعار منتجاتكم؟",
  "🧪 Lab Testing": "🧪 الفحوصات المخبرية",
  "Are your products lab tested?": "هل تخضع منتجاتكم لفحوصات مخبرية؟",
  "🚚 Delivery": "🚚 التوصيل",
  "Do you deliver?": "هل توفّرون خدمة التوصيل؟",
  "📲 Order": "📲 الطلب",
  "How can I order?": "كيف يمكنني الطلب؟",
  "Open Golden Spreads chatbot": "فتح محادثة غولدن سبريدز",
  "Golden Bot": "مساعد غولدن",
  "Ask Golden Bot...": "اسأل مساعد غولدن...",
  "Send": "إرسال",
  "Ask me anything about Golden Spreads 😊": "اسألني أي شيء عن غولدن سبريدز 😊",
  "You're very welcome 💛": "أهلاً وسهلاً بك 💛",
  "Anytime! 🥜💛": "في أي وقت! 🥜💛",
  "Happy to help 😊": "يسعدني أن أساعدك 😊",
  "My pleasure! 💛": "بكل سرور! 💛",
  "See you soon! 👋🥜": "إلى اللقاء قريباً! 👋🥜",
  "Bye! 💛 Thanks for visiting Golden Spreads.": "وداعاً! 💛 شكراً لزيارتك غولدن سبريدز.",
  "Have a great day! 🥜💛": "نتمنى لك يوماً رائعاً! 🥜💛",
  "I'm doing great 😄 Thanks for asking! What would you like to know about Golden Spreads?": "أنا بخير 😄 شكراً لسؤالك! ماذا تريد أن تعرف عن غولدن سبريدز؟",
  "Hi 👋 Welcome to Golden Spreads! How can I help you today?": "مرحباً 👋 أهلاً بك في غولدن سبريدز! كيف يمكنني مساعدتك اليوم؟",
  "Hello 🥜 Ask me anything about Golden Spreads!": "أهلاً 🥜 اسألني أي شيء عن غولدن سبريدز!",
  "Hey! 💛 How can Golden Bot help you?": "أهلاً! 💛 كيف يمكن لمساعد غولدن أن يساعدك؟",
  "You can order Golden Spreads directly through WhatsApp 📲 Choose the flavor you want, then click the WhatsApp button on our website to complete your order.": "يمكنك طلب منتجات غولدن سبريدز مباشرةً عبر واتساب 📲 اختر النكهة التي تريدها، ثم اضغط على زر واتساب في موقعنا لإكمال طلبك.",
  "Delivery details depend on your location 🚚 Message us on WhatsApp and we'll confirm the available delivery options and cost.": "تعتمد تفاصيل التوصيل على موقعك 🚚 راسلنا عبر واتساب وسنؤكد لك خيارات التوصيل المتاحة وكلفتها.",
  "All current prices are displayed directly on our product cards 🏷️ Choose a flavor in the Products section to see its price.": "تظهر الأسعار الحالية مباشرةً على بطاقات المنتجات 🏷️ اختر نكهة من قسم المنتجات لمعرفة سعرها.",
  "Yes 🧪 A Golden Spreads peanut butter sample underwent microbiological testing at the Food Safety Laboratories of the Chamber of Commerce, Industry & Agriculture in Sidon and South Lebanon. You can view the report in our Quality & Safety section.": "نعم 🧪 خضعت عيّنة من زبدة الفول السوداني من غولدن سبريدز لفحوصات ميكروبيولوجية في مختبرات سلامة الغذاء التابعة لغرفة التجارة والصناعة والزراعة في صيدا والجنوب. يمكنك الاطلاع على التقرير في قسم الجودة والسلامة.",
  "According to the microbiological report, Salmonella was absent in the tested peanut butter sample ✅ You can view the full report in our Quality & Safety section.": "وفقاً للتقرير الميكروبيولوجي، لم تُسجّل السالمونيلا في عيّنة زبدة الفول السوداني التي خضعت للفحص ✅ يمكنك الاطلاع على التقرير الكامل في قسم الجودة والسلامة.",
  "The microbiological report recorded E. coli at < 10 CFU/g for the tested peanut butter sample ✅": "سجّل التقرير الميكروبيولوجي مستوى الإشريكية القولونية بأقل من 10 وحدات مكوّنة للمستعمرات/غرام في عيّنة زبدة الفول السوداني التي خضعت للفحص ✅",
  "The microbiological report recorded total coliforms at < 10 CFU/g for the tested peanut butter sample ✅": "سجّل التقرير الميكروبيولوجي مستوى القولونيات الكلية بأقل من 10 وحدات مكوّنة للمستعمرات/غرام في عيّنة زبدة الفول السوداني التي خضعت للفحص ✅",
  "The microbiological report recorded an anaerobic count of 10 CFU/g for the tested peanut butter sample ✅": "سجّل التقرير الميكروبيولوجي عدداً لاهوائياً قدره 10 وحدات مكوّنة للمستعمرات/غرام في عيّنة زبدة الفول السوداني التي خضعت للفحص ✅",
  "We offer different Golden Spreads peanut butter flavors 🥜 Check our Products section to see the available options, ingredients, nutrition information, and prices.": "نقدّم نكهات متنوعة من زبدة الفول السوداني من غولدن سبريدز 🥜 تفقّد قسم المنتجات للاطلاع على الخيارات المتاحة والمكوّنات والمعلومات الغذائية والأسعار.",
  "Ingredients vary by flavor 🌱 You'll find the exact ingredient list directly on each Golden Spreads product card.": "تختلف المكوّنات بحسب النكهة 🌱 ستجد قائمة المكوّنات الدقيقة على بطاقة كل منتج من غولدن سبريدز.",
  "Nutrition values differ between flavors 💪 Check the product card for calories, protein, carbohydrates, fats, and other available nutrition information.": "تختلف القيم الغذائية بين النكهات 💪 راجع بطاقة المنتج لمعرفة السعرات الحرارية والبروتين والكربوهيدرات والدهون وغيرها من المعلومات الغذائية المتاحة.",
  "Sugar content depends on the flavor 🌿 Check the ingredients and nutrition information on the specific product card for the exact details.": "تعتمد كمية السكر على النكهة 🌿 راجع المكوّنات والمعلومات الغذائية على بطاقة المنتج المحدّد لمعرفة التفاصيل.",
  "For keto or low-carb diets, check the carbohydrates and sugar information of the specific flavor 💪 Different Golden Spreads products may have different nutrition values.": "إذا كنت تتبع نظام الكيتو أو نظاماً منخفض الكربوهيدرات، فتحقّق من معلومات الكربوهيدرات والسكر للنكهة المحدّدة 💪 قد تختلف القيم الغذائية بين منتجات غولدن سبريدز.",
  "Peanuts are naturally plant-based 🌱, but ingredients can vary between flavors. Check the ingredient list of the specific product to confirm.": "الفول السوداني نباتي بطبيعته 🌱، لكن المكوّنات قد تختلف بين النكهات. راجع قائمة مكوّنات المنتج المحدّد للتأكد.",
  "Peanuts are naturally gluten-free 🥜, but some flavored products may contain ingredients with gluten. Check the ingredient list of the specific flavor.": "الفول السوداني خالٍ من الغلوتين بطبيعته 🥜، لكن بعض المنتجات المنكّهة قد تحتوي على مكوّنات فيها غلوتين. راجع قائمة مكوّنات النكهة المحدّدة.",
  "⚠️ Golden Spreads peanut butter contains peanuts. If you have any food allergy, carefully review the complete ingredient information before consuming the product.": "⚠️ تحتوي زبدة الفول السوداني من غولدن سبريدز على الفول السوداني. إذا كنت تعاني من أي حساسية غذائية، فراجع معلومات المكوّنات كاملةً بعناية قبل تناول المنتج.",
  "Check the ingredient list of the specific Golden Spreads flavor for its exact oil and ingredient information 🌱": "راجع قائمة مكوّنات نكهة غولدن سبريدز المحدّدة لمعرفة نوع الزيت والمكوّنات بالتفصيل 🌱",
  "Keep the jar properly closed and follow the storage instructions written on your Golden Spreads jar 🥜": "أغلق المرطبان بإحكام واتبع تعليمات التخزين المكتوبة على مرطبان غولدن سبريدز 🥜",
  "Natural oil separation can happen in peanut butter 🥜 Simply stir it well until the texture becomes even again.": "قد ينفصل الزيت طبيعياً في زبدة الفول السوداني 🥜 حرّكها جيداً حتى يعود قوامها متجانساً.",
  "Please check the production and expiry information on your Golden Spreads jar 📅 For questions about a specific batch, contact us directly on WhatsApp.": "يرجى التحقق من تاريخ الإنتاج وانتهاء الصلاحية على مرطبان غولدن سبريدز 📅 للاستفسار عن دفعة محدّدة، تواصل معنا مباشرةً عبر واتساب.",
  "Pickup arrangements can be confirmed directly with us on WhatsApp 📍": "يمكن تأكيد ترتيبات الاستلام مباشرةً معنا عبر واتساب 📍",
  "For our current pickup location or delivery arrangements, contact us directly through WhatsApp 📍": "لمعرفة موقع الاستلام الحالي أو ترتيبات التوصيل، تواصل معنا مباشرةً عبر واتساب 📍",
  "Payment details are confirmed when you place your order through WhatsApp 💳📲": "يتم تأكيد تفاصيل الدفع عند تقديم طلبك عبر واتساب 💳📲",
  "Because Golden Spreads products are prepared in small batches, availability can change 🥜 Message us on WhatsApp to confirm the flavor you want.": "لأن منتجات غولدن سبريدز تُحضّر على دفعات صغيرة، قد تتغيّر الكميات المتاحة 🥜 راسلنا عبر واتساب للتأكد من توافر النكهة التي تريدها.",
  "Golden Spreads is delicious with toast, oats, bananas, pancakes, smoothies, baking, desserts — or straight from the spoon 🥄🥜": "زبدة غولدن سبريدز لذيذة مع التوست والشوفان والموز والبان كيك والسموذي والحلويات — أو مباشرةً من الملعقة 🥄🥜",
  "Golden Spreads peanut butter is prepared in small batches with a focus on freshness, quality, and great taste 🥜💛": "تُحضّر زبدة الفول السوداني من غولدن سبريدز على دفعات صغيرة مع التركيز على الطزاجة والجودة والمذاق الرائع 🥜💛",
  "Of course 😊 You can contact Golden Spreads directly through the WhatsApp button on our website.": "بالتأكيد 😊 يمكنك التواصل مع غولدن سبريدز مباشرةً عبر زر واتساب الموجود على موقعنا.",
  "Thank you so much! 💛 We're really happy you enjoyed Golden Spreads 🥜": "شكراً جزيلاً! 💛 يسعدنا جداً أنك استمتعت بمنتجات غولدن سبريدز 🥜",
  "That means a lot to us 💛 Thanks for supporting Golden Spreads!": "هذا يعني لنا الكثير 💛 شكراً لدعمك غولدن سبريدز!",
  "We're so happy to hear that 😍🥜": "يسعدنا جداً سماع ذلك 😍🥜",
  "I’m not completely sure I understood that 😊 I can help with products, prices, ingredients, nutrition, allergens, laboratory testing, ordering, delivery, storage, or availability. You can also contact us directly on WhatsApp 📲": "لست متأكداً تماماً من أنني فهمت قصدك 😊 يمكنني مساعدتك بشأن المنتجات والأسعار والمكوّنات والقيم الغذائية ومسببات الحساسية والفحوصات المخبرية والطلبات والتوصيل والتخزين والتوافر. ويمكنك أيضاً التواصل معنا مباشرةً عبر واتساب 📲",
  "Customer": "العميل",
  "customer": "العميل",
  "customers": "العملاء",
  "Member ID": "رقم العضوية",
  "Current points": "النقاط الحالية",
  "Expires": "تنتهي الصلاحية",
  "off": "خصم",
  "New balance": "الرصيد الجديد",
  "Order reference": "مرجع الطلب",
  "Hello": "مرحباً",
  "Total": "الإجمالي",
  "Available": "المتاح",
  "Cancel": "إلغاء",
  "Name": "الاسم",
  "Address": "العنوان",
  "optional": "اختياري",
  "Loading": "جارٍ التحميل",
  "Checking": "جارٍ التحقق",
  "Create account": "إنشاء حساب",
  "Full name": "الاسم الكامل",
  "Email address": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Six-digit verification code": "رمز التحقق المؤلف من ستة أرقام",
  "Resend verification code": "إعادة إرسال رمز التحقق",
  "Your account password": "كلمة مرور حسابك",
  "Back to sign in": "العودة إلى تسجيل الدخول",
  "Your Golden Wallet is protected with secure email verification.": "محفظة غولدن الخاصة بك محمية من خلال التحقق الآمن عبر البريد الإلكتروني.",
  "Confirm password": "تأكيد كلمة المرور",
  "Six-digit login code": "رمز تسجيل الدخول المؤلف من ستة أرقام",
  "Resend login code": "إعادة إرسال رمز تسجيل الدخول",
  "Preparing your Golden Wallet...": "جارٍ تجهيز محفظة غولدن الخاصة بك...",
  "Earn 10 points for every $1 spent on eligible Golden Spreads products.": "اكسب 10 نقاط مقابل كل دولار تنفقه على منتجات غولدن سبريدز المؤهلة.",
  "A reward code is valid for 30 days and must be confirmed by Golden Spreads before it is used.": "رمز المكافأة صالح لمدة 30 يوماً، ويجب أن تؤكد غولدن سبريدز صلاحيته قبل استخدامه.",
  "Return to sign in": "العودة إلى تسجيل الدخول",
  "You don't have any active reward codes yet.": "ليس لديك أي رموز مكافآت فعّالة حتى الآن.",
  "discount · Expires": "خصم · تنتهي الصلاحية",
  "Return to Golden Rewards": "العودة إلى مكافآت غولدن",
  "Switch language to Arabic": "تغيير اللغة إلى العربية",
  "Switch language to English": "تغيير اللغة إلى الإنجليزية",
  "Slider controls": "أدوات التحكم بالشريط",
  "Another purchase is already pending in this browser. Refresh the admin page and resolve that purchase first.": "هناك عملية شراء أخرى معلّقة في هذا المتصفح. أعد تحميل صفحة الإدارة وعالج عملية الشراء أولاً.",
  "A previous purchase recovery record could not be read. Do not submit another purchase until this is resolved.": "تعذّر قراءة سجل استعادة عملية شراء سابقة. لا ترسل عملية شراء أخرى قبل حل هذه المشكلة.",
  "Your browser could not save the pending purchase. No purchase request was sent. Check that browser storage is enabled and try again.": "لم يتمكن المتصفح من حفظ عملية الشراء المعلّقة. لم يُرسل أي طلب شراء. تأكد من تفعيل مساحة تخزين المتصفح ثم حاول مجدداً.",
  "Another purchase is already pending": "هناك عملية شراء أخرى معلّقة",
  "previous purchase recovery record": "سجل استعادة عملية شراء سابقة",
  "The server did not confirm the purchase.": "لم يؤكد الخادم عملية الشراء.",
  "Apply": "طبّق",
  "discount to the customer's offline order.": "خصماً على طلب العميل المسجّل خارج الإنترنت.",
  "The server did not confirm deletion.": "لم يؤكد الخادم عملية الحذف.",
  "Customer:": "العميل:",
  "This deletes the login account, wallet, points, purchase history and reward codes.": "سيؤدي ذلك إلى حذف حساب تسجيل الدخول والمحفظة والنقاط وسجل المشتريات ورموز المكافآت.",
  "This action cannot be undone.": "لا يمكن التراجع عن هذا الإجراء.",
  "deleted successfully.": "حُذف بنجاح.",
  "confirmed.": "تم تأكيده.",
  "Apply $": "تطبيق خصم $",
  "points.": "نقطة.",
  "purchase": "عملية شراء",
  "redemption": "استبدال مكافأة",
  "points_awarded": "نقاط مكتسبة",
  "reward_redemption": "استبدال مكافأة",
  "bonus": "نقاط إضافية",
  "discount": "خصم",
  "Valid until": "صالح حتى",
  "Member": "العضو",
  "Welcome": "مرحباً",
  "Checking login security...": "جارٍ التحقق من أمان تسجيل الدخول...",
  "Please sign in again.": "يرجى تسجيل الدخول مجدداً.",
  "Unable to clear previous session": "تعذّر مسح الجلسة السابقة",
  "Could not clear previous session": "تعذّر مسح الجلسة السابقة",
  "Enter the new verification code sent to your email.": "أدخل رمز التحقق الجديد الذي أُرسل إلى بريدك الإلكتروني.",
  "Confirm your login": "أكّد تسجيل الدخول",
  "Golden Spreads community photo": "صورة من مجتمع غولدن سبريدز",
  "Manage customers,": "إدارة العملاء،",
  "record purchases, and confirm rewards.": "وتسجيل المشتريات وتأكيد المكافآت.",
  "This purchase has already been confirmed by the server.": "تم تأكيد عملية الشراء هذه من الخادم مسبقاً.",
  "Do not submit it again.": "لا ترسلها مرة أخرى.",
  "Clear the completed purchase notice": "امسح إشعار اكتمال الشراء",
  "below to start another purchase.": "أدناه لبدء عملية شراء أخرى.",
  "A purchase is pending.": "هناك عملية شراء معلّقة.",
  "Its details and unique reference have been saved in this browser.": "تم حفظ تفاصيلها ومرجعها الفريد في هذا المتصفح.",
  "Use the button below to retry the same purchase.": "استخدم الزر أدناه لإعادة محاولة عملية الشراء نفسها.",
  "Do not change the customer or purchase details, and do not create another purchase until this one is resolved.": "لا تغيّر العميل أو تفاصيل الشراء، ولا تنشئ عملية أخرى قبل معالجة هذه العملية.",
  "GOLDEN SPREADS": "غولدن سبريدز",
  "THE GOLDEN COLLECTION": "مجموعة غولدن",
  "/ SIGNATURE SPREADS": "/ خلطات مميّزة",
  "< 10 CFU/g": "أقل من 10 وحدات مكوّنة للمستعمرات/غرام",
  "10 CFU/g": "10 وحدات مكوّنة للمستعمرات/غرام",
  "Golden Spreads started as a simple homemade experiment — roasting peanuts, testing textures, and chas.ing the perfect spoonful. Every jar is made in small batches using clean ingredients Golden peanut butter Spreads, done right.": "بدأت غولدن سبريدز كتجربة منزلية بسيطة: تحميص الفول السوداني، واختبار القوام، والبحث عن الملعقة المثالية. نحضّر كل مرطبان على دفعات صغيرة باستخدام مكوّنات مختارة بعناية، لنقدّم زبدة فول سوداني كما يجب أن تكون.",
  "Back to Golden Spreads": "العودة إلى غولدن سبريدز",
  "Worth $": "تعادل قيمتها $",
  ". Manage customers, record purchases, and confirm rewards.": ". إدارة العملاء وتسجيل المشتريات وتأكيد المكافآت.",
  "Invalid wallet response from the server.": "استجابة غير صالحة للمحفظة من الخادم.",
  "Unable to clear previous session:": "تعذّر مسح الجلسة السابقة:"
};

const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function translateText(source, language) {
  if (language !== "ar" || !source || !/[A-Za-z]/.test(source)) return source;

  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  const core = source.slice(leading.length, source.length - trailing.length || undefined);
  const key = normalize(core);

  if (!key) return source;
  if (Object.prototype.hasOwnProperty.call(translations, key)) {
    return leading + translations[key] + trailing;
  }

  // Translate known phrases inside dynamic messages, without changing
  // email addresses, URLs, IDs, codes, prices, or numeric values.
  const protectedValues = [];
  let result = core.replace(
    /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/\S+)/gi,
    (match) => {
      const token = `GSXPROTECTED${protectedValues.length}X`;
      protectedValues.push([token, match]);
      return token;
    }
  );

  const entries = Object.entries(translations)
    .filter(([english]) => english.length >= 4 && /[A-Za-z]/.test(english))
    .sort((a, b) => b[0].length - a[0].length);

  for (const [english, arabic] of entries) {
    const pattern = new RegExp(
      `(^|[^A-Za-z0-9])(${escapeRegExp(english)})(?=$|[^A-Za-z0-9])`,
      "gi"
    );
    result = result.replace(pattern, (_match, prefix) => prefix + arabic);
  }

  for (const [token, original] of protectedValues) {
    result = result.replace(token, original);
  }

  return leading + result + trailing;
}

const textRecords = new WeakMap();
const attributeRecords = new WeakMap();

function translateTextNode(node, language) {
  const current = node.nodeValue;
  if (!current || !current.trim()) return;

  let record = textRecords.get(node);
  if (!record) {
    record = { source: current, translated: null };
    textRecords.set(node, record);
  } else if (current !== record.translated) {
    // React changed the original text since the previous translation pass.
    record.source = current;
  }

  const next = translateText(record.source, language);
  record.translated = next;
  if (current !== next) node.nodeValue = next;
}

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"];

function translateAttribute(element, attribute, language) {
  const current = element.getAttribute(attribute);
  if (current == null || !current.trim()) return;

  let records = attributeRecords.get(element);
  if (!records) {
    records = new Map();
    attributeRecords.set(element, records);
  }

  let record = records.get(attribute);
  if (!record) {
    record = { source: current, translated: null };
    records.set(attribute, record);
  } else if (current !== record.translated) {
    record.source = current;
  }

  const next = translateText(record.source, language);
  record.translated = next;
  if (current !== next) element.setAttribute(attribute, next);
}

function scanElement(root, language) {
  if (!root) return;

  const visit = (element) => {
    if (element.nodeType !== Node.ELEMENT_NODE) return;
    const tag = element.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return;

    TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
      if (element.hasAttribute(attribute)) {
        translateAttribute(element, attribute, language);
      }
    });

    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        translateTextNode(child, language);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        visit(child);
      }
    }
  };

  if (root.nodeType === Node.ELEMENT_NODE) visit(root);
  else if (root.nodeType === Node.TEXT_NODE) translateTextNode(root, language);
}

function TranslationObserver({ language }) {
  useEffect(() => {
    if (!document.body) return undefined;

    scanElement(document.body, language);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target, language);
          continue;
        }

        if (mutation.type === "attributes") {
          translateAttribute(mutation.target, mutation.attributeName, language);
          continue;
        }

        mutation.addedNodes.forEach((node) => scanElement(node, language));
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === "ar" ? "ar" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    const isArabic = language === "ar";
    document.documentElement.lang = language;
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.body.classList.toggle("gs-language-ar", isArabic);
    document.body.classList.toggle("gs-language-en", !isArabic);

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The site remains usable when browser storage is unavailable.
    }

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        isArabic
          ? "غولدن سبريدز — زبدة فول سوداني محضّرة بعناية ومكوّنات بسيطة."
          : "Golden Spreads - Homemade peanut butter showcase"
      );
    }

    document.title = isArabic
      ? "غولدن سبريدز | زبدة الفول السوداني"
      : "Golden Spreads";
  }, [language]);

  const value = useMemo(() => ({
    language,
    isArabic: language === "ar",
    setLanguage,
    toggleLanguage: () => setLanguage((current) => current === "en" ? "ar" : "en"),
    t: (text) => translateText(text, language),
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      <TranslationObserver language={language} />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
}

export { translateText };
