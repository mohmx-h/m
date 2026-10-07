/* بيانات الموقع الحالية (Seed + Fallback) — مستخرجة من index.html و projects.html بدون أي تعديل في المحتوى */
export const SEED_CATEGORIES = [
 {
  "id": "cat1",
  "name": "الثورات اليمنية",
  "order": 1,
  "visible": true
 },
 {
  "id": "cat2",
  "name": "تعليم",
  "order": 2,
  "visible": true
 },
 {
  "id": "cat3",
  "name": "ابرز الشهداء",
  "order": 3,
  "visible": true
 },
 {
  "id": "cat4",
  "name": "توعية",
  "order": 4,
  "visible": true
 },
 {
  "id": "cat5",
  "name": "آثار القات على الفرد والمجتمع",
  "order": 5,
  "visible": true
 },
 {
  "id": "cat6",
  "name": "نصائح",
  "order": 6,
  "visible": true
 },
 {
  "id": "cat7",
  "name": "ثقافة",
  "order": 7,
  "visible": true
 },
 {
  "id": "cat8",
  "name": "كلمة للشعب",
  "order": 8,
  "visible": true
 },
 {
  "id": "cat9",
  "name": "تصحيح معتقدات",
  "order": 9,
  "visible": true
 },
 {
  "id": "cat10",
  "name": "معلومات زائفه",
  "order": 10,
  "visible": true
 },
 {
  "id": "cat11",
  "name": "عادات سيئة",
  "order": 11,
  "visible": true
 },
 {
  "id": "cat12",
  "name": "محتوى متنوع",
  "order": 12,
  "visible": true
 },
 {
  "id": "cat13",
  "name": "اغلى المهور",
  "order": 13,
  "visible": true
 },
 {
  "id": "cat14",
  "name": "اليمن",
  "order": 14,
  "visible": true
 },
 {
  "id": "cat15",
  "name": "مسلسلات يمنيه",
  "order": 15,
  "visible": true
 },
 {
  "id": "cat16",
  "name": "رواتب",
  "order": 16,
  "visible": true
 },
 {
  "id": "cat17",
  "name": "رتب عسكرية",
  "order": 17,
  "visible": true
 },
 {
  "id": "cat18",
  "name": "المنتخب اليمني",
  "order": 18,
  "visible": true
 },
 {
  "id": "cat19",
  "name": "كرة القدم",
  "order": 19,
  "visible": true
 },
 {
  "id": "cat20",
  "name": "قصة اصابتي",
  "order": 20,
  "visible": true
 },
 {
  "id": "cat21",
  "name": "المقاومه الشعبية",
  "order": 21,
  "visible": true
 },
 {
  "id": "cat22",
  "name": "شواطئ يمنية",
  "order": 22,
  "visible": true
 },
 {
  "id": "cat23",
  "name": "تحذيري",
  "order": 23,
  "visible": true
 }
];
export const SEED_VIDEOS = [
 {
  "id": "p1",
  "title": "ثورة الـ ٢٦ من سبتمبر",
  "url": "https://www.tiktok.com/@mohomx/video/7683553010122771732",
  "platform": "TikTok",
  "image": "./img/m1.jpg",
  "year": "2026",
  "order": 1,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat1",
  "categoryIds": [
   "cat2",
   "cat3"
  ],
  "description": "في هذا الفيديو نسلّط الضوء على أبرز شهداء ثورة 26 سبتمبر، ونتذكر أسماء رجال قدّموا تضحيات كبيرة في سبيل الثورة والجمهورية، ونتعرف على جانب من قصصهم ومواقفهم ودورهم في تلك المرحلة المهمة من تاريخ اليمن. نستعرض محطات من حياتهم وما قدّموه، ونستذكر تضحياتهم التي بقيت حاضرة في ذاكرة اليمنيين، مع التوقف عند بعض الأحداث والمواقف التي ارتبطت بهم وبثورة 26 سبتمبر. هذا الفيديو محاولة للتعريف بهم وإحياء ذكراهم، حتى تبقى قصصهم وتضحياتهم معروفة للأجيال القادمة.",
  "icon": "fa-brands fa-tiktok",
  "category": "الثورات اليمنية"
 },
 {
  "id": "p2",
  "title": "ماذا أخذ القات من اليمنيين ؟",
  "url": "https://www.tiktok.com/@mohomx/video/7682048575198579989",
  "platform": "TikTok",
  "image": "./img/m3.jpg",
  "year": "2026",
  "order": 2,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat4",
  "categoryIds": [
   "cat5",
   "cat6"
  ],
  "description": "في هذا الفيديو نتحدث عن تأثير القات على حياة اليمنيين، ونتوقف عند بعض الجوانب التي ارتبطت بانتشاره في المجتمع، من الوقت والمال إلى العادات اليومية والعلاقات الاجتماعية. نستعرض كيف أصبح القات جزءًا من حياة الكثير من الناس، وما الذي قد يخسره الفرد والمجتمع بسببه، مع طرح الموضوع بطريقة بسيطة ومباشرة تساعد على التفكير في العادات التي نمارسها وتأثيرها على حياتنا ومستقبلنا.",
  "icon": "fa-brands fa-tiktok",
  "category": "توعية"
 },
 {
  "id": "p3",
  "title": "ابطال ثورة 14 اكتوبر",
  "url": "https://youtube.com/shorts/WchZAp_O6rM?si=N312XzvcluGHqDiT",
  "platform": "YouTube",
  "image": "./img/m2.jpg",
  "year": "2026",
  "order": 3,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat1",
  "categoryIds": [
   "cat7"
  ],
  "description": "في هذا الفيديو نسلّط الضوء على أبرز أبطال وقيادات ثورة 14 أكتوبر، ونتعرّف على رجال كان لهم دور بارز في مقاومة الاستعمار البريطاني والمشاركة في مسيرة الثورة. نستعرض جانبًا من قصصهم ومواقفهم، ونتوقف عند بعض المحطات المهمة التي ارتبطت بهم وبالثورة، ونتعرّف على تضحياتهم والجهود التي بذلوها في سبيل التحرر والاستقلال. هذا الفيديو محاولة للتعريف بأبرز الشخصيات التي ارتبط اسمها بثورة 14 أكتوبر، واستحضار صفحات من تاريخ اليمن الحديث للأجيال القادمة.",
  "icon": "fa-brands fa-youtube",
  "category": "الثورات اليمنية"
 },
 {
  "id": "p4",
  "title": "كلمة للشعب اليمني بمناسبة ثورة 26 سبتمبر",
  "url": "https://www.instagram.com/reel/DdwIJ0nqctI/",
  "platform": "Instagram",
  "image": "./img/klma.jpg",
  "year": "2026",
  "order": 4,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat1",
  "categoryIds": [
   "cat8"
  ],
  "description": "كلمة إلى الشعب اليمني بمناسبة الذكرى الـ٦٤ لثورة ٢٦ سبتمبر المجيدة، نستحضر فيها معاني الحرية والجمهورية، ونتذكر تضحيات الأجيال التي صنعت هذه المناسبة، مع رسالة للشعب اليمني تؤكد أهمية الحفاظ على قيم سبتمبر واستحضار دروس التاريخ، والأمل بمستقبل أفضل لليمن وأبنائه.",
  "icon": "fa-brands fa-instagram",
  "category": "الثورات اليمنية"
 },
 {
  "id": "p5",
  "title": "صحح معلوماتك عن اليمنيين",
  "url": "https://youtube.com/shorts/vATDcOdbpC4?si=cGs6QYSP9xSJ6qtZ",
  "platform": "YouTube",
  "image": "./img/shh.jpg",
  "year": "2026",
  "order": 5,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat4",
  "categoryIds": [
   "cat9",
   "cat10"
  ],
  "description": "صحّح معلوماتك عن اليمنيين، وتعرّف على حقائق ومعلومات قد تكون غائبة عنك حول تاريخ اليمن وشعبه وثقافته وهويته. محتوى يسلّط الضوء على جوانب مهمة من اليمن، ويصحح بعض المفاهيم والمعلومات المتداولة بطريقة مبسطة ومباشرة.",
  "icon": "fa-brands fa-youtube",
  "category": "توعية"
 },
 {
  "id": "p6",
  "title": "خرافات وعادات سيئة في اليمن",
  "url": "https://www.tiktok.com/@mohomx/video/7676861176206069013",
  "platform": "TikTok",
  "image": "./img/twaeh.jpg",
  "year": "2026",
  "order": 6,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat4",
  "categoryIds": [
   "cat11"
  ],
  "description": "خرافات وعادات سيئة في اليمن، نسلّط الضوء على بعض المعتقدات والعادات الاجتماعية التي انتشرت في بعض المناطق عبر الزمن، ونناقشها بطريقة بسيطة وموضوعية، مع توضيح ما يستند إلى حقيقة وما هو مجرد معتقد متوارث، بهدف زيادة الوعي وتشجيع التفكير والنقاش حول بعض الممارسات التي تحتاج إلى مراجعة.",
  "icon": "fa-brands fa-tiktok",
  "category": "توعية"
 },
 {
  "id": "p7",
  "title": "اغلى المحافظات اليمنيه بالمهور",
  "url": "https://youtube.com/shorts/pBs7dHAqJcU?si=oUdvxIvHrF-RT3Gv",
  "platform": "YouTube",
  "image": "./img/1.jpg",
  "year": "2026",
  "order": 7,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat12",
  "categoryIds": [
   "cat13",
   "cat14"
  ],
  "description": "أغلى المحافظات اليمنية بالمهور، نتعرّف على اختلاف عادات الزواج وتكاليف المهور من منطقة إلى أخرى، ونستعرض بعض الحالات والمبادرات المحلية التي تكشف تفاوت قيمة المهر بين المحافظات والمناطق اليمنية، مع التوقف عند أسباب ارتفاع المهور وتأثيرها على الشباب والزواج.",
  "icon": "fa-brands fa-youtube",
  "category": "محتوى متنوع"
 },
 {
  "id": "p8",
  "title": "أشهر المسلسلات اليمنية",
  "url": "https://www.instagram.com/reel/DbdmwufqnuN/?stkn=MXN2N2VjbXZsb3hocg==",
  "platform": "Instagram",
  "image": "./img/2.jpg",
  "year": "2026",
  "order": 8,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat12",
  "categoryIds": [
   "cat15"
  ],
  "description": "أشهر المسلسلات اليمنية التي تركت بصمة في ذاكرة المشاهد اليمني، نستعرض فيها أبرز الأعمال التي حققت حضورًا واسعًا، وتنوّعت بين الكوميديا والدراما والأعمال الاجتماعية والتراثية، مع التعرف على بعض الشخصيات والمواقف التي جعلت هذه المسلسلات حاضرة في ذاكرة الجمهور حتى اليوم.",
  "icon": "fa-brands fa-instagram",
  "category": "محتوى متنوع"
 },
 {
  "id": "p9",
  "title": "رواتب الموظفين اليمنيين",
  "url": "https://youtube.com/shorts/v2K-XVNBQhY?si=X4N1UQQ0TMF45r8b",
  "platform": "YouTube",
  "image": "./img/4.jpg",
  "year": "2026",
  "order": 9,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat12",
  "categoryIds": [
   "cat16"
  ],
  "description": "رواتب الموظفين اليمنيين، نستعرض واقع الأجور في اليمن والفروقات بين الوظائف والقطاعات، مع التعرف على متوسطات الرواتب وبعض الأمثلة من الوظائف الحكومية والخاصة، وكيف أثرت الظروف الاقتصادية وارتفاع الأسعار وتراجع القوة الشرائية للعملة على دخل الموظف اليمني ومعيشته. وتشير البيانات الرسمية إلى تفاوت كبير في الدخول بحسب القطاع والوظيفة، بينما شهد عام 2026 إجراءات لزيادة رواتب موظفي الدولة في مناطق الحكومة المعترف بها دوليًا.",
  "icon": "fa-brands fa-youtube",
  "category": "محتوى متنوع"
 },
 {
  "id": "p10",
  "title": "اقوى الرتب العسكرية في اليمن",
  "url": "https://www.tiktok.com/@mohomx/video/7677610012818328853",
  "platform": "TikTok",
  "image": "./img/5.jpg",
  "year": "2026",
  "order": 10,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat12",
  "categoryIds": [
   "cat17"
  ],
  "description": "من الملازم إلى المشير… تعرّف على تسلسل الرتب العسكرية في اليمن، وما تحمله كل رتبة من مسؤوليات ومهام ومكانة داخل المؤسسة العسكرية. نستعرض أبرز الرتب العسكرية وترتيبها من الأدنى إلى الأعلى، ونتعرف على الرموز والشارات التي تميّز كل رتبة، في جولة سريعة تكشف لك عالم الرتب العسكرية اليمنية بطريقة مبسطة وممتعة.",
  "icon": "fa-brands fa-tiktok",
  "category": "محتوى متنوع"
 },
 {
  "id": "p11",
  "title": "كم مرة فاز المنتخب اليمني",
  "url": "https://www.instagram.com/reel/DdtvvrdKlHE/?stkn=MWo0NHVtdjd6c2xuOQ==",
  "platform": "Instagram",
  "image": "./img/6.jpg",
  "year": "2026",
  "order": 11,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat12",
  "categoryIds": [
   "cat18",
   "cat19"
  ],
  "description": "أشهر المسلسلات اليمنية التي تركت بصمة في ذاكرة المشاهد اليمني، نستعرض فيها أبرز الأعمال التي حققت حضورًا واسعًا، وتنوّعت بين الكوميديا والدراما والأعمال الاجتماعية والتراثية، مع التعرف على بعض الشخصيات والمواقف التي جعلت هذه المسلسلات حاضرة في ذاكرة الجمهور حتى اليوم.",
  "icon": "fa-brands fa-instagram",
  "category": "محتوى متنوع"
 },
 {
  "id": "p12",
  "title": "قصتي من يوم الاصابة حتى اليوم",
  "url": "https://www.tiktok.com/@mohomx/video/7686514387988827413",
  "platform": "TikTok",
  "image": "./img/8.jpg",
  "year": "2026",
  "order": 12,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat20",
  "categoryIds": [
   "cat21"
  ],
  "description": "أروي في هذا الفيديو قصتي منذ يوم الإصابة، وما مررت به من أحداث وتحديات خلال تلك الفترة، وصولًا إلى اليوم. أحكي تفاصيل التجربة كما عشتها، من لحظة الإصابة وما تبعها من مراحل، إلى التغيّرات التي مررت بها والدروس التي تركتها هذه الرحلة في حياتي.",
  "icon": "fa-brands fa-tiktok",
  "category": "قصة اصابتي"
 },
 {
  "id": "p13",
  "title": "قصتي من يوم الاصابة حتى اليوم ( كاملة )",
  "url": "https://www.tiktok.com/@mohomx/video/7686888240611478805",
  "platform": "TikTok",
  "image": "./img/9.jpg",
  "year": "2026",
  "order": 13,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat20",
  "categoryIds": [
   "cat21"
  ],
  "description": "أروي في هذا الفيديو قصتي منذ يوم الإصابة، وما مررت به من أحداث وتحديات خلال تلك الفترة، وصولًا إلى اليوم. أحكي تفاصيل التجربة كما عشتها، من لحظة الإصابة وما تبعها من مراحل، إلى التغيّرات التي مررت بها والدروس التي تركتها هذه الرحلة في حياتي.",
  "icon": "fa-brands fa-tiktok",
  "category": "قصة اصابتي"
 },
 {
  "id": "p14",
  "title": "اجمل الشواطئ في اليمن",
  "url": "https://www.tiktok.com/@mohomx/video/7670934687480565013",
  "platform": "TikTok",
  "image": "./img/3.jpg",
  "year": "2026",
  "order": 14,
  "showOnHome": false,
  "showOnProjects": true,
  "visible": true,
  "categoryId": "cat12",
  "categoryIds": [
   "cat22"
  ],
  "description": "اكتشف أجمل الشواطئ في اليمن، من السواحل الهادئة ذات الرمال الذهبية إلى الشواطئ والجزر التي تتميز بمياهها الصافية وطبيعتها الساحرة. نستعرض مجموعة من الوجهات الساحلية المميزة في مختلف مناطق اليمن، ونتعرّف على ما يميز كل شاطئ وما يجعله من الأماكن التي تستحق الاكتشاف.",
  "icon": "fa-brands fa-tiktok",
  "category": "محتوى متنوع"
 },
 {
  "id": "h1",
  "title": "تعرف على ابطال ثورة الـ 26 من سبتمبر",
  "url": "https://www.instagram.com/reel/DdEk0wVqNTe/?stkn=MXBjaXY2MWY0bXRrMA==",
  "platform": "Instagram",
  "image": "./img/m1.jpg",
  "year": "2026",
  "order": 15,
  "showOnHome": true,
  "showOnProjects": false,
  "visible": true,
  "categoryId": "cat1",
  "categoryIds": [
   "cat7",
   "cat4"
  ],
  "description": "في هذا الفيديو نسلّط الضوء على أبرز شهداء ثورة 26 سبتمبر، ونتذكر أسماء رجال قدّموا تضحيات كبيرة في سبيل الثورة والجمهورية، ونتعرف على جانب من قصصهم ومواقفهم ودورهم في تلك المرحلة المهمة من تاريخ اليمن. نستعرض محطات من حياتهم وما قدّموه، ونستذكر تضحياتهم التي بقيت حاضرة في ذاكرة اليمنيين، مع التوقف عند بعض الأحداث والمواقف التي ارتبطت بهم وبثورة 26 سبتمبر. هذا الفيديو محاولة للتعريف بهم وإحياء ذكراهم، حتى تبقى قصصهم وتضحياتهم معروفة للأجيال القادمة.",
  "icon": "fa-brands fa-instagram",
  "category": "الثورات اليمنية"
 },
 {
  "id": "h2",
  "title": "ابطال وقيادات ثوره الـ 14 من اكتوبر",
  "url": "https://www.tiktok.com/@mohomx/video/7686141077304151317",
  "platform": "TikTok",
  "image": "./img/m2.jpg",
  "year": "2026",
  "order": 16,
  "showOnHome": true,
  "showOnProjects": false,
  "visible": true,
  "categoryId": "cat1",
  "categoryIds": [
   "cat7",
   "cat2"
  ],
  "description": "في هذا الفيديو نسلّط الضوء على أبرز أبطال وقيادات ثورة 14 أكتوبر، ونتعرّف على رجال كان لهم دور بارز في مقاومة الاستعمار البريطاني والمشاركة في مسيرة الثورة. نستعرض جانبًا من قصصهم ومواقفهم، ونتوقف عند بعض المحطات المهمة التي ارتبطت بهم وبالثورة، ونتعرّف على تضحياتهم والجهود التي بذلوها في سبيل التحرر والاستقلال. هذا الفيديو محاولة للتعريف بأبرز الشخصيات التي ارتبط اسمها بثورة 14 أكتوبر، واستحضار صفحات من تاريخ اليمن الحديث للأجيال القادمة.",
  "icon": "fa-brands fa-tiktok",
  "category": "الثورات اليمنية"
 },
 {
  "id": "h3",
  "title": "ماذا أخذ القات من اليمنيين ؟",
  "url": "",
  "platform": "YouTube",
  "image": "./img/m3.jpg",
  "year": "2026",
  "order": 17,
  "showOnHome": true,
  "showOnProjects": false,
  "visible": true,
  "categoryId": "cat4",
  "categoryIds": [
   "cat23"
  ],
  "description": "في هذا الفيديو نتحدث عن تأثير القات على حياة اليمنيين، ونتوقف عند بعض الجوانب التي ارتبطت بانتشاره في المجتمع، من الوقت والمال إلى العادات اليومية والعلاقات الاجتماعية. نستعرض كيف أصبح القات جزءًا من حياة الكثير من الناس، وما الذي قد يخسره الفرد والمجتمع بسببه، مع طرح الموضوع بطريقة بسيطة ومباشرة تساعد على التفكير في العادات التي نمارسها وتأثيرها على حياتنا ومستقبلنا.",
  "icon": "fa-brands fa-youtube",
  "category": "توعية"
 }
];
export const SEED_REVIEWS = [
 {
  "id": "r1",
  "name": "𝓈𝓁𝓂𝒶𝓃",
  "text": "من يوم تابعتك وأنا أشوف محتواك يتطور أكثر وأكثر، وأحلى شي إنك تتكلم عن أشياء تخص اليمن ونستفيد منها. كمل يا حبيبي، والله إنك مبدع وتستاهل كل خير",
  "image": "./img/u.png",
  "visible": true,
  "order": 1
 },
 {
  "id": "r2",
  "name": "سلطان 🇾🇪",
  "text": "من يوم تابعتك وأنا أشوف محتواك يتغير للأفضل، وأحلى شي إنك دايم تجيب مواضيع جديدة ومفيدة. استمر يا حبيبي ولا توقف، وإن شاء الله نشوفك من نجاح لنجاح",
  "image": "./img/u.png",
  "visible": true,
  "order": 2
 },
 {
  "id": "r3",
  "name": "البافضلي",
  "text": "والله إن محتواك كل يوم يعجبني أكثر، خصوصًا لما تتكلم عن اليمن وتجيب لنا معلومات ما كنا نعرفها. استمر ولا عليك من أي كلام، وإن شاء الله الأيام الجاية تشوف فيها نجاح أكبر.",
  "image": "./img/u.png",
  "visible": true,
  "order": 3
 }
];
export const SEED_SOCIAL_ICONS = [
 {
  "id": "si1",
  "name": "TikTok",
  "url": "https://www.tiktok.com/@mohomx",
  "icon": "fa-brands fa-tiktok",
  "cls": "social-tiktok",
  "image": "",
  "order": 1,
  "visible": true
 },
 {
  "id": "si2",
  "name": "Snapchat",
  "url": "https://www.snapchat.com/@mohom_x",
  "icon": "fa-brands fa-snapchat",
  "cls": "social-snapchat",
  "image": "",
  "order": 2,
  "visible": true
 },
 {
  "id": "si3",
  "name": "YouTube",
  "url": "https://youtube.com/@mohomx?si=llweUor6yP6_Pa_M",
  "icon": "fa-brands fa-youtube",
  "cls": "social-youtube",
  "image": "",
  "order": 3,
  "visible": true
 },
 {
  "id": "si4",
  "name": "Instagram",
  "url": "https://www.instagram.com/mohomx?stkn=NTJ2cHB4Nmtlb2hn",
  "icon": "fa-brands fa-instagram",
  "cls": "social-instagram",
  "image": "",
  "order": 4,
  "visible": true
 }
];
