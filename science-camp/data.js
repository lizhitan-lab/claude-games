/* 科学技能训练营 — content for 三年级科学 第1课 科学技能
 * Every Chinese string is shown with pinyin and can be read aloud.
 * `en` fields are the hidden English hints (shown only when the ? button is tapped).
 */
window.CAMP = (function () {
  const SKILLS = ['观察', '分类', '测量', '推断', '预测', '沟通'];

  /* ---------------- Words to write (all are 会写) ---------------- */
  const WORDS = {
    s1: [
      { w: '观察', en: 'observe' },
      { w: '分类', en: 'classify' },
      { w: '测量', en: 'measure' },
      { w: '推断', en: 'infer' },
      { w: '预测', en: 'predict' },
      { w: '沟通', en: 'communicate' },
    ],
    s2: [
      { w: '特征', en: 'feature / characteristic' },
      { w: '光滑', en: 'smooth' },
      { w: '粗糙', en: 'rough' },
      { w: '颜色', en: 'colour' },
      { w: '味道', en: 'taste' },
      { w: '溶解', en: 'dissolve' },
    ],
    s3: [
      { w: '经验', en: 'experience' },
      { w: '空气', en: 'air' },
      { w: '天气', en: 'weather' },
      { w: '原因', en: 'reason / cause' },
      { w: '表情', en: 'facial expression' },
      { w: '现象', en: 'phenomenon (something that happens)' },
    ],
    s4: [
      { w: '变化', en: 'change' },
      { w: '温度', en: 'temperature' },
      { w: '数量', en: 'number / amount' },
      { w: '结果', en: 'result' },
      { w: '资料', en: 'information / data' },
      { w: '记录', en: 'record' },
    ],
    s5: [
      { w: '长度', en: 'length' },
      { w: '时间', en: 'time' },
      { w: '量筒', en: 'measuring cylinder' },
      { w: '读数', en: 'reading (on a scale)' },
      { w: '工具', en: 'tool' },
      { w: '秒表', en: 'stopwatch' },
    ],
    s6: [
      { w: '土壤', en: 'soil' },
      { w: '渗水', en: 'let water seep through' },
      { w: '漏斗', en: 'funnel' },
      { w: '手套', en: 'gloves' },
      { w: '清洗', en: 'wash / clean' },
      { w: '安全', en: 'safe / safety' },
    ],
  };

  /* Fill-in sentences: ＿ marks where the word goes. */
  const FILL = {
    观察: ['小明用放大镜仔细地＿花朵。', 'Xiao Ming carefully ___ the flower with a magnifying glass.'],
    分类: ['我们把水果按颜色＿。', 'We ___ the fruits by colour.'],
    测量: ['我们用尺＿铅笔的长度。', 'We use a ruler to ___ the length of the pencil.'],
    推断: ['鱼都游到水面，我＿水里没有足够的空气。', 'The fish all swim to the surface, so I ___ there is not enough air in the water.'],
    预测: ['天空乌云密布，我＿快要下雨了。', 'The sky is full of dark clouds. I ___ it will rain soon.'],
    沟通: ['我们把结果画成图表，与同学＿。', 'We draw the results as a chart to ___ with classmates.'],
    特征: ['果皮的粗滑是水果的一种＿。', 'Rough or smooth skin is one ___ of a fruit.'],
    光滑: ['苹果的果皮很＿。', 'An apple’s skin is very ___.'],
    粗糙: ['菠萝的果皮很＿。', 'A pineapple’s skin is very ___.'],
    颜色: ['青苹果的＿是绿色的。', 'The ___ of a green apple is green.'],
    味道: ['柠檬的＿是酸的。', 'The ___ of a lemon is sour.'],
    溶解: ['糖放进水中搅拌后会＿。', 'Sugar will ___ after it is stirred into water.'],
    经验: ['雪恩根据以往的＿作出推断。', 'Xue En makes an inference based on past ___.'],
    空气: ['水里没有足够的＿，鱼都游到水面。', 'There is not enough ___ in the water, so the fish swim to the surface.'],
    天气: ['我们可以根据观察，推断当时的＿。', 'From what we observe, we can infer the ___ at that time.'],
    原因: ['手电筒不亮的＿可能是电池没电了。', 'The ___ the torch won’t light may be a flat battery.'],
    表情: ['根据他们的＿，推断谁吃到酸的橙。', 'From their ___, infer who ate the sour orange.'],
    现象: ['我们根据资料来解释所观察到的＿。', 'We use information to explain the ___ we observe.'],
    变化: ['香蕉放了三天，颜色有了＿。', 'After three days, the banana’s colour has a ___.'],
    温度: ['我们用温度计测量水的＿。', 'We use a thermometer to measure the water’s ___.'],
    数量: ['P动物的＿每两年减少一百只。', 'The ___ of animal P drops by 100 every two years.'],
    结果: ['我们要记录观察的＿。', 'We must record the ___ of our observation.'],
    资料: ['我们根据收集到的＿作出预测。', 'We make predictions from the ___ we collect.'],
    记录: ['一个小时后，测量并＿水的温度。', 'After one hour, measure and ___ the water temperature.'],
    长度: ['我们用尺测量课本的＿。', 'We use a ruler to measure the textbook’s ___.'],
    时间: ['我们用秒表测量网球滚动的＿。', 'We use a stopwatch to measure the ___ the tennis ball rolls.'],
    量筒: ['我们用＿测量水的体积。', 'We use a ___ to measure the volume of water.'],
    读数: ['读取＿时，视线要与弯月面平行。', 'When taking a ___, your eye must be level with the water surface.'],
    工具: ['我们要使用合适的测量＿。', 'We must use the right measuring ___.'],
    秒表: ['小华用＿记录时间。', 'Xiao Hua uses a ___ to record the time.'],
    土壤: ['沙土、黏土和壤土都是＿。', 'Sand, clay and loam are all kinds of ___.'],
    渗水: ['沙土的＿性最强。', 'Sandy soil lets water ___ through best.'],
    漏斗: ['把滤纸放进＿中。', 'Put the filter paper into the ___.'],
    手套: ['处理标本前要戴＿。', 'Wear ___ before handling specimens.'],
    清洗: ['我们要用刷子＿量筒。', 'We use a brush to ___ the measuring cylinder.'],
    安全: ['科学用具要正确及＿地存放。', 'Science apparatus must be stored correctly and ___.'],
  };

  /* Sentence building (连词成句). Tiles are in the correct order here; the game shuffles them. */
  const BUILD = {
    s1: [{ tiles: ['我们', '用尺', '测量', '铅笔的长度。'], en: 'We measure the pencil’s length with a ruler.' }],
    s2: [{ tiles: ['我们', '根据颜色', '把水果', '分类。'], en: 'We classify the fruits by colour.' }],
    s3: [
      { tiles: ['鱼都游到水面，', '我推断', '水里没有', '足够的空气。'], en: 'The fish swim to the surface; I infer there is not enough air in the water.' },
      { tiles: ['手电筒不亮，', '我推断', '电池', '没电了。'], en: 'The torch won’t light; I infer the battery is flat.' },
    ],
    s4: [
      { tiles: ['天空乌云密布，', '我预测', '快要', '下雨了。'], en: 'The sky is full of dark clouds; I predict it will rain soon.' },
      { tiles: ['冰块在热水中', '会溶化得', '比较快。'], en: 'Ice melts faster in hot water.' },
    ],
    s5: [{ tiles: ['读数时，', '视线要', '与弯月面', '平行。'], en: 'When reading, your eye must be level with the water surface.' }],
    s6: [
      { tiles: ['处理标本前，', '我们', '要戴上', '手套。'], en: 'Before handling specimens, we put on gloves.' },
      { tiles: ['洗好的漏斗', '要晾干后', '才放回原位。'], en: 'Washed funnels must be dried before being put back.' },
    ],
  };

  /* ---------------- Station 1: 技能小雷达 ---------------- */
  const SPOT = [
    { scene: '🔍🌺', t: '小明用放大镜仔细地看花。', a: '观察', en: 'Xiao Ming looks closely at a flower with a magnifying glass.', why: '用感官仔细地看、听、闻、尝、摸，就是观察。' },
    { scene: '👃🍋', t: '美美闻一闻柠檬，说：“好香啊！”', a: '观察', en: 'Meimei smells a lemon and says “It smells nice!”', why: '用鼻子闻也是用感官来观察。' },
    { scene: '🧱🟥🟦🟨', t: '志强把积木按颜色分成三组。', a: '分类', en: 'Zhiqiang sorts the blocks into three groups by colour.', why: '根据一个特征把东西分组，就是分类。' },
    { scene: '🐦🐟🐘', t: '老师请大家把动物分成“会飞”和“不会飞”两组。', a: '分类', en: 'The teacher asks everyone to sort animals into “can fly” and “cannot fly”.', why: '按“会不会飞”这个特征分组，就是分类。' },
    { scene: '📏🌱', t: '小玲用尺量一量植物有多高。', a: '测量', en: 'Xiao Ling uses a ruler to see how tall the plant is.', why: '用工具得出数目，就是测量。' },
    { scene: '⏱️🎾', t: '小华用秒表记录网球滚了几秒。', a: '测量', en: 'Xiao Hua uses a stopwatch to record how many seconds the ball rolls.', why: '用秒表量时间，也是测量。' },
    { scene: '🐾🐾', t: '地上有小脚印，安安说：“有猫经过这里。”', a: '推断', en: 'There are small footprints. Anan says “A cat walked past here.”', why: '根据观察和经验，解释已经发生的事，就是推断。' },
    { scene: '🍊😖', t: '文凯吃橙后皱起眉头。雪恩说：“他吃到的橙是酸的。”', a: '推断', en: 'Wenkai frowns after eating an orange. Xue En says “His orange was sour.”', why: '雪恩根据表情和经验作出解释，这是推断。' },
    { scene: '☁️🚲', t: '天空乌云密布，小杰说：“快要下雨了，我们回家吧！”', a: '预测', en: 'Dark clouds fill the sky. Xiao Jie says “It’s going to rain soon!”', why: '说出将会发生的事，就是预测。' },
    { scene: '📉🐼', t: '这种动物的数量每年都减少，我想明年会更少。', a: '预测', en: 'This animal’s number drops every year; I think next year there will be even fewer.', why: '根据资料说出将来会怎样，就是预测。' },
    { scene: '📊🗣️', t: '小美把观察结果画成图表，向全班报告。', a: '沟通', en: 'Xiao Mei draws her results as a chart and reports to the class.', why: '用图表、文字或说话和别人分享，就是沟通。' },
    { scene: '📝👫', t: '志明把实验结果写下来，跟同学分享。', a: '沟通', en: 'Zhiming writes down his results and shares them with classmates.', why: '把结果写下来与人分享，就是沟通。' },
  ];

  /* ---------------- Station 2: 分类高手 ---------------- */
  const FRUITS = {
    pineapple: { e: '🍍', n: '菠萝', skin: '粗糙', taste: '甜' },
    strawberry: { e: '🍓', n: '草莓', skin: '粗糙', taste: '甜', color: '红色' },
    kiwi: { e: '🥝', n: '奇异果', skin: '粗糙', taste: '酸' },
    redapple: { e: '🍎', n: '红苹果', skin: '光滑', taste: '甜', color: '红色' },
    greenapple: { e: '🍏', n: '青苹果', skin: '光滑', taste: '酸', color: '绿色' },
    mango: { e: '🥭', n: '芒果', skin: '光滑', taste: '甜' },
    lemon: { e: '🍋', n: '柠檬', skin: '光滑', taste: '酸', color: '黄色' },
    banana: { e: '🍌', n: '香蕉', skin: '光滑', taste: '甜', color: '黄色' },
    cherry: { e: '🍒', n: '樱桃', color: '红色' },
    pear: { e: '🍐', n: '梨', color: '绿色' },
  };
  const SUBSTANCES = [
    { id: 'sand', n: '沙', dis: false, color: '#d9b26f' },
    { id: 'sugar', n: '糖', dis: true, color: '#ffffff' },
    { id: 'coffee', n: '咖啡粉', dis: true, color: '#6b3d1f', tint: '#a0703f' },
    { id: 'salt', n: '盐', dis: true, color: '#f4f4f4' },
    { id: 'pepper', n: '胡椒粉', dis: false, color: '#555' },
  ];

  /* ---------------- Station 3: 小侦探 ---------------- */
  const CASES = [
    {
      scene: '🍊🙂😖', t: '莫韩吃橙后皱起眉头，文凯吃橙后笑眯眯。',
      en: 'Mohan frowns after eating his orange; Wenkai smiles after eating his.',
      obs: [['莫韩皱起眉头，文凯在笑。', 1], ['橙是从商店买的。', 0], ['莫韩不喜欢文凯。', 0]],
      inf: [['莫韩吃到酸的橙，文凯吃到甜的橙。', 3], ['他们都吃到很甜的橙。', 0], ['文凯吃到酸的橙。', 0]],
      why: '根据表情和以往的经验：吃到酸的东西会皱眉。',
    },
    {
      scene: '🐠🐟🫧', t: '鱼缸里的鱼都游到水面，张开嘴巴。',
      en: 'All the fish in the tank swim to the surface with their mouths open.',
      obs: [['鱼都游到水面。', 1], ['鱼生病了。', 0], ['鱼缸是新买的。', 0]],
      inf: [['水里没有足够的空气。', 3], ['鱼肚子饿了，在等食物。', 2], ['鱼想晒太阳。', 0]],
      why: '推断可以多过一个。“没有足够的空气”是最合理的推断。',
    },
    {
      scene: '🔦👧❓', t: '小丽已经按下开关，可是手电筒不亮。',
      en: 'Xiao Li has pressed the switch, but the torch doesn’t light.',
      obs: [['手电筒不亮。', 1], ['电池没电了。', 0], ['手电筒很旧。', 0]],
      inf: [['电池没电了。', 3], ['灯泡坏了。', 2], ['手电筒在睡觉。', 0]],
      why: '“电池没电了”是推断，不是观察——我们看不到电池有没有电。',
    },
    {
      scene: '☂️☂️🚪', t: '餐馆门口放着很多湿湿的雨伞。',
      en: 'Many wet umbrellas are left at the restaurant door.',
      obs: [['门口的雨伞是湿的。', 1], ['外面在下雨。', 0], ['餐馆的食物很好吃。', 0]],
      inf: [['外面在下雨，或刚下过雨。', 3], ['今天天气很热。', 0], ['餐馆在卖雨伞。', 0]],
      why: '雨伞湿了，最合理的推断是下雨了。',
    },
    {
      scene: '🧴☀️🧔', t: '一位叔叔站在餐馆外，在手臂上涂防晒霜。',
      en: 'A man outside a restaurant is putting sunscreen on his arm.',
      obs: [['叔叔在涂防晒霜。', 1], ['天气很热。', 0], ['叔叔很饿。', 0]],
      inf: [['外面阳光很强，天气很热。', 3], ['外面在下大雨。', 0], ['叔叔要去游泳。', 1]],
      why: '涂防晒霜是为了防太阳晒，所以推断阳光很强。',
    },
    {
      scene: '🚗💧💧', t: '车子湿湿的，地上有很多积水。',
      en: 'The car is wet and there are puddles on the ground.',
      obs: [['车子是湿的，地上有积水。', 1], ['刚才下了大雨。', 0], ['车子是红色的。', 0]],
      inf: [['刚才下了大雨。', 3], ['有人在这里洗车。', 2], ['车子在出汗。', 0]],
      why: '车子和地都湿了，最合理的推断是刚下过大雨。',
    },
    {
      scene: '🍌🖤', t: '香蕉皮变黑了，摸起来软软的。',
      en: 'The banana skin has turned black and feels soft.',
      obs: [['香蕉皮变黑、变软。', 1], ['香蕉很好吃。', 0], ['香蕉是从树上摘的。', 0]],
      inf: [['香蕉已经放了很多天。', 3], ['有人把香蕉涂成黑色。', 0], ['香蕉刚买回来。', 0]],
      why: '根据经验，香蕉放久了会变黑、变软。',
    },
    {
      scene: '🐾🌧️', t: '下雨后，泥地上有一串小小的脚印。',
      en: 'After the rain, there is a line of small footprints in the mud.',
      obs: [['泥地上有小脚印。', 1], ['有猫经过。', 0], ['地上有花。', 0]],
      inf: [['有猫经过这里。', 3], ['有大象经过这里。', 0], ['脚印是自己长出来的。', 0]],
      why: '脚印小小的，像猫的脚印，所以推断有猫经过。',
    },
  ];

  /* ---------------- Generic multiple-choice questions ---------------- */
  // q: question, o: options (first is correct; game shuffles), en: hint, why: explanation, scene: emoji (optional)
  const Q = {
    s1: [
      { q: '科学是人类了解自然世界的一种＿＿。', o: ['方法与过程', '游戏', '故事'], en: 'Science is a ___ for people to understand the natural world.', why: '科学是人类找寻知识的一种方法与过程。', test: true },
      { q: '以下哪一项是“推断”？', o: ['地上很湿，刚才可能下过雨。', '这朵花是红色的。', '明天会很热。'], en: 'Which one is an INFERENCE?', why: '“花是红色的”是观察；“明天会很热”是预测。', test: true },
      { q: '观察时，我们用什么？', o: ['眼、耳、鼻、舌和手（感官）', '只用眼睛', '只用手'], en: 'What do we use when we observe?', why: '观察要用到各种感官。', test: true },
    ],
    s2: [
      { q: '同样的水果，可以用不同的特征来分类吗？', o: ['可以', '不可以'], en: 'Can the same fruits be classified using different features?', why: '用一个特征分类后，还可以用另一个特征再分类。' },
      { q: '沙放进水中搅拌后，会怎样？', o: ['沙沉在杯底，不溶解。', '沙不见了，溶解了。', '沙变成糖。'], en: 'What happens to sand stirred into water?', why: '沙不会溶解，它会沉在杯底。', test: true },
      { q: '分类时，我们先要找出东西的＿＿。', o: ['特征', '价钱', '名字长短'], en: 'Before classifying, we must find the things’ ___.', why: '科学家找出相同点和不同点（特征），然后分类。', test: true },
      { q: '用“有没有脚”来分类，蛇应该在哪一组？', scene: '🐍', o: ['没有脚', '有脚'], en: 'Classifying by “has legs or not”, which group is the snake in?', why: '蛇没有脚。', test: true },
    ],
    s3: [
      { q: '以下哪一个是观察，不是推断？', o: ['鱼都游到水面。', '水里没有足够的空气。', '鱼肚子饿了。'], en: 'Which is an OBSERVATION, not an inference?', why: '观察是我们用感官直接看到的；推断是我们的解释。', test: true },
      { q: '推断可以多过一个吗？', o: ['可以，推断可能对，也可能错。', '不可以，只能有一个。'], en: 'Can there be more than one inference?', why: '推断可以多过一个，可能是对的，也可能是错的。' },
      { q: '小强满头大汗，脸红红的。你可以作出什么推断？', scene: '😅🏃', o: ['他刚刚运动完。', '他的头发很长。', '他在睡觉。'], en: 'Xiao Qiang is sweaty with a red face. What can you infer?', why: '根据经验，运动后会流汗、脸红。', test: true },
    ],
    s4: [
      { q: '预测是根据什么作出的？', o: ['观察、经验或收集到的资料', '随便猜一猜', '做梦'], en: 'What are predictions based on?', why: '我们通过观察和旧有经验或可信的资料来预测。', test: true },
      { q: '预测一定会发生吗？', o: ['不一定，预测也许会发生，也可能不会发生。', '一定会发生。'], en: 'Will a prediction always come true?', why: '预测的事情也许会发生，也可能不会发生。' },
    ],
    s5: [
      { q: '使用量筒读数时，眼睛要怎样？', o: ['视线与弯月面平行', '从上面往下看', '从下面往上看'], en: 'When reading a measuring cylinder, where should your eyes be?', why: '视线要与弯月面（水面）平行，读数才准确。', test: true },
      { q: '测量回形针的长度，用什么单位最合适？', scene: '📎', o: ['厘米', '公里', '公斤'], en: 'Which unit is best for a paperclip’s length?', why: '回形针很短，用厘米最合适。', test: true },
    ],
    s6: [
      { q: '去收集土壤前，要先做什么？', scene: '🧤🪴', o: ['戴上手套', '直接用手抓', '先吃点心'], en: 'Before collecting soil, what should you do first?', why: '处理标本前要戴上手套，保护双手。' },
      { q: '为什么三个漏斗要放入相同分量的土壤？', o: ['这样比较才公平', '因为土壤不够', '因为比较好看'], en: 'Why put the same amount of soil in each funnel?', why: '只改变土壤的种类，其他都一样，比较才公平。' },
      { q: '使用玻璃器材时，要注意什么？', scene: '🧪', o: ['小心轻放，以免打破', '用力敲一敲', '边跑边拿'], en: 'What should you remember when using glassware?', why: '玻璃器材容易破，要小心使用。' },
    ],
    s6lab: [
      { q: '哪一种土壤的渗水性最强？', o: ['沙土', '壤土', '黏土'], en: 'Which soil lets water through best?', why: '沙土的量筒里的水最多，表示沙土的渗水性最强。', test: true },
      { q: '种植P植物需要含水量多的土壤。哪一种土壤最适合？', o: ['黏土', '沙土', '壤土'], en: 'Plant P needs soil that holds lots of water. Which soil is best?', why: '黏土只让很少的水渗下去，它保留了最多的水。', test: true },
    ],
    s6after: [
      { q: '活动后，怎样处理土壤标本？', o: ['把土壤放回原处', '丢进河里', '带回家玩'], en: 'After the activity, what do you do with the soil?', why: '要正确和小心地处理标本，把它放回原处。' },
      { q: '怎样清洗量筒？', o: ['用刷子刷洗', '用手指挖一挖', '不用洗'], en: 'How do you clean a measuring cylinder?', why: '用刷子才能把量筒洗干净。' },
      { q: '洗好的漏斗要怎样存放？', o: ['晾干后才放回原位', '湿湿的马上放进柜子', '放在地上'], en: 'How should you store a washed funnel?', why: '用具要晾干后才放回原位。' },
      { q: '活动后，丽莎把毛虫放回树叶上。她做得对吗？', scene: '🐛🍃', o: ['对，要把生物放回原处。', '不对，应该带回家。'], en: 'After the activity, Lisa puts the caterpillar back on the leaf. Is she right?', why: '我们要爱护生物，把它放回原来的地方。', test: true },
      { q: '画标本、科学用具和材料时，要怎样？', scene: '✏️📓', o: ['画得清楚和正确', '随便画一画', '画得越大越好'], en: 'How should we draw specimens and apparatus?', why: '我们要清楚及正确地画出观察结果。', test: true },
    ],
  };

  /* ---------------- Station 4: predictions ---------------- */
  const PREDICT = [
    { kind: 'cloth', q: '预测：哪一条手帕会比较快干？', o: [['手帕 M（外面，有风有阳光）', 1], ['手帕 N（屋里，没有风）', 0], ['一样快', 0]], en: 'Predict: which handkerchief dries faster?', why: '有风和阳光的地方，湿手帕干得比较快。' },
    { kind: 'ice', q: '把相同大小的冰块放进热水和冷水。预测：哪一杯的冰块溶化得比较快？', o: [['热水', 1], ['冷水', 0], ['一样快', 0]], en: 'Same-size ice in hot and cold water. Which melts faster?', why: '热水的温度比较高，冰块溶化得比较快。', test: true },
    { kind: 'cups', q: '用黑色和白色纸包着两个容器，装相同的水，放在太阳下晒一个小时。预测：哪一个的水温比较高？', o: [['黑色容器', 1], ['白色容器', 0], ['一样高', 0]], en: 'Black- and white-wrapped containers in the sun for an hour. Which water is warmer?', why: '黑色比较会吸热，所以黑色容器的水温比较高。' },
    { kind: 'chart', year: 2019, q: '观察资料。预测：2019年，P动物的数量会是多少？', o: [['350 只', 1], ['450 只', 0], ['550 只', 0]], en: 'Look at the data. Predict the number of animal P in 2019.', why: '每两年减少100只：650 → 550 → 450 → 350。' },
    { kind: 'chart', year: 2021, q: '再预测：2021年，P动物的数量会是多少？', o: [['250 只', 1], ['350 只', 0], ['650 只', 0]], en: 'Predict again: how many in 2021?', why: '350 再减少100只，就是250只。', test: true },
    { kind: 'chart', year: 2027, q: '如果这样的变化持续下去，2027年P动物会怎样？', o: [['P动物可能会消失（没有了）。', 1], ['P动物会变得更多。', 0], ['没有变化。', 0]], en: 'If the trend continues, what happens to animal P in 2027?', why: '2023年150只，2025年50只，到了2027年可能一只都没有了。', test: true },
    { kind: 'emoji', scene: '👟➡️👟', q: '一双新鞋子穿了一个月后，鞋底变平了一些。预测：两个月后，鞋底会怎样？', o: [['磨损得更严重，变得更平。', 1], ['变回新的。', 0], ['没有变化。', 0]], en: 'A shoe sole wore down after one month. Predict two months.', why: '继续使用，鞋底会磨损得更多。' },
    { kind: 'emoji', scene: '🔦💡', q: '如果手电筒一直亮着，很长时间都不关，预测会有什么变化？', o: [['越来越暗，最后不亮。', 1], ['越来越亮。', 0], ['永远一样亮。', 0]], en: 'If a torch is left on for a long time, what will happen?', why: '电池的电会慢慢用完，所以手电筒会变暗。', test: true },
    { kind: 'emoji', scene: '🍌📅', q: '老师把一根快要坏的香蕉放在桌上。预测：三天后，香蕉会怎样？', o: [['变黑、变软。', 1], ['变绿、变硬。', 0], ['变成苹果。', 0]], en: 'A nearly-ripe banana is left out. What will it be like after 3 days?', why: '香蕉放久了会变黑、变软。' },
  ];

  /* ---------------- Station 5: measuring ---------------- */
  const TOOLS = {
    ruler: { e: '📏', n: '尺' },
    stopwatch: { e: '⏱️', n: '秒表' },
    cylinder: { e: '🧪', n: '量筒' },
    thermo: { e: '🌡️', n: '温度计' },
  };
  const TOOL_Q = [
    { t: '铅笔的长度', a: 'ruler', scene: '✏️', en: 'the length of a pencil' },
    { t: '网球滚动的时间', a: 'stopwatch', scene: '🎾', en: 'how long a tennis ball rolls' },
    { t: '水的体积', a: 'cylinder', scene: '💧', en: 'the volume of water' },
    { t: '水的温度', a: 'thermo', scene: '♨️', en: 'the temperature of water' },
    { t: '课本的长度', a: 'ruler', scene: '📘', en: 'the length of a textbook' },
  ];

  const STATIONS = [
    { id: 's1', n: '技能小雷达', e: '📡', sub: '认识六种科学程序技能', color: '#ff8a5b' },
    { id: 's2', n: '分类高手', e: '🧺', sub: '观察特征，把东西分类', color: '#ffc542' },
    { id: 's3', n: '小侦探', e: '🕵️', sub: '先观察，再推断', color: '#5bc0eb' },
    { id: 's4', n: '预测水晶球', e: '🔮', sub: '根据资料作出预测', color: '#a77bdb' },
    { id: 's5', n: '测量小能手', e: '📏', sub: '用正确的工具和方法测量', color: '#4ecb71' },
    { id: 's6', n: '小小实验室', e: '🧪', sub: '会渗水的土壤（操纵性技能）', color: '#ef6f9a' },
  ];

  return { SKILLS, WORDS, FILL, BUILD, SPOT, FRUITS, SUBSTANCES, CASES, Q, PREDICT, TOOLS, TOOL_Q, STATIONS };
})();
